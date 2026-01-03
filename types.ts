
export type PostStatus = 'Draft' | 'In Review' | 'Approved' | 'Scheduled' | 'Published' | 'Trashed';

export type Platform = 'Instagram' | 'LinkedIn' | 'Twitter' | 'Facebook' | 'TikTok';

export type MediaType = 'image' | 'video';

// RBAC Roles
export type UserRole = 
  | 'agency_admin'    // Full Access
  | 'agency_creator'  // Can create/edit, cannot delete/approve final
  | 'client_admin'    // Can approve, view finance (if enabled)
  | 'client_viewer';  // Read-only

export interface AppConfig {
  agencyName: string;
  logoUrl?: string;
  primaryColor: string; // Replaces 'swave-purple'
  secondaryColor: string; // Replaces 'swave-orange'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientId?: string; // If null, they are Agency staff. If set, they are bound to that client.
  avatar?: string;
  lastLogin?: number;
}

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
  by: string; // Name of the user
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
  accessCode: string; // Legacy / API access
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

export const PLATFORMS: Platform[] = ['Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'TikTok'];

export const STATUS_FLOW: PostStatus[] = ['Draft', 'In Review', 'Approved', 'Scheduled', 'Published'];

// --- PERMISSIONS HELPER ---
export const PERMISSIONS = {
  canDelete: (role: UserRole) => role === 'agency_admin',
  canManageTeam: (role: UserRole) => role === 'agency_admin',
  canViewFinance: (role: UserRole) => role === 'agency_admin',
  canApprove: (role: UserRole) => ['agency_admin', 'client_admin'].includes(role),
  canEdit: (role: UserRole) => ['agency_admin', 'agency_creator'].includes(role),
  canPublish: (role: UserRole) => ['agency_admin'].includes(role),
  isInternal: (role: UserRole) => ['agency_admin', 'agency_creator'].includes(role),
};
