'use server';

import { createClient } from '@/utils/supabase/server';
import { SystemPrompt, UpdateSystemPromptDTO } from '@/domains/prompts/types';
import { revalidatePath } from 'next/cache';

export async function getSystemPromptsAction() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('system_prompts')
    .select('*')
    .order('code', { ascending: true });

  if (error) {
    console.error('Error fetching prompts:', error);
    return { success: false, error: error.message };
  }

  return { success: true, prompts: data as SystemPrompt[] };
}

export async function updateSystemPromptAction(prompt: UpdateSystemPromptDTO) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
  
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }
  
    const { data, error } = await supabase
      .from('system_prompts')
      .update({
          content: prompt.content,
          description: prompt.description,
          is_active: prompt.is_active,
          updated_at: new Date().toISOString()
      })
      .eq('id', prompt.id)
      .select()
      .single();
  
    if (error) {
      console.error('Error updating prompt:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { success: true, prompt: data as SystemPrompt };
  }
