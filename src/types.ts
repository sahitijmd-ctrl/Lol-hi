export type Role = 'user' | 'model';

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  data: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
  systemPrompt?: string;
}

export type ModelType = 'gemini-2.5-flash';

export type AppTheme = 'default' | 'ocean' | 'emerald' | 'sunflower' | 'rose' | 'midnight';
export type ChatStyle = 'claude' | 'chatgpt' | 'gemini';
