
export type Esp03StepState =
  | 'STEP_DRAFT'
  | 'STEP_GENERATING'
  | 'STEP_VALIDATING'
  | 'STEP_READY_FOR_REVIEW'
  | 'STEP_APPROVED'
  | 'STEP_WITH_BLOCKERS'
  | 'STEP_ESCALATED'
  | 'STEP_IDLE'; // Added IDLE as a safe default

export type Esp03FinalStatus = 'APPROVED_PHASE_1' | 'WITH_BLOCKERS';

export type PlanComponentType =
  | 'DIALOGUE'
  | 'READING'
  | 'QUIZ'
  | 'DEMO_GUIDE'
  | 'EXERCISE'
  | 'RESOURCE'
  | 'VIDEO_THEORETICAL' // Added based on CSV data
  | 'VIDEO_DEMO'        // Added based on CSV data
  | 'VIDEO_GUIDE';      // Added based on CSV data

export interface PlanComponent {
  type: PlanComponentType;
  summary: string;
  notes?: string;
}

export interface LessonPlan {
  lesson_id: string;
  lesson_title: string;
  module_id?: string;     // Added based on CSV
  module_title?: string;  // Added based on CSV
  lesson_order?: number;  // Added based on CSV
  module_index?: number;  // Added based on CSV
  
  oa_text: string;                    // Objetivo de aprendizaje
  oa_bloom_verb?: string;             // Verbo Bloom extraído
  measurable_criteria?: string;       // Criterio medible
  
  components: PlanComponent[];        // Mínimo: DIALOGUE, READING, QUIZ
  
  alignment_notes?: string;           // Notas de alineación OA↔contenido
  production_notes?: string;          // Added based on CSV data
  risks_gaps?: string;                // Added based on CSV data
}

export interface Blocker {
  id: string;
  lesson_id?: string;
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  owner: string;
  status: 'OPEN' | 'RESOLVED' | 'WONT_FIX';
}

export interface DodCheck {
  code: 'DOD_A' | 'DOD_B' | 'DOD_C' | 'DOD_D';
  pass: boolean;
  evidence?: string;
  label?: string; // Added from CSV
  notes?: string;
}

export interface ValidationCheck {
  code: string;
  pass: boolean;
  message?: string;
  severity?: 'error' | 'warning'; // Added from CSV
}

export interface SemanticCheck {
    code: string;
    pass: boolean;
    message?: string;
    severity?: 'error' | 'warning';
}

export interface InstructionalPlanDod {
    checklist: DodCheck[];
    automatic_checks: ValidationCheck[];
    semantic_checks: SemanticCheck[];
    validation_report?: any; // For full JSON report from CSV
}

export interface Esp03PlanPayload {
  lesson_plans: LessonPlan[];
  blockers: Blocker[];
  dod: InstructionalPlanDod;
  
  approvals?: {
    architect_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewed_by?: string;
    reviewed_at?: string;
    notes?: string;
  };
}

// Database Row Interface
export interface InstructionalPlanRow {
  id: string;
  artifact_id: string;
  lesson_plans: LessonPlan[]; // Stored as JSONB
  blockers: Blocker[];        // Stored as JSONB
  dod: InstructionalPlanDod;  // Stored as JSONB
  approvals: any;             // Stored as JSONB
  final_status: Esp03FinalStatus | null;
  state: Esp03StepState;
  iteration_count: number;
  created_at: string;
  updated_at: string;
}
