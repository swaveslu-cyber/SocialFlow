
export type PostStatus = 'Draft' | 'In Review' | 'Approved' | 'Scheduled' | 'Published' | 'Trashed';

export type Platform = 'Instagram' | 'LinkedIn' | 'Twitter' | 'Facebook' | 'TikTok';

export type MediaType = 'image' | 'video';

export interface Comment {
  id: string;
  author: string;
  role: UserRole;
  text: string;
  timestamp: number;
  isInternal?: boolean; // If true, only visible to Agency
}

export interface HistoryEntry {
  id: string;
  action: string;
  by: string;
  timestamp: number;
  details?: string;
}

export interface PostVersion {
  id: string;
  timestamp: number;
  caption: string;
  mediaUrl: string;
  savedBy: string;
}

export interface Post {
  id: string;
  client: string;
  platform: Platform;
  campaign?: string; // Grouping posts together
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

export interface Campaign {
  id: string;
  name: string;
  client: string;
}

export interface ClientProfile {
  name: string;
  accessCode: string;
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
  // Billing Info
  billingAddress?: string;
  taxId?: string;
  currency?: 'USD' | 'EUR' | 'GBP' | 'XCD';
}

export interface ServiceItem {
  id: string;
  name: string;
  defaultRate: number;
  description?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Void';

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2024-001
  clientId: string;
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  clientTaxId?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  discountValue: number; // Flat amount
  taxRate: number; // Percentage
  taxAmount: number;
  grandTotal: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'XCD';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type UserRole = 'agency' | 'client' | null;

export const PLATFORMS: Platform[] = ['Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'TikTok'];

export const STATUS_FLOW: PostStatus[] = ['Draft', 'In Review', 'Approved', 'Scheduled', 'Published'];
