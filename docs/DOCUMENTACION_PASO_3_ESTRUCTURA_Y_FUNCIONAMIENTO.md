# Documentación Técnica: Paso 3 (Plan Instruccional)

Este documento describe la estructura actual, el funcionamiento y el flujo de datos del **Paso 3 (Instructional Plan)**. A diferencia del plan original, la implementación actual incorpora una estrategia de **procesamiento por lotes (batching)** para manejar los límites de tiempo en funciones serverless y la complejidad de la generación de IA.

## 1. Visión General

El **Paso 3** transforma el Temario (Paso 2) en un **Plan Instruccional detallado** para cada lección. Define _cómo_ se enseñará cada tema, especificando:

- Objetivos de Aprendizaje (OA) operables (Verbo Bloom + Criterio).
- Componentes obligatorios (Diálogo, Lectura, Quiz).
- Componentes prácticos (Demos, Ejercicios) según el nivel cognitivo.
- Bloqueadores o riesgos potenciales.

---

## 2. Arquitectura del Dominio (`src/domains/instructionalPlan`)

La lógica está modularizada dentro del dominio `instructionalPlan`:

### Estructura de Carpetas

```
src/domains/instructionalPlan/
├── components/          # Componentes UI (Visor, Chips, Checklist DoD)
├── hooks/               # Hooks (gestión de estado UI)
├── services/            # Lógica de negocio y comunicación con Supabase
├── types/               # Definiciones TypeScript
├── validators/          # Lógica de validación (V01-V05, S01-S03)
└── index.ts             # Barrel file
```

---

## 3. Modelo de Datos

### Entidades Principales

**1. LessonPlan (Plan de Lección)**
Define la estrategia para _una_ lección específica.

```typescript
interface LessonPlan {
  lesson_id: string;
  oa_text: string; // "El participante podrá..."
  oa_bloom_verb: string; // Ej: "Analizar"
  measurable_criteria: string; // Ej: "Rúbrica de evaluación"
  components: PlanComponent[]; // Lista de componentes
  alignment_notes: string; // Justificación pedagógica
}
```

**2. PlanComponent (Componente)**
Bloques de contenido dentro de una lección.

- **Tipos**: `DIALOGUE`, `READING`, `QUIZ` (Obligatorios), `DEMO_GUIDE`, `EXERCISE`, `VIDEO_THEORETICAL` (Opcionales/Condicionales).

**3. Blocker (Bloqueador)**
Riesgos identificados por la IA o el usuario.

- Grados de impacto: `LOW`, `MEDIUM`, `HIGH`.
- Estado: `OPEN`, `RESOLVED`, `WONT_FIX`.

---

## 4. Funcionamiento del Pipeline (Batching & Background)

Debido a que generar planes detallados para muchas lecciones toma mucho tiempo, se implementó una arquitectura asíncrona robusta:

### A. Servicio Principal (`instructionalPlan.service.ts`)

1.  **Trigger**: Inicia la generación delegando a una **Background Function** (`/.netlify/functions/instructional-plan-background`).
2.  **Fire-and-Forget**: No espera la respuesta completa, sino que retorna control inmediato a la UI.
3.  **Polling**: El frontend consulta periódicamente el estado en la base de datos.
4.  **Estado**: Maneja transiciones (`STEP_GENERATING` -> `STEP_VALIDATING` -> `STEP_READY_FOR_REVIEW`).

### B. API Route (`/api/instructional-plan`)

Esta ruta actúa como el "cerebro" de la generación, pero con una **estrategia de lotes**:

- **Batch Size**: Procesa lecciones de 1 en 1 (configurable `BATCH_SIZE = 1`) para evitar timeouts de 26s (límite común en serverless).
- **Lógica de Reentrada**: Recibe los planes ya generados (`existingPlans`) y genera solo el siguiente lote (`batchIndex`).
- **Orquestación**: La _Background Function_ es quien llama a esta API repetidamente en un bucle hasta completar todas las lecciones.

### C. Prompts

A diferencia del Paso 2, los prompts **no están hardcodeados** en la ruta. Se importan desde `src/shared/config/prompts/instructional-plan.prompts.ts`, permitiendo versionado y fácil edición.

---

## 5. Sistema de Validación

Una vez generados todos los planes, se ejecutan validaciones estrictas:

### Validaciones Automáticas (V0x)

- **V01 Completes**: ¿Están todas las lecciones del temario?
- **V02 OA Defined**: ¿Tienen las lecciones un Objetivo de Aprendizaje?
- **V03 Required Components**: ¿Tienen DIALOGUE, READING y QUIZ?
- **V04 Blockers**: ¿Se han documentado bloqueadores o marcado "Sin bloqueadores"?
- **V05 Iterations**: ¿Se ha excedido el límite de reintentos (2)?

### Validaciones Semánticas (S0x)

- **S01 OA Operable**: Verifica presencia de verbo Bloom y criterio de medición.
- **S02 Alignment**: Si el verbo es práctico (ej: "Crear"), exige componentes prácticos (`DEMO_GUIDE` / `EXERCISE`).
- **S03 Contradictions**: Busca inconsistencias en las notas del modelo.

---

## 6. Diferencias Clave: Plan vs. Implementación Actual

| Característica       | Plan Original                             | Implementación Actual                              | Razón                                                             |
| -------------------- | ----------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| **Ejecución IA**     | Un solo prompt gigante para todo el curso | **Batching (Lotes)** por lección                   | Evitar timeouts y alucinaciones en cursos largos.                 |
| **Ubicación Prompt** | En API Route                              | Importado de `shared/config`                       | Mejor mantenibilidad y separación de código/config.               |
| **Timeout Handling** | No especificado                           | **Manejo explícito** con promesas (`Promise.race`) | Robustez ante latencia de Gemini.                                 |
| **Parsing**          | JSON simple                               | **Parsing Resiliente** con Regex                   | Gemini a veces incluye texto antes del JSON ("Thinking process"). |
| **Componentes**      | Lista básica                              | **Inyección de IDs** desde Temario                 | Asegura consistencia relacional entre pasos.                      |

---

## 7. Referencia para Nuevo Proyecto

Para replicar este paso, necesitarás:

1.  **Estructura de BD**: Tabla `instructional_plans` (JSONB para planes, bloqueadores y DoD).
2.  **Infraestructura**:
    - Una **Function Background** que orqueste el bucle de llamadas.
    - El endpoint `/api/instructional-plan` que acepte `batchIndex`.
3.  **Configuración de Prompts**: Archivo separado para el prompt de sistema.
4.  **Componentes Frontend**:
    - Un visor que soporte renderizado de largas listas de lecciones.
    - Paneles para gestión de Bloqueadores y Checklist DoD (Definition of Done).

Esta arquitectura es significativamente más robusta para producción que una implementación simple de "una sola llamada".
