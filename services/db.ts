
import { supabase } from './supabaseClient';
import { Post, PostStatus, Template, Snippet, ClientProfile, Comment, Campaign, Invoice, ServiceItem, User, UserRole, AppConfig } from '../types';

export const db = {
  init: async (): Promise<void> => {
    console.log("Supabase Service Initialized");
    try {
        // Check if we need to seed data (checking posts instead of users to ensure content exists)
        const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true });
        
        if (count === 0) {
            console.log("Seeding Database...");
            // Ensure admin exists (if not created by SQL script previously)
            const { data: admin } = await supabase.from('users').select('id').eq('email', 'admin@swave.agency').maybeSingle();
            if (!admin) {
                 await db.createUser({
                    email: 'admin@swave.agency',
                    password: 'admin123',
                    name: 'Agency Director',
                    role: 'agency_admin'
                });
            }
            await db.seedDatabase();
        }
    } catch (e) {
        console.error("Initialization Error:", e);
    }
  },

  // --- BRANDING / APP CONFIG ---
  getAppConfig: async (): Promise<AppConfig> => {
      // Try to get from Supabase 'app_config' table, using key 'branding'
      const { data } = await supabase.from('app_config').select('value').eq('key', 'branding').maybeSingle();
      if (data && data.value) {
          return data.value; // Supabase returns JSONB as object directly
      }
      // Default / Fallback
      return {
          agencyName: "SWAVE",
          primaryColor: "#8E3EBB", // swave-purple
          secondaryColor: "#F27A21", // swave-orange
          buttonColor: "#F3F4F6", // Default button bg (Gray-100) for better visibility
          buttonTextColor: "#1F2937" // Default button text (Gray-800)
      };
  },

  saveAppConfig: async (config: AppConfig): Promise<void> => {
      // Upsert into app_config table
      const { error } = await supabase.from('app_config').upsert({
          key: 'branding',
          value: config
      }, { onConflict: 'key' });
      
      if (error) throw error;
  },

  // --- REALTIME SUBSCRIPTIONS ---
  subscribeToPosts: (onUpdate: () => void) => {
      return supabase
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
            onUpdate();
        })
        .subscribe();
  },

  // --- AUTHENTICATION & USERS ---
  
  authenticate: async (email: string, password: string): Promise<User | null> => {
      // In a real app, use supabase.auth.signInWithPassword
      // Here, we simulate by querying our custom 'users' table for the hackathon/demo scope
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
      
      if (error || !data) return null;
      
      // Simple password check (replace with bcrypt compare in real backend)
      // Note: 'password' column should not be exposed in real select, but this is a mock impl
      if (data.password === password) {
          // Update last login
          await supabase.from('users').update({ lastLogin: Date.now() }).eq('id', data.id);
          
          return {
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role as UserRole,
              clientId: data.clientId,
              avatar: data.avatar
          };
      }
      return null;
  },

  getUsers: async (): Promise<User[]> => {
      // Fetching * to include password field for the admin panel requirement
      const { data, error } = await supabase.from('users').select('*').order('name');
      if (error) return [];
      return data as User[];
  },

  createUser: async (userData: { email: string, password: string, name: string, role: UserRole, clientId?: string }): Promise<void> => {
      const newUser = {
          id: crypto.randomUUID(),
          email: userData.email,
          password: userData.password, // Ideally hashed
          name: userData.name,
          role: userData.role,
          clientId: userData.clientId || null,
          createdAt: Date.now()
      };
      const { error } = await supabase.from('users').insert(newUser);
      if (error) throw error;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
      const { error } = await supabase.from('users').update(updates).eq('id', id);
      if (error) throw error;
  },

  deleteUser: async (id: string): Promise<void> => {
      // Simplified delete without .select() to avoid RLS read restrictions on deleted rows
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
  },

  // --- LEGACY RECOVERY (Kept for fallback) ---
  getRecoveryQuestion: async (): Promise<string> => {
      const { data } = await supabase.from('app_config').select('value').eq('key', 'agency_recovery_question').single();
      return data?.value || "Enter Recovery Key";
  },
  
  // --- POSTS ---
  getAllPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase.from('posts').select('*').order('"createdAt"', { ascending: false }); 
    if (error) return [];
    return data as Post[];
  },

  addPost: async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'history' | 'versions'>, authorName: string): Promise<Post> => {
    const newPost: Post = {
      ...post,
      id: crypto.randomUUID(), 
      comments: [],
      history: [{
        id: crypto.randomUUID(),
        action: 'Asset Deployed',
        by: authorName,
        timestamp: Date.now(),
        details: `Initial ${post.status} phase initiated.`
      }],
      versions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const { error } = await supabase.from('posts').insert(newPost);
    if (error) throw error;
    return newPost;
  },

  updatePost: async (id: string, updates: Partial<Post>, userName: string): Promise<void> => {
      const { data: currentPost, error: fetchError } = await supabase.from('posts').select('*').eq('id', id).single();
      if (fetchError || !currentPost) throw new Error("Post not found");

      const p = currentPost as Post;
      const newVersions = [...p.versions];
      const history = [...p.history];

      // --- ADVANCED DIFF TRACKING ---
      if (updates.caption && updates.caption !== p.caption) {
          newVersions.push({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              caption: p.caption,
              mediaUrl: p.mediaUrl,
              savedBy: userName
          });
          history.unshift({
              id: crypto.randomUUID(),
              action: `Copy Refined`,
              by: userName,
              timestamp: Date.now(),
              details: `"${p.caption.substring(0, 30)}..." → "${updates.caption.substring(0, 30)}..."`
          });
      }

      if (updates.status && updates.status !== p.status) {
          history.unshift({
              id: crypto.randomUUID(),
              action: `Workflow Shift`,
              by: userName,
              timestamp: Date.now(),
              details: `${p.status} → ${updates.status}`
          });
      }

      const { error } = await supabase.from('posts').update({ ...updates, versions: newVersions, history, updatedAt: Date.now() }).eq('id', id);
      if (error) throw error;
  },

  addComment: async (postId: string, comment: Omit<Comment, 'id' | 'timestamp'>): Promise<void> => {
      const { data: post, error: fetchError } = await supabase.from('posts').select('comments').eq('id', postId).single();
      if (fetchError || !post) return;

      const updatedComments = [...(post.comments || []), { ...comment, id: crypto.randomUUID(), timestamp: Date.now() }];
      const { error } = await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);
      if (error) throw error;
  },

  deletePost: async (id: string): Promise<void> => {
    await supabase.from('posts').delete().eq('id', id);
  },

  // --- CLIENTS ---
  getClients: async (): Promise<ClientProfile[]> => {
      const { data, error } = await supabase.from('clients').select('*');
      return error ? [] : data as ClientProfile[];
  },
  
  getClientNames: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('clients').select('name');
      return error ? [] : data.map((c: any) => c.name);
  },

  addClient: async (name: string): Promise<void> => {
      const { data } = await supabase.from('clients').select('id').eq('name', name).maybeSingle();
      if (data) return;
      // Also create a default Client Admin user for this client
      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
      await supabase.from('clients').insert({ name, accessCode, currency: 'USD' });
  },

  updateClient: async (originalName: string, updatedProfile: ClientProfile): Promise<void> => {
      const { error } = await supabase.from('clients').update({
            name: updatedProfile.name, email: updatedProfile.email,
            phone: updatedProfile.phone, website: updatedProfile.website,
            notes: updatedProfile.notes, socialAccounts: updatedProfile.socialAccounts,
            billingAddress: updatedProfile.billingAddress,
            taxId: updatedProfile.taxId,
            currency: updatedProfile.currency
        }).eq('name', originalName);
      if (error) throw error;

      if (originalName !== updatedProfile.name) {
          await supabase.from('posts').update({ client: updatedProfile.name }).eq('client', originalName);
      }
  },

  removeClient: async (name: string): Promise<void> => {
      await supabase.from('clients').delete().eq('name', name);
  },

  // --- CAMPAIGNS ---
  getCampaigns: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase.from('campaigns').select('*');
      return error ? [] : data as Campaign[];
  },
  addCampaign: async (name: string, client: string): Promise<void> => {
      await supabase.from('campaigns').insert({ id: crypto.randomUUID(), name, client });
  },
  deleteCampaign: async (id: string): Promise<void> => {
      await supabase.from('campaigns').delete().eq('id', id);
  },

  // --- TEMPLATES & SNIPPETS ---
  getTemplates: async (): Promise<Template[]> => {
      const { data, error } = await supabase.from('templates').select('*');
      return error ? [] : data as Template[];
  },
  saveTemplate: async (template: Template): Promise<void> => {
      const { data } = await supabase.from('templates').select('id').eq('id', template.id).maybeSingle();
      if (data) await supabase.from('templates').update(template).eq('id', template.id);
      else await supabase.from('templates').insert({ ...template, id: template.id || crypto.randomUUID() });
  },
  deleteTemplate: async (id: string): Promise<void> => {
      await supabase.from('templates').delete().eq('id', id);
  },
  getSnippets: async (): Promise<Snippet[]> => {
      const { data, error } = await supabase.from('snippets').select('*');
      return error ? [] : data as Snippet[];
  },
  saveSnippet: async (snippet: Snippet): Promise<void> => {
       const { data } = await supabase.from('snippets').select('id').eq('id', snippet.id).maybeSingle();
      if (data) await supabase.from('snippets').update(snippet).eq('id', snippet.id);
      else await supabase.from('snippets').insert({ ...snippet, id: snippet.id || crypto.randomUUID() });
  },
  deleteSnippet: async (id: string): Promise<void> => {
      await supabase.from('snippets').delete().eq('id', id);
  },

  // --- FINANCE: INVOICES & SERVICES ---
  getInvoices: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase.from('invoices').select('*').order('"createdAt"', { ascending: false });
    if (error) throw error;
    return data as Invoice[];
  },
  saveInvoice: async (invoice: Invoice): Promise<void> => {
    const { error } = await supabase.from('invoices').upsert(invoice);
    if (error) throw error;
  },
  deleteInvoice: async (id: string): Promise<void> => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },
  
  getServices: async (): Promise<ServiceItem[]> => {
    const { data, error } = await supabase.from('services').select('*');
    if (error) throw error;
    return data as ServiceItem[];
  },
  saveService: async (service: ServiceItem): Promise<void> => {
    const { error } = await supabase.from('services').upsert(service);
    if (error) throw error;
  },
  deleteService: async (id: string): Promise<void> => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  exportDatabase: async (): Promise<string> => {
      const [posts, clients, templates, snippets, invoices, services] = await Promise.all([
          db.getAllPosts(), db.getClients(), db.getTemplates(), db.getSnippets(), db.getInvoices(), db.getServices()
      ]);
      return JSON.stringify({ posts, clients, templates, snippets, invoices, services, timestamp: Date.now() }, null, 2);
  },

  seedDatabase: async (): Promise<void> => {
      const clientName = "TechStart Inc";
      const { data: existingClient } = await supabase.from('clients').select('id').eq('name', clientName).maybeSingle();
      if (!existingClient) await db.addClient(clientName);

      await db.addCampaign("Q1 Product Launch", clientName);
      await db.addCampaign("Brand Awareness", clientName);

      await db.saveTemplate({
          id: crypto.randomUUID(), name: "Product Launch", platform: "LinkedIn",
          captionSkeleton: "We are thrilled to announce the launch of [Product]! 🚀",
          tags: ["#launch", "#startup"]
      });

      const author = "Agency Director";
      const today = new Date().toISOString().split('T')[0];
      
      // Sample Posts
      await db.addPost({
          client: clientName, platform: "LinkedIn", campaign: "Q1 Product Launch",
          date: today,
          caption: "Exciting news coming soon! We've been working hard on something special.",
          mediaUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
          mediaType: "image", status: "Draft"
      }, author);

      await db.addPost({
          client: clientName, platform: "Instagram", campaign: "Brand Awareness",
          date: today,
          caption: "Behind the scenes at the office today! 📸 #TechLife #StartupCulture",
          mediaUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
          mediaType: "image", status: "In Review"
      }, author);

      await db.addPost({
          client: clientName, platform: "Twitter", campaign: "Q1 Product Launch",
          date: today,
          caption: "Our new feature drops next week. Are you ready? 🔥",
          mediaUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
          mediaType: "image", status: "Approved"
      }, author);

      await db.saveService({ id: crypto.randomUUID(), name: 'Social Media Management', defaultRate: 1500, description: 'Monthly Retainer' });
      await db.saveService({ id: crypto.randomUUID(), name: 'Content Creation', defaultRate: 500, description: 'Per Asset Pack' });
  },

  clearDatabase: async (): Promise<void> => {
     try {
         await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
         await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
         await supabase.from('templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
         await supabase.from('snippets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
         await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
         await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
         await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
         // We do not delete users here to prevent lockout
     } catch (e) {
         console.error("Failed to clear Supabase tables:", e);
     }
  }
};
