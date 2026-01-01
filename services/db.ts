
import { supabase } from './supabaseClient';
import { Post, PostStatus, Template, Snippet, ClientProfile, Comment } from '../types';

// We no longer use localStorage keys. 
// We map directly to Supabase tables: 'posts', 'clients', 'templates', 'snippets', 'app_config'

export const db = {
  init: async (): Promise<void> => {
    // Supabase is initialized in supabaseClient.ts
    console.log("Supabase Service Initialized");
  },

  checkConfig: (): boolean => {
      // Basic check to see if the user has replaced the placeholders
      // Access private URL property if possible or just rely on a known placeholder string check
      // Since we can't easily access the consts from supabaseClient without exporting, we assume 
      // if the query fails with specific errors it might be config.
      // But we can check if the supabase client has a valid URL structure roughly.
      // A better way is to attempt a simple query and check the error.
      return true;
  },

  // --- AUTH ---
  verifyAgencyPassword: async (inputPass: string): Promise<boolean> => {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'agency_password')
        .single();
      
      if (error) {
          console.error("Error verifying password:", error);
          return false;
      }
      return data && inputPass === data.value;
  },
  
  updateAgencyPassword: async (newPass: string): Promise<void> => {
      const { error } = await supabase
        .from('app_config')
        .upsert({ key: 'agency_password', value: newPass });
      
      if (error) throw error;
  },

  verifyClientLogin: async (clientName: string, accessCode: string): Promise<boolean> => {
      const { data, error } = await supabase
        .from('clients')
        .select('accessCode')
        .eq('name', clientName)
        .single();

      if (error || !data) {
          console.error("Client login verify error:", error);
          return false;
      }
      return data.accessCode === accessCode;
  },

  // --- POSTS ---
  getAllPosts: async (): Promise<Post[]> => {
    // Note: Postgres is case sensitive with quoted identifiers. 
    // In our SQL, we created tables with "createdAt". 
    // We must ensure the order clause respects this.
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('"createdAt"', { ascending: false }); // Quoted to match case-sensitive column name
    
    if (error) {
        console.error("Error fetching posts:", JSON.stringify(error, null, 2));
        return [];
    }
    return data as Post[];
  },

  addPost: async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'history' | 'versions'>, author: string): Promise<Post> => {
    const newPost: Post = {
      ...post,
      id: crypto.randomUUID(), // We can generate ID here or let DB do it, but here ensures we have it for UI immediately
      comments: [],
      history: [{
        id: crypto.randomUUID(),
        action: 'Created',
        by: author,
        timestamp: Date.now(),
        details: 'Post created from draft'
      }],
      versions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const { error } = await supabase.from('posts').insert(newPost);
    if (error) {
        console.error("Error adding post:", JSON.stringify(error, null, 2));
        throw error;
    }
    
    return newPost;
  },

  updatePost: async (id: string, updates: Partial<Post>, user: string): Promise<void> => {
      // 1. Fetch current post to calculate history/versions
      const { data: currentPost, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !currentPost) throw new Error("Post not found");

      const p = currentPost as Post;
      const newVersions = [...p.versions];
      const history = [...p.history];

      // Logic for versions/history
      if (updates.caption && updates.caption !== p.caption) {
          newVersions.push({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              caption: p.caption,
              mediaUrl: p.mediaUrl,
              savedBy: user
          });
      }

      if (updates.status && updates.status !== p.status) {
          history.unshift({
              id: crypto.randomUUID(),
              action: `Status: ${updates.status}`,
              by: user,
              timestamp: Date.now()
          });
      }
      if (updates.caption) {
           history.unshift({
              id: crypto.randomUUID(),
              action: `Edited Content`,
              by: user,
              timestamp: Date.now()
          });
      }

      const finalUpdates = { 
          ...updates, 
          versions: newVersions, 
          history: history, 
          updatedAt: Date.now() 
      };

      const { error } = await supabase
        .from('posts')
        .update(finalUpdates)
        .eq('id', id);

      if (error) throw error;
  },

  addComment: async (postId: string, comment: Omit<Comment, 'id' | 'timestamp'>): Promise<void> => {
      // 1. Get existing comments
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('comments')
        .eq('id', postId)
        .single();

      if (fetchError || !post) return;

      const newComment = { 
          ...comment, 
          id: crypto.randomUUID(), 
          timestamp: Date.now() 
      };

      const updatedComments = [...(post.comments || []), newComment];

      const { error } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);
        
      if (error) throw error;
  },

  deletePost: async (id: string): Promise<void> => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CLIENTS ---
  getClients: async (): Promise<ClientProfile[]> => {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) {
          console.error("Error fetching clients:", error);
          return [];
      }
      return data as ClientProfile[];
  },
  
  getClientNames: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('clients').select('name');
      if (error) return [];
      return data.map((c: any) => c.name);
  },

  addClient: async (name: string): Promise<void> => {
      // Check if exists
      const { data } = await supabase.from('clients').select('id').eq('name', name).single();
      if (data) return; // Already exists

      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
      const { error } = await supabase.from('clients').insert({ name, accessCode });
      if (error) throw error;
  },

  updateClient: async (originalName: string, updatedProfile: ClientProfile): Promise<void> => {
      // 1. Update the client profile
      const { error } = await supabase
        .from('clients')
        .update({
            name: updatedProfile.name,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
            website: updatedProfile.website,
            notes: updatedProfile.notes,
            socialAccounts: updatedProfile.socialAccounts
            // We usually don't update accessCode unless requested, but here we keep existing if not passed
        })
        .eq('name', originalName);

      if (error) throw error;

      // 2. Cascade name change to posts if name changed
      if (originalName !== updatedProfile.name) {
          const { error: postError } = await supabase
            .from('posts')
            .update({ client: updatedProfile.name })
            .eq('client', originalName);
          
          if (postError) console.error("Failed to cascade client name to posts", postError);
      }
  },

  removeClient: async (name: string): Promise<void> => {
      const { error } = await supabase.from('clients').delete().eq('name', name);
      if (error) throw error;
  },

  // --- TEMPLATES ---
  getTemplates: async (): Promise<Template[]> => {
      const { data, error } = await supabase.from('templates').select('*');
      if (error) return [];
      return data as Template[];
  },
  saveTemplate: async (template: Template): Promise<void> => {
      // Check if update or insert
      const { data } = await supabase.from('templates').select('id').eq('id', template.id).single();
      
      if (data) {
          await supabase.from('templates').update(template).eq('id', template.id);
      } else {
          await supabase.from('templates').insert({ ...template, id: crypto.randomUUID() });
      }
  },
  deleteTemplate: async (id: string): Promise<void> => {
      await supabase.from('templates').delete().eq('id', id);
  },

  // --- SNIPPETS ---
  getSnippets: async (): Promise<Snippet[]> => {
      const { data, error } = await supabase.from('snippets').select('*');
      if (error) return [];
      return data as Snippet[];
  },
  saveSnippet: async (snippet: Snippet): Promise<void> => {
       const { data } = await supabase.from('snippets').select('id').eq('id', snippet.id).single();
      
      if (data) {
          await supabase.from('snippets').update(snippet).eq('id', snippet.id);
      } else {
          await supabase.from('snippets').insert({ ...snippet, id: crypto.randomUUID() });
      }
  },
  deleteSnippet: async (id: string): Promise<void> => {
      await supabase.from('snippets').delete().eq('id', id);
  },

  // --- EXPORT (Snapshot of current DB state) ---
  exportDatabase: async (): Promise<string> => {
      const [posts, clients, templates, snippets] = await Promise.all([
          db.getAllPosts(),
          db.getClients(),
          db.getTemplates(),
          db.getSnippets()
      ]);

      const data = {
          posts,
          clients,
          templates,
          snippets,
          timestamp: Date.now()
      };
      return JSON.stringify(data, null, 2);
  },

  // NOTE: Import is tricky with SQL because of ID conflicts. 
  // For now, we will just support Export for backup. 
  // Importing full JSON dump into SQL usually requires a more complex script.
  importDatabase: async (jsonString: string): Promise<boolean> => {
      console.warn("Import not fully supported in SQL mode via Client yet.");
      return false;
  }
};
