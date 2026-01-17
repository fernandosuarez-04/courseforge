# Guía de Migración: Paso 1 - Generación de Artefacto

Este documento contiene toda la lógica, código y esquemas necesarios para replicar la funcionalidad de "Generación de Artefacto" (Paso 1) en el nuevo repositorio.

## 1. Arquitectura del Flujo

1.  **Formulario (Frontend):** Recoge `tema`, `idea`, `publico`, `resultados`.
2.  **Service (Frontend):** Crea un registro inicial en BD (`state: GENERATING`) y llama al API.
3.  **API Route (Backend):**
    - Usa `gemini-2.5-pro` (o similar) con **Google Search** habilitado.
    - Investiga el tema en internet.
    - Genera estructura JSON (Nombres, Objetivos, Descripción).
    - Valida verbos Bloom y reintenta automáticamente si falla.
4.  **Service (Frontend - Post API):**
    - Recibe el JSON.
    - Ejecuta validaciones finales (`validateContent`).
    - Actualiza BD a `READY_FOR_QA` o `ESCALATED`.

---

## 2. Requisitos de Base de Datos (Supabase)

Asegúrate de que la tabla `artifacts` exista con esta estructura (inferida del código):

```sql
create type artifact_state as enum (
  'DRAFT', 'GENERATING', 'VALIDATING', 'READY_FOR_QA',
  'APPROVED', 'REJECTED', 'ESCALATED'
);

create table artifacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Campos Core
  run_id text,
  course_id text,
  idea_central text not null,

  -- Campos Generados (JSON/Arrays)
  nombres text[],           -- Array de strings
  objetivos text[],         -- Array de strings
  descripcion jsonb,        -- { texto, publico_objetivo, beneficios, ... }

  -- Estado y Pipeline
  state artifact_state default 'DRAFT',
  validation_report jsonb,  -- { all_passed: bool, results: [...] }
  semantic_result jsonb,    -- { passed: bool, confidence: float, rationale: string }

  -- Metadata
  auto_retry_count int default 0,
  iteration_count int default 0,
  generation_metadata jsonb default '{}',
  created_by uuid references auth.users(id)
);

-- Tabla para logs de eventos
create table pipeline_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  artifact_id uuid references artifacts(id) on delete cascade,
  event_type text,
  event_data jsonb
);
```

---

## 3. Código del Backend (Brain)

**Archivo:** `src/app/api/generate/route.ts`

```typescript
// API Route para generacion ESP-01 (server-side) con reintentos
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_RETRIES = 3;
const BLOOM_VERBS = [
  "comprender",
  "aplicar",
  "analizar",
  "evaluar",
  "crear",
  "desarrollar",
  "identificar",
  "describir",
  "diseñar",
  "implementar",
  "demostrar",
  "explicar",
];

export async function POST(request: NextRequest) {
  try {
    const { ideaCentral } = await request.json();

    if (!ideaCentral) {
      return NextResponse.json(
        { error: "ideaCentral es requerido" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey!);

    // MODELO DE INVESTIGACIÓN (Con Google Search)
    const modelName = process.env.GEMINI_RESEARCH_MODEL || "gemini-2.5-pro";
    const tools = [{ googleSearch: {} }];

    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: tools,
    });

    console.log(`[API/ESP-01] Generando con ${modelName} + Google Search...`);

    // 1. Generación Inicial
    let content = await generateInitialContent(model, ideaCentral);

    // 2. Validación y Reintentos Automáticos
    const validation = validateContent(content);

    // Reintento: Objetivos (Verbos Bloom)
    if (!validation.val004.passed) {
      content.objetivos = await retryObjectives(
        model,
        ideaCentral,
        content.objetivos,
      );
    }

    // Reintento: Nombres (Cantidad 3)
    if (!validation.val001.passed) {
      content.nombres = await retryNames(model, ideaCentral, content.nombres);
    }

    // Reintento: Descripción (Completitud)
    if (!validation.val003.passed) {
      content.descripcion = await retryDescription(
        model,
        ideaCentral,
        content.descripcion,
      );
    }

    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- PROMPT MASTER ---
async function generateInitialContent(model: any, ideaCentral: string) {
  const prompt = `Eres un experto en diseño instruccional y creación de cursos empresariales.

**IMPORTANTE: Tienes acceso a Google Search. UTILIZA LA BÚSQUEDA WEB para:**
- Investigar información actualizada sobre el tema
- Verificar tendencias y mejores prácticas actuales

Genera el artefacto base para un curso basado en:
**IDEA CENTRAL:** ${ideaCentral}

INSTRUCCIONES:
1. PRIMERO, busca información actualizada
2. LUEGO, genera el contenido basándote en esa investigación
3. Los objetivos DEBEN iniciar con verbos de Bloom (Comprender, Aplicar, Analizar, etc.)

Formato JSON:
{
  "nombres": ["Nombre 1", "Nombre 2", "Nombre 3"],
  "objetivos": ["Verbo + descripción", ...],
  "descripcion": {
    "texto": "...",
    "publico_objetivo": "...",
    "beneficios": "...",
    "estructura_general": "...",
    "diferenciador": "..."
  }
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  // ... lógica de parsing de JSON ...
  const text = response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
}

// ... Funciones de retryObjectives, retryNames, retryDescription y validateContent ...
// (Ver archivo original para implementación completa de reintentos)
function validateContent(content: any) {
  return {
    val001: { passed: content.nombres?.length === 3, message: "3 nombres" },
    val003: {
      passed: content.descripcion?.texto?.length > 15,
      message: "Desc completa",
    },
    val004: {
      passed: content.objetivos?.every((o: string) =>
        BLOOM_VERBS.some((v) => o.toLowerCase().startsWith(v)),
      ),
      message: "Verbos Bloom",
    },
  };
}
// ...
```

---

## 4. Código del Orchestrator (Frontend Service)

**Archivo:** `src/domains/generation/services/generation.service.ts`

```typescript
import { artifactsService } from "@/domains/artifacts/services/artifacts.service";

export const generationService = {
  async startGeneration(input: { ideaCentral: string; courseId?: string }) {
    // 1. Crear Artefacto (Estado: GENERATING)
    const artifact = await artifactsService.create({
      idea_central: input.ideaCentral,
      course_id: input.courseId || null,
      state: "GENERATING",
    });

    // 2. Ejecutar Pipeline (No bloqueante / Async)
    this.runPipeline(artifact.id, input.ideaCentral);

    return { success: true, artifactId: artifact.id };
  },

  async runPipeline(artifactId: string, ideaCentral: string) {
    try {
      // LLAMADA AL API
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaCentral }),
      });

      const content = await response.json();

      // Validar localmente
      const validationResults = this.validateContent(content);
      const allPassed = validationResults.every((r) => r.passed);

      // Actualizar Artefacto
      await artifactsService.update(artifactId, {
        state: allPassed ? "READY_FOR_QA" : "ESCALATED",
        nombres: content.nombres,
        objetivos: content.objetivos,
        descripcion: content.descripcion,
        validation_report: {
          all_passed: allPassed,
          results: validationResults,
        },
      });
    } catch (error) {
      await artifactsService.update(artifactId, { state: "ESCALATED" });
    }
  },

  validateContent(content: any) {
    // Implementación duplicada de validaciones para seguridad frontend
    // Chequea: Nombres == 3, Objetivos >= 3, Descripción completa, Verbos Bloom
    return [
      // ... array de resultados { code, passed, message }
    ];
  },
};
```
