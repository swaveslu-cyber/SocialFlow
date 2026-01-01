
export type PostStatus = 'Draft' | 'In Review' | 'Approved' | 'Scheduled' | 'Published';

export type Platform = 'Instagram' | 'LinkedIn' | 'Twitter' | 'Facebook' | 'TikTok';

export type MediaType = 'image' | 'video';

export interface Comment {
  id: string;
  author: string;
  role: UserRole;
  text: string;
  timestamp: number;
}

export interface HistoryEntry {
  id: string;
  action: string;
  by: string;
  timestamp: number;
  details?: string;
}

export interface PostVersion {
  id: string; // unique version id
  timestamp: number;
  caption: string;
  mediaUrl: string;
  savedBy: string;
}

export interface Post {
  id: string;
  client: string;
  platform: Platform;
  date: string;
  caption: string;
  mediaUrl: string;
  mediaType: MediaType;
  status: PostStatus;
  comments: Comment[];
  history: HistoryEntry[];
  versions: PostVersion[];
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  platform: Platform;
  captionSkeleton: string;
  tags: string[];
}

export interface Snippet {
  id: string;
  label: string;
  content: string;
}

export interface ClientProfile {
  name: string;
  accessCode: string; // Simple 4-6 digit pin
  // CRM Fields
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  socialAccounts?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
  };
}

export type UserRole = 'agency' | 'client' | null;

export const PLATFORMS: Platform[] = ['Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'TikTok'];

export const STATUS_FLOW: PostStatus[] = ['Draft', 'In Review', 'Approved', 'Scheduled', 'Published'];
