# Paso 6: Producción Visual (GO-OP-06)

## 📋 Resumen Ejecutivo

**Fase 3.1** – Generación de materiales visuales: Slides, B-roll, animaciones y screencasts.

> **Nota**: Este paso se realiza de forma **manual asistida por IA**.

| Aspecto | Detalle |
|---------|---------|
| **Responsable** | IA + Humano |
| **Estado Actual** | 🟡 Parcialmente Implementado (~40%) |
| **Dependencias** | Paso 5 completado (Guiones + Storyboards) |

---

## 🔧 Herramientas Utilizadas

| Herramienta | Propósito | Tipo de Integración |
|-------------|-----------|---------------------|
| **Gamma** | Generación de slides/presentaciones | API disponible ✅ |
| **Google Flow (Veo 3.1)** | Generación de videos B-roll | API via Gemini/Vertex AI ✅ |
| **Gemini / ChatGPT** | Generación de prompts para video | Ya integrado |
| **OBS Studio / Grabador Mac** | Screencasts | Manual |

---

## 📥 Datos de Entrada

1. **Guión** del tipo de video a tratar (generado en Paso 5)
2. **Storyboard** del tipo de video a tratar (generado en Paso 5)

---

## 🔄 Flujo del Proceso

```
Materiales Generados (Paso 5)
        ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Copiar estructura a Gamma                    [Manual]   │
│  2. Crear deck de slides                         [Gamma IA] │
│  3. Pegar URL del deck                           [Sistema]  │
│  4. Generar prompts B-Roll con IA                [Auto]     │
│  5. Producir video con prompts (Flow/VEO)        [Manual]   │
│  6. Grabar screencast (si aplica)                [Manual]   │
│  7. Guardar URLs finales                         [Sistema]  │
└─────────────────────────────────────────────────────────────┘
        ↓
  Activos Listos para Edición
```

---

## 📊 Proceso Detallado

### 1. Generación de Slides (Gamma)

| Paso | Descripción | Actor |
|------|-------------|-------|
| 1.1 | Tomar las anotaciones del storyboard | Humano |
| 1.2 | Ingresar por módulo al generador de Gamma | Humano |
| 1.3 | Configurar: texto mínimo, sin imágenes, español LATAM, estilo (paleta/tipografía) | Humano |
| 1.4 | Generar slides para cada video del Paso 5 | IA (Gamma) |
| 1.5 | Descargar en formato PNG para uso futuro | Humano |

> **Nota**: Las slides pueden emplearse como apoyo visual para contextualizar la narración.

### 2. Generación de B-Roll

| Paso | Descripción | Actor |
|------|-------------|-------|
| 2.1 | Revisar storyboard para identificar slides que requieren B-roll | Humano |
| 2.2 | Usar Gem especializada en Gemini para generar prompts detallados para Flow | Humano → IA |
| 2.3 | Alternativamente usar ChatGPT (con VEO 3) para definir prompts | Humano → IA |
| 2.4 | Enviar prompts a **Google Flow** para generar videos (~20 créditos/video) | Humano → IA |

### 3. Screencasts (Para VIDEO_GUIDE y DEMO_GUIDE)

| Paso | Descripción | Actor |
|------|-------------|-------|
| 3.1 | Grabar pantalla siguiendo el guión | Humano |
| 3.2 | Usar Gemini/ChatGPT/NotebookLM para mostrar flujos reales | Humano |
| 3.3 | Herramientas: OBS Studio o grabador nativo de Mac | Humano |

---

## 📤 Datos de Salida

- ✅ **Slides** - Presentaciones en Gamma (URL + PNG exportado)
- ✅ **B-roll** - Videos generados con IA (URL)
- ✅ **Recursos visuales** - Animaciones complementarias
- ✅ **Screencasts** - Grabaciones de pantalla (URL)

---

## 🎯 Tipos de Componentes Producibles

| Tipo | Requiere Slides | Requiere Video | Requiere Screencast |
|------|-----------------|----------------|---------------------|
| VIDEO_THEORETICAL | ✅ | ✅ | ❌ |
| VIDEO_DEMO | ❌ | ✅ | ❌ |
| VIDEO_GUIDE | ✅ | ✅ | ✅ |
| DEMO_GUIDE | ❌ | ❌ | ✅ |

---

## 🔌 Integraciones de API Disponibles

### 1. Gamma API (Presentaciones)

| Característica | Detalle |
|----------------|---------|
| **URL Base** | `https://public-api.gamma.app/v1.0/` |
| **Autenticación** | API Key (`X-API-KEY: sk-gamma-xxxxxxxx`) |
| **Disponibilidad** | GA desde Nov 5, 2025 |
| **Requisito** | Plan Pro, Ultra, Team o Business |

**Capacidades:**
- ✅ Generación automática de decks desde prompt/texto
- ✅ Importar PDF, PPTX, DOC o texto plano
- ✅ Exportar a PPTX o PDF
- ✅ Temas personalizados via `themeId`
- ✅ Opciones de contenido: `generate`, `condense`, `preserve`
- ✅ Integración con Zapier, Make, n8n

**Endpoints principales:**
```
POST /generate          - Crear presentación desde prompt
POST /generate/template - Crear desde template existente  
GET  /gammas/{id}/url   - Obtener URL de presentación
```

### 2. Google Flow / Veo 3.1 (Video)

| Característica | Detalle |
|----------------|---------|
| **Acceso** | Via Gemini API (`google.genai`) |
| **Alternativa** | Vertex AI |
| **Modelo** | Veo 3.1 |
| **Requisito** | Plan Google AI Pro (~$19.99/mes) o Ultra |

**Capacidades:**
- ✅ Texto a video
- ✅ Imagen a video (hasta 3 referencias)
- ✅ Extensión de video
- ✅ Control de cámara cinematográfico
- ✅ Mejora a 1080p/4K
- ✅ Audio nativo generado

**Ejemplo de integración:**
```python
import google.generativeai as genai

genai.configure(api_key="YOUR_GEMINI_API_KEY")

response = genai.generate_video(
    prompt="A cinematic shot of a student learning...",
    model="veo-3.1",
    aspect_ratio="16:9",
    duration_seconds=8
)
```

---

## 🗄️ Modelo de Datos

### Tabla Existente: `material_components.assets`

```typescript
interface MaterialAssets {
  // Gamma Slides
  slides_url?: string;        // URL del deck en Gamma
  gamma_deck_id?: string;     // ID interno del deck
  png_export_path?: string;   // Ruta de export PNG
  
  // B-Roll Video
  b_roll_prompts?: string;    // Prompts generados por IA
  video_url?: string;         // URL de video final (Flow/Runway)
  
  // Screencast
  screencast_url?: string;    // URL de grabación
  
  // Status
  production_status?: ProductionStatus;  // PENDING | IN_PROGRESS | COMPLETED
  dod_checklist?: DoDChecklist;          // Checklist de completitud
}
```

### Tablas de Producción (Scripts pendientes de migrar)

```sql
-- production_tasks: Tracking de tareas por video
CREATE TABLE production_tasks (
  id uuid PRIMARY KEY,
  course_id uuid NOT NULL,
  lesson_id text NOT NULL,
  video_id text NOT NULL,
  step_id production_step_id NOT NULL,
  state production_task_state DEFAULT 'NOT_STARTED',
  owner_user_id uuid,
  qa_user_id uuid,
  checklist_json jsonb DEFAULT '[]',
  metadata_json jsonb DEFAULT '{}',
  ...
);

-- production_evidence: URLs y metadata de assets
CREATE TABLE production_evidence (
  id uuid PRIMARY KEY,
  task_id uuid NOT NULL,
  type production_evidence_type NOT NULL,
  url text,
  label text NOT NULL,
  metadata_json jsonb DEFAULT '{}',
  ...
);
```

---

## 🔑 Gestión de API Keys de Usuario

### Propuesta: Tabla `user_api_keys`

Para permitir que los usuarios configuren sus propias API keys (Gamma, OpenAI, Anthropic, Google AI, etc.):

```sql
CREATE TABLE user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  provider text NOT NULL, -- 'gamma', 'openai', 'anthropic', 'google_ai'
  api_key_encrypted text NOT NULL, -- Encriptada con pgcrypto
  label text, -- Nombre descriptivo opcional
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT user_api_keys_unique UNIQUE (user_id, provider)
);

-- RLS para que solo el dueño vea sus keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own keys" ON user_api_keys
  FOR ALL USING (auth.uid() = user_id);
```

**Providers soportados:**
| Provider | Uso en Paso 6 |
|----------|---------------|
| `gamma` | Generación de slides |
| `google_ai` | Flow/Veo para B-roll |
| `openai` | Alternativa para prompts |
| `anthropic` | Alternativa para prompts |

---

## 🖥️ Componentes del Frontend

### 1. VisualProductionContainer
**Ubicación:** `src/domains/materials/components/VisualProductionContainer.tsx`

**Funciones:**
- ✅ Contenedor principal para Fase 6
- ✅ Filtrado de componentes producibles
- ✅ Agrupación por lección
- ✅ Integración con real-time updates

### 2. ProductionAssetCard
**Ubicación:** `src/domains/materials/components/ProductionAssetCard.tsx`

**Secciones:**
| Sección | Aplica a | Función |
|---------|----------|---------|
| **Gamma Slides** | VIDEO_THEORETICAL, VIDEO_GUIDE | Copiar storyboard, pegar URL de deck |
| **B-Roll Prompts** | Todos los VIDEO_* | Generar prompts con IA, copiar |
| **Screencast** | DEMO_GUIDE, VIDEO_GUIDE | Instrucciones + URL |
| **Storyboard Ref** | Todos | Visualización de referencia |

**Estados Visuales:**
| Badge | Color | Significado |
|-------|-------|-------------|
| Pendiente | 🔘 Gris | No iniciado |
| En Progreso | 🟡 Amarillo | Al menos un asset guardado |
| Completado | 🟢 Verde | Todos los assets listos |

---

## 📋 Tracking de Eventos

El sistema registra eventos en `pipeline_events`:

| Evento | Cuándo |
|--------|--------|
| `GO-OP-06_ASSET_UPDATED` | Se guarda cualquier URL de asset |
| `GO-OP-06_ASSET_COMPLETED` | El componente alcanza estado COMPLETED |

---

## ✅ Checklist DoD (Definition of Done)

| Check | Descripción |
|-------|-------------|
| ✓ Slides URL | Deck de Gamma guardado |
| ✓ Video URL | Video B-roll producido |
| ✓ Screencast URL | Grabación de pantalla (si aplica) |
| ✓ B-Roll Prompts | Prompts generados |
| ✓ PNG Export | Slides exportadas a PNG |

---

## 🚀 Plan de Implementación

### Fase A: Integración Backend con APIs (Próximo)

1. **Crear tabla `user_api_keys`** para gestión de API keys
2. **Crear cliente Gamma** (`src/lib/integrations/gamma.ts`)
3. **Crear cliente Veo** (`src/lib/integrations/veo.ts`)
4. **Server actions** para generación automática

### Fase B: Mejoras de UI

1. **Configuración de API keys** en perfil de usuario
2. **Botón "Generar Slides"** que llame a Gamma API
3. **Botón "Generar B-Roll"** que llame a Flow/Veo API
4. **Vista previa** de slides generadas

### Fase C: Automatización

1. **Pipeline automático** para generación en batch
2. **Export PNG automático** desde Gamma
3. **Validaciones DoD** automáticas

---

## ⚠️ Decisiones Pendientes

| Pregunta | Opciones | Estado |
|----------|----------|--------|
| ¿Tabla de API keys para usuarios? | Sí / No | ❓ Pendiente confirmar |
| ¿Qué APIs integrar primero? | Gamma / Flow / Ambas | ❓ Pendiente definir |
| ¿Integración manual o automática con Gamma? | Manual asistido / API automática | ❓ Pendiente |

---

## 📝 Notas Adicionales

### Variables de Entorno Necesarias

```env
# Gamma (alternativa: user_api_keys)
GAMMA_API_KEY=sk-gamma-xxxxxxxx

# Google AI / Veo (alternativa: user_api_keys)
GOOGLE_AI_API_KEY=your-gemini-api-key
```

### Costos Aproximados

| Servicio | Costo |
|----------|-------|
| Gamma Pro | ~$10/mes |
| Google AI Pro | ~$19.99/mes |
| Flow (Veo 3.1) | ~20 créditos/video |
