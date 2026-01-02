
import { supabase } from './supabaseClient';
import { Post, PostStatus, Template, Snippet, ClientProfile, Comment, Campaign } from '../types';

export const db = {
  init: async (): Promise<void> => {
    console.log("Supabase Service Initialized");
    const { data: pwd } = await supabase.from('app_config').select('value').eq('key', 'agency_password').maybeSingle();
    if (!pwd) await supabase.from('app_config').insert({ key: 'agency_password', value: 'admin123' });

    const { data: rec } = await supabase.from('app_config').select('value').eq('key', 'agency_recovery_key').maybeSingle();
    if (!rec) await supabase.from('app_config').insert({ key: 'agency_recovery_key', value: 'recover-admin' });

    const { data: q } = await supabase.from('app_config').select('value').eq('key', 'agency_recovery_question').maybeSingle();
    if (!q) await supabase.from('app_config').insert({ key: 'agency_recovery_question', value: 'What is the default recovery key?' });

    const { count, error } = await supabase.from('clients').select('*', { count: 'exact', head: true });
    if (!error && count === 0) await db.seedDatabase();
  },

  checkConfig: (): boolean => true,

  // --- AUTH ---
  verifyAgencyPassword: async (inputPass: string): Promise<boolean> => {
      const { data, error } = await supabase.from('app_config').select('value').eq('key', 'agency_password').single();
      if (error) return false;
      return data && inputPass === data.value;
  },
  
  updateAgencyPassword: async (newPass: string): Promise<void> => {
      await supabase.from('app_config').upsert({ key: 'agency_password', value: newPass });
  },

  getRecoveryQuestion: async (): Promise<string> => {
      const { data } = await supabase.from('app_config').select('value').eq('key', 'agency_recovery_question').single();
      return data?.value || "Enter Recovery Key";
  },

  resetAgencyPassword: async (recoveryAnswer: string, newPass: string): Promise<boolean> => {
      const { data } = await supabase.from('app_config').select('value').eq('key', 'agency_recovery_key').single();
      if (!data || data.value !== recoveryAnswer) return false;
      await db.updateAgencyPassword(newPass);
      return true;
  },

  updateRecoverySettings: async (question: string, answer: string): Promise<void> => {
      await supabase.from('app_config').upsert({ key: 'agency_recovery_question', value: question });
      await supabase.from('app_config').upsert({ key: 'agency_recovery_key', value: answer });
  },

  verifyClientLogin: async (clientName: string, accessCode: string): Promise<boolean> => {
      const { data, error } = await supabase.from('clients').select('accessCode').eq('name', clientName).single();
      if (error || !data) return false;
      return data.accessCode === accessCode;
  },

  // --- POSTS ---
  getAllPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase.from('posts').select('*').order('"createdAt"', { ascending: false }); 
    if (error) return [];
    return data as Post[];
  },

  addPost: async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'history' | 'versions'>, author: string): Promise<Post> => {
    const newPost: Post = {
      ...post,
      id: crypto.randomUUID(), 
      comments: [],
      history: [{
        id: crypto.randomUUID(),
        action: 'Asset Deployed',
        by: author,
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

  updatePost: async (id: string, updates: Partial<Post>, user: string): Promise<void> => {
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
              savedBy: user
          });
          history.unshift({
              id: crypto.randomUUID(),
              action: `Copy Refined`,
              by: user,
              timestamp: Date.now(),
              details: `"${p.caption.substring(0, 30)}..." → "${updates.caption.substring(0, 30)}..."`
          });
      }

      if (updates.status && updates.status !== p.status) {
          history.unshift({
              id: crypto.randomUUID(),
              action: `Workflow Shift`,
              by: user,
              timestamp: Date.now(),
              details: `${p.status} → ${updates.status}`
          });
      }

      if (updates.campaign && updates.campaign !== p.campaign) {
          history.unshift({
              id: crypto.randomUUID(),
              action: `Relocated Campaign`,
              by: user,
              timestamp: Date.now(),
              details: `${p.campaign || 'Unassigned'} → ${updates.campaign}`
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
      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
      await supabase.from('clients').insert({ name, accessCode });
  },

  updateClient: async (originalName: string, updatedProfile: ClientProfile): Promise<void> => {
      const { error } = await supabase.from('clients').update({
            name: updatedProfile.name, email: updatedProfile.email,
            phone: updatedProfile.phone, website: updatedProfile.website,
            notes: updatedProfile.notes, socialAccounts: updatedProfile.socialAccounts
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

  exportDatabase: async (): Promise<string> => {
      const [posts, clients, templates, snippets] = await Promise.all([
          db.getAllPosts(), db.getClients(), db.getTemplates(), db.getSnippets()
      ]);
      return JSON.stringify({ posts, clients, templates, snippets, timestamp: Date.now() }, null, 2);
  },

  seedDatabase: async (): Promise<void> => {
      const clientName = "TechStart Inc";
      const { data: existingClient } = await supabase.from('clients').select('id').eq('name', clientName).maybeSingle();
      if (!existingClient) await db.addClient(clientName);

      await db.addCampaign("Q1 Product Launch", clientName);

      await db.saveTemplate({
          id: crypto.randomUUID(), name: "Product Launch", platform: "LinkedIn",
          captionSkeleton: "We are thrilled to announce the launch of [Product]! 🚀",
          tags: ["#launch", "#startup"]
      });

      await db.addPost({
          client: clientName, platform: "LinkedIn", campaign: "Q1 Product Launch",
          date: new Date().toISOString().split('T')[0],
          caption: "Drafting some ideas for the new campaign...",
          mediaUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
          mediaType: "image", status: "Draft"
      }, "Agency");
  },

  clearDatabase: async (): Promise<void> => {
     await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
     await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
     await supabase.from('templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
     await supabase.from('snippets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
     await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
};
