export interface SystemPrompt {
  id: string;
  code: string;
  version: string;
  content: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSystemPromptDTO {
  id: string;
  content: string;
  description?: string;
  is_active?: boolean;
}
