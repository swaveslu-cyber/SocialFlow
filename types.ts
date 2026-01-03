
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
  primaryTextColor?: string; // New: Text color for primary backgrounds
  secondaryTextColor?: string; // New: Text color for secondary backgrounds
  buttonColor?: string; // New: Custom background for secondary/icon buttons
  buttonTextColor?: string; // New: Custom text color for secondary/icon buttons
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientId?: string; // If null, they are Agency staff. If set, they are bound to that client.
  avatar?: string;
  lastLogin?: number;
  password?: string; // Optional, usually only populated for admins viewing team list
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

// --- NEW ONBOARDING TYPES ---

export interface OnboardingConfig {
  one_liner_label?: string;
  one_liner_placeholder?: string;
  pain_point_label?: string;
  pain_point_placeholder?: string;
  motivation_label?: string;
  voice_slider_1_left?: string; // Formal
  voice_slider_1_right?: string; // Casual
  voice_slider_2_left?: string; // Exclusive
  voice_slider_2_right?: string; // Inclusive
}

export interface BrandKit {
  id?: string;
  client_name: string;
  custom_questions?: OnboardingConfig; // New: Custom overrides
  company_details: {
    name: string;
    website: string;
    industry: string;
    one_liner: string;
  };
  brand_voice: {
    formal_casual: number; // 1-10
    exclusive_inclusive: number; // 1-10
    informative_entertaining: number; // 1-10
    soft_bold: number; // 1-10
    restricted_words: string[];
  };
  visual_identity: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    logo_light?: string;
    logo_dark?: string;
    font_names: string;
    aesthetic_links: string[];
  };
  target_audience: {
    age_brackets: string[];
    gender_focus: string;
    geo_focus: string;
    pain_point: string;
    motivation: string;
  };
  access_status: {
    meta_invited: boolean;
    linkedin_invited: boolean;
    tiktok_invited: boolean;
    google_invited: boolean;
    manual_credentials?: string;
  };
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
