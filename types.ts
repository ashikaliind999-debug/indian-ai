
export enum Role {
  USER = 'user',
  AI = 'ai'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number;
  type?: 'text' | 'image-gen' | 'search' | 'video-gen';
  sources?: Array<{ title: string; uri: string }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

export interface UserStats {
  videoTrialCount: number;
  isSubscribed: boolean;
}
