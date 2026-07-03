export type ProviderType = 'openai' | 'anthropic' | 'openai_compatible';

export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokensUsed?: number | null;
  model: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  provider: ProviderType;
  model: string;
  systemPrompt?: string | null;
  createdAt: string;
  updatedAt: string;
  pinned: boolean; // 0 or 1 in SQLite
  archived: boolean; // 0 or 1 in SQLite
}

export interface ProviderConfig {
  provider: ProviderType;
  baseUrl: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topP?: number | null;
  frequencyPenalty?: number | null;
  presencePenalty?: number | null;
  customName?: string | null;
}

export interface AppSettings {
  theme: string;
  fontSize: number;
  sendOnEnter: boolean;
  streamResponses: boolean;
  showTokenUsage: boolean;
  defaultProvider?: string | null;
  defaultModel?: string | null;
  defaultSystemPrompt?: string | null;
  compactSidebar: boolean;
  confirmDelete: boolean;
  autoTitle: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  contextWindow?: number | null;
}
