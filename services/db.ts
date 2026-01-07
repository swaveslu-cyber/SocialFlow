
import { supabase } from './supabaseClient';
import { Post, Comment, Campaign, Invoice, ServiceItem, User, UserRole, AppConfig, BrandKit, ServiceMenuSection, Template, Snippet, ClientProfile } from '../types';

const uuidv4 = () => {
  return crypto.randomUUID();
};

const DEFAULT_SERVICE_SECTIONS: ServiceMenuSection[] = [
    {
        id: 'header',
        title: 'Header & Intro',
        isVisible: true,
        content: `
<div class="text-center border-b border-gray-200 dark:border-gray-700 pb-8 mb-8">
    <h1 class="text-4xl font-black mb-2 tracking-tight text-gray-900 dark:text-white">SWAVE</h1>
    <p class="text-lg font-bold text-swave-purple uppercase tracking-widest">Online Growth Agency</p>
    <p class="mt-4 text-sm text-gray-500 font-medium">Rate Card & Services (2026)</p>
</div>`
    }
];

export const db = {
  init: async (): Promise<void> => {
    // Optimization: Removed blocking DB call on init
  },

  // --- BRANDING ---
  getAppConfig: async (): Promise<AppConfig> => {
      const { data } = await supabase.from('app_config').select('value').eq('key', 'branding').maybeSingle();
      if (data && data.value) return data.value;
      return {
          agencyName: "SWAVE",
          primaryColor: "#8E3EBB", 
          secondaryColor: "#F27A21",
          primaryTextColor: "#FFFFFF",
          secondaryTextColor: "#FFFFFF",
          buttonColor: "#F3F4F6", 
          buttonTextColor: "#1F2937" 
      };
  },

  saveAppConfig: async (config: AppConfig): Promise<void> => {
      await supabase.from('app_config').upsert({ key: 'branding', value: config }, { onConflict: 'key' });
  },

  getServiceMenu: async (): Promise<ServiceMenuSection[]> => {
      const { data } = await supabase.from('app_config').select('value').eq('key', 'service_menu').maybeSingle();
      if (data && data.value && Array.isArray(data.value.sections)) return data.value.sections;
      return DEFAULT_SERVICE_SECTIONS;
  },

  saveServiceMenu: async (sections: ServiceMenuSection[]): Promise<void> => {
      await supabase.from('app_config').upsert({ key: 'service_menu', value: { sections } }, { onConflict: 'key' });
  },

  getRateCard: async (): Promise<string> => {
      const sections = await db.getServiceMenu();
      return sections.filter(s => s.isVisible).map(s => s.content).join('\n');
  },

  getBrandKit: async (clientName: string): Promise<BrandKit | null> => {
      const { data } = await supabase.from('client_brand_kits').select('*').eq('client_name', clientName).maybeSingle();
      return data as BrandKit | null;
  },

  saveBrandKit: async (kit: BrandKit): Promise<void> => {
      await supabase.from('client_brand_kits').upsert(kit, { onConflict: 'client_name' });
  },

  // --- AUTH ---
  authenticate: async (email: string, password: string): Promise<User | null> => {
      // 1. Try Standard User
      const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (user && user.password === password) {
          return { ...user, role: user.role as UserRole };
      }
      // 2. Try Client Access Code
      const { data: client } = await supabase.from('clients').select('*').eq('email', email).maybeSingle();
      if (client && client.accessCode === password) {
          return {
              id: `client-${client.name}`,
              email: client.email || email,
              name: client.name,
              role: 'client_admin',
              clientId: client.name
          };
      }
      return null;
  },

  getUsers: async (): Promise<User[]> => {
      const { data } = await supabase.from('users').select('*').order('name');
      return data || [];
  },

  createUser: async (userData: any): Promise<void> => {
      await supabase.from('users').insert({ ...userData, id: uuidv4(), createdAt: Date.now() });
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
      await supabase.from('users').update(updates).eq('id', id);
  },

  deleteUser: async (id: string): Promise<void> => {
      await supabase.from('users').delete().eq('id', id);
  },

  // --- POSTS ---
  getAllPosts: async (): Promise<Post[]> => {
    const { data } = await supabase.from('posts').select('*').order('"updatedAt"', { ascending: false });
    return data || [];
  },

  addPost: async (post: any, authorName: string): Promise<Post> => {
    const newPost = {
      ...post,
      id: uuidv4(),
      comments: [],
      history: [{
        id: uuidv4(),
        action: 'Asset Deployed',
        by: authorName,
        timestamp: Date.now(),
        details: `Initial ${post.status} phase initiated.`
      }],
      versions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await supabase.from('posts').insert(newPost);
    return newPost;
  },

  updatePost: async (id: string, updates: Partial<Post>, userName: string): Promise<void> => {
      const { data: currentPost } = await supabase.from('posts').select('*').eq('id', id).single();
      if (!currentPost) return;

      const p = currentPost;
      const newVersions = p.versions ? [...p.versions] : [];
      const history = p.history ? [...p.history] : [];

      if (updates.caption && updates.caption !== p.caption) {
          newVersions.push({ id: uuidv4(), timestamp: Date.now(), caption: p.caption, mediaUrl: p.mediaUrl, savedBy: userName });
          history.unshift({ id: uuidv4(), action: `Copy Refined`, by: userName, timestamp: Date.now(), details: `Caption updated` });
      }

      if (updates.status && updates.status !== p.status) {
          history.unshift({ id: uuidv4(), action: `Workflow Shift`, by: userName, timestamp: Date.now(), details: `${p.status} → ${updates.status}` });
      }

      await supabase.from('posts').update({ ...updates, versions: newVersions, history, updatedAt: Date.now() }).eq('id', id);
  },

  addComment: async (postId: string, comment: any): Promise<void> => {
      const { data: post } = await supabase.from('posts').select('comments').eq('id', postId).single();
      if (!post) return;
      const updatedComments = [...(post.comments || []), { ...comment, id: uuidv4(), timestamp: Date.now() }];
      await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);
  },

  deletePost: async (id: string): Promise<void> => {
    await supabase.from('posts').delete().eq('id', id);
  },

  // --- CLIENTS ---
  getClients: async (): Promise<ClientProfile[]> => {
      const { data } = await supabase.from('clients').select('*');
      return data || [];
  },
  
  getClientNames: async (): Promise<string[]> => {
      const { data } = await supabase.from('clients').select('name');
      return data ? data.map((c: any) => c.name) : [];
  },

  addClient: async (name: string): Promise<void> => {
      const { data } = await supabase.from('clients').select('id').eq('name', name).maybeSingle();
      if (data) return;
      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
      await supabase.from('clients').insert({ name, accessCode, currency: 'USD' });
  },

  updateClient: async (originalName: string, updates: Partial<ClientProfile>): Promise<void> => {
      await supabase.from('clients').update(updates).eq('name', originalName);
      if (updates.name && originalName !== updates.name) {
          await supabase.from('posts').update({ client: updates.name }).eq('client', originalName);
          await supabase.from('client_brand_kits').update({ client_name: updates.name }).eq('client_name', originalName);
          await supabase.from('invoices').update({ clientName: updates.name }).eq('clientName', originalName);
          await supabase.from('users').update({ clientId: updates.name }).eq('clientId', originalName);
      }
  },

  removeClient: async (name: string): Promise<void> => {
      await supabase.from('clients').delete().eq('name', name);
  },

  // --- CAMPAIGNS ---
  getCampaigns: async (): Promise<Campaign[]> => {
      const { data } = await supabase.from('campaigns').select('*');
      return data || [];
  },
  addCampaign: async (name: string, client: string): Promise<void> => {
      await supabase.from('campaigns').insert({ id: uuidv4(), name, client });
  },

  // --- TEMPLATES & SNIPPETS ---
  getTemplates: async (): Promise<Template[]> => {
      const { data } = await supabase.from('templates').select('*');
      return data || [];
  },
  saveTemplate: async (template: Template): Promise<void> => {
      const { data } = await supabase.from('templates').select('id').eq('id', template.id).maybeSingle();
      if (data) await supabase.from('templates').update(template).eq('id', template.id);
      else await supabase.from('templates').insert({ ...template, id: template.id || uuidv4() });
  },
  deleteTemplate: async (id: string): Promise<void> => {
      await supabase.from('templates').delete().eq('id', id);
  },
  getSnippets: async (): Promise<Snippet[]> => {
      const { data } = await supabase.from('snippets').select('*');
      return data || [];
  },
  saveSnippet: async (snippet: Snippet): Promise<void> => {
       const { data } = await supabase.from('snippets').select('id').eq('id', snippet.id).maybeSingle();
      if (data) await supabase.from('snippets').update(snippet).eq('id', snippet.id);
      else await supabase.from('snippets').insert({ ...snippet, id: snippet.id || uuidv4() });
  },
  deleteSnippet: async (id: string): Promise<void> => {
      await supabase.from('snippets').delete().eq('id', id);
  },

  // --- FINANCE ---
  getInvoices: async (): Promise<Invoice[]> => {
    const { data } = await supabase.from('invoices').select('*').order('"createdAt"', { ascending: false });
    return data || [];
  },
  saveInvoice: async (invoice: Invoice): Promise<void> => {
    await supabase.from('invoices').upsert(invoice);
  },
  deleteInvoice: async (id: string): Promise<void> => {
    await supabase.from('invoices').delete().eq('id', id);
  },
  getServices: async (): Promise<ServiceItem[]> => {
    const { data } = await supabase.from('services').select('*');
    return data || [];
  },
  saveService: async (service: ServiceItem): Promise<void> => {
    await supabase.from('services').upsert(service);
  },
  deleteService: async (id: string): Promise<void> => {
    await supabase.from('services').delete().eq('id', id);
  },

  exportDatabase: async (): Promise<string> => {
      const [posts, clients, templates, snippets, invoices, services] = await Promise.all([
          db.getAllPosts(), db.getClients(), db.getTemplates(), db.getSnippets(), db.getInvoices(), db.getServices()
      ]);
      return JSON.stringify({ posts, clients, templates, snippets, invoices, services, timestamp: Date.now() }, null, 2);
  },

  seedDatabase: async (): Promise<void> => {
      try {
        const clientName = "TechStart Inc";
        await supabase.from('clients').upsert({
            name: clientName,
            email: 'techstartinc@mail.com',
            accessCode: '8127',
            currency: 'USD',
            retainerAmount: 2000, 
            retainerDescription: "Growth Retainer + Web Maintenance"
        }, { onConflict: 'name' });
        await db.addCampaign("Q1 Product Launch", clientName);
      } catch (e) {}
  },

  clearDatabase: async (): Promise<void> => {
     try {
         const tables = ['posts', 'clients', 'templates', 'snippets', 'campaigns', 'invoices', 'services', 'client_brand_kits'];
         for (const t of tables) await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
     } catch (e) { console.error(e); }
  }
};
