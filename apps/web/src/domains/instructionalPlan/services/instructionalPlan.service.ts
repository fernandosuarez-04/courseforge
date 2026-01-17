import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
    Esp03PlanPayload, 
    Esp03StepState, 
    InstructionalPlanRow, 
    LessonPlan, 
    Blocker,
    InstructionalPlanDod
} from '../types/instructionalPlan.types';

// Define the shape of the generation result
export interface Esp03GenerationResult {
    success: boolean;
    state: Esp03StepState;
    error?: string;
}

export const instructionalPlanService = {
    // Obtener el plan actual para un artefacto
    async getPlan(artifactId: string): Promise<InstructionalPlanRow | null> {
        const supabase = createClientComponentClient();
        
        try {
            const { data, error } = await supabase
                .from('instructional_plans')
                .select('*')
                .eq('artifact_id', artifactId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No rows found
                    return null;
                }
                console.error('Error fetching instructional plan:', error);
                throw error;
            }

            return data as InstructionalPlanRow;
        } catch (error) {
            console.error('Unexpected error fetching plan:', error);
            return null;
        }
    },

    // Iniciar el proceso de generación (llama al endpoint o background function)
    async startGeneration(artifactId: string): Promise<Esp03GenerationResult> {
        // Implementation for calling the API/Background function
        // This will be connected to the API route later
        console.log('Starting generation for artifact:', artifactId);
        return { success: true, state: 'STEP_GENERATING' };
    },

    // Actualizar el estado (útil para transiciones manuales o dev)
    async updateState(artifactId: string, newState: Esp03StepState): Promise<void> {
        const supabase = createClientComponentClient();
        
        const { error } = await supabase
            .from('instructional_plans')
            .update({ state: newState })
            .eq('artifact_id', artifactId);

        if (error) throw error;
    }
};
