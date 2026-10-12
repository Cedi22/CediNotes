export interface NodeItem {
  id: string;
  parent_id: string | null;
  content: string;
  is_expanded: boolean | number;
  sort_order: number;
  is_starred?: boolean | number;
  children_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AISettings {
  ai_provider: 'gemini' | 'local';
  gemini_api_key: string;
  gemini_model: string;
  local_endpoint: string;
  local_model: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface LinkItem {
  source_id: string;
  target_id: string;
  created_at: string;
  content?: string;
  parent_id?: string | null;
}

export interface FlashcardItem {
  id: string;
  node_id: string;
  question: string;
  answer: string;
  card_type: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  due_date: string;
  node_content?: string;
}

export interface FlashcardStats {
  totalCards: number;
  dueCards: number;
  masteredCards: number;
}

export interface Breadcrumb {
  id: string;
  content: string;
}
