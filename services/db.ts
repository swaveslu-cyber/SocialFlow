
import { supabase } from './supabaseClient';
import { Post, PostStatus, Template, Snippet, ClientProfile, Comment, Campaign, Invoice, ServiceItem, User, UserRole, AppConfig, BrandKit } from '../types';

const DEFAULT_RATE_CARD_HTML = `
<div class="space-y-8 font-sans text-gray-800 dark:text-gray-200">
  <div class="text-center border-b border-gray-200 dark:border-gray-700 pb-8 mb-8">
    <h1 class="text-4xl font-black mb-2 tracking-tight text-gray-900 dark:text-white">SWAVE</h1>
    <p class="text-lg font-bold text-swave-purple uppercase tracking-widest">Online Growth Agency</p>
    <p class="mt-4 text-sm text-gray-500 font-medium">Rate Card & Services (2026)</p>
  </div>

  <section class="mb-12">
    <div class="flex items-center gap-3 mb-6">
        <div class="w-1 h-8 bg-swave-purple rounded-full"></div>
        <h3 class="text-2xl font-black text-gray-900 dark:text-white">Content Retainers</h3>
    </div>
    <div class="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="p-4 font-black text-gray-500 uppercase tracking-wider">Tier</th>
            <th class="p-4 font-black text-gray-500 uppercase tracking-wider">Investment</th>
            <th class="p-4 font-black text-gray-500 uppercase tracking-wider">Deliverables</th>
            <th class="p-4 font-black text-gray-500 uppercase tracking-wider">Platforms</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800">
          <tr>
            <td class="p-4 font-bold text-lg">Basic</td>
            <td class="p-4 font-mono text-swave-purple font-bold">$500<span class="text-xs text-gray-400">/mo</span></td>
            <td class="p-4 text-gray-600 dark:text-gray-300">6 Posts, 8 Story Sets, 4 Reels</td>
            <td class="p-4 text-gray-500">Up to 2</td>
          </tr>
          <tr>
            <td class="p-4 font-bold text-lg">Growth</td>
            <td class="p-4 font-mono text-swave-purple font-bold">$800<span class="text-xs text-gray-400">/mo</span></td>
            <td class="p-4 text-gray-600 dark:text-gray-300">8 Posts, 12 Story Sets, 6 Reels</td>
            <td class="p-4 text-gray-500">Up to 3</td>
          </tr>
          <tr>
            <td class="p-4 font-bold text-lg">Pro</td>
            <td class="p-4 font-mono text-swave-purple font-bold">$1,200<span class="text-xs text-gray-400">/mo</span></td>
            <td class="p-4 text-gray-600 dark:text-gray-300">10 Posts, 16 Story Sets, 10 Reels</td>
            <td class="p-4 text-gray-500">Up to 3</td>
          </tr>
          <tr>
            <td class="p-4 font-bold text-lg">Scale</td>
            <td class="p-4 font-mono text-swave-purple font-bold">$1,800<span class="text-xs text-gray-400">/mo</span></td>
            <td class="p-4 text-gray-600 dark:text-gray-300">12 Posts, 20 Story Sets, 14 Reels</td>
            <td class="p-4 text-gray-500">Up to 4</td>
          </tr>
          <tr>
            <td class="p-4 font-bold text-lg">Authority</td>
            <td class="p-4 font-mono text-swave-purple font-bold">$2,500<span class="text-xs text-gray-400">/mo</span></td>
            <td class="p-4 text-gray-600 dark:text-gray-300">16 Posts, 25 Story Sets, 20 Reels</td>
            <td class="p-4 text-gray-500">5+</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-xl flex items-start gap-3">
        <span class="text-xl">🎁</span>
        <div>
            <p class="font-bold text-orange-800 dark:text-orange-400">New Client Offer</p>
            <p class="text-sm text-orange-700 dark:text-orange-300">$200 OFF per month for the first 3 months on any retainer package.</p>
        </div>
    </div>
  </section>

  <div class="grid md:grid-cols-2 gap-12">
      <section>
        <div class="flex items-center gap-3 mb-6">
            <div class="w-1 h-8 bg-blue-500 rounded-full"></div>
            <h3 class="text-2xl font-black text-gray-900 dark:text-white">Web Development</h3>
        </div>
        <div class="space-y-4">
            <div class="p-5 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold">Starter Brochure</h4>
                    <span class="font-mono font-bold">$1,200</span>
                </div>
                <p class="text-sm text-gray-500">Perfect for new businesses. Up to 2 pages, mobile-first design, launch support.</p>
            </div>
            <div class="p-5 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold">Business System</h4>
                    <span class="font-mono font-bold">$2,000</span>
                </div>
                <p class="text-sm text-gray-500">Service-based booking & leads. Up to 5 pages with conversion optimization.</p>
            </div>
            <div class="p-5 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold">E-Commerce</h4>
                    <span class="font-mono font-bold">$2,900+</span>
                </div>
                <p class="text-sm text-gray-500">Full store setup, payments, shipping rules, and automation.</p>
            </div>
        </div>
      </section>

      <section>
        <div class="flex items-center gap-3 mb-6">
            <div class="w-1 h-8 bg-green-500 rounded-full"></div>
            <h3 class="text-2xl font-black text-gray-900 dark:text-white">Edits & Add-Ons</h3>
        </div>
        <div class="mb-6">
            <p class="text-sm font-bold mb-2 uppercase tracking-wide text-gray-400">Edits Policy</p>
            <p class="text-sm text-gray-600 dark:text-gray-300">Includes 3 free rounds. Additional edits billed at <strong>$60/hour</strong> or flat rate:</p>
            <ul class="mt-2 space-y-1 text-sm text-gray-500">
                <li>• Graphics: $15 (Minor) - $35 (Moderate)</li>
                <li>• Video: $25 (Minor) - $120 (Major Rework)</li>
            </ul>
        </div>
        <div>
            <p class="text-sm font-bold mb-2 uppercase tracking-wide text-gray-400">Growth Tools</p>
            <div class="flex flex-wrap gap-2">
                <span class="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-xs font-bold">Meta Ads ($250+)</span>
                <span class="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-xs font-bold">Content Day ($300+)</span>
                <span class="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-xs font-bold">Email Setup ($200)</span>
            </div>
        </div>
      </section>
  </div>
</div>
`;

export const db = {
  init: async (): Promise<void> => {
    console.log("Supabase Service Initialized");
    try {
        const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true });
        
        if (count === 0) {
            console.log("Seeding Database...");
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
      const { data } = await supabase.from('app_config').select('value').eq('key', 'branding').maybeSingle();
      if (data && data.value) {
          return data.value; 
      }
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
      const { error } = await supabase.from('app_config').upsert({
          key: 'branding',
          value: config
      }, { onConflict: 'key' });
      
      if (error) throw error;
  },

  getRateCard: async (): Promise<string> => {
      const { data } = await supabase.from('app_config').select('value').eq('key', 'rate_card').maybeSingle();
      if (data && data.value && data.value.html) {
          return data.value.html;
      }
      return DEFAULT_RATE_CARD_HTML;
  },

  saveRateCard: async (htmlContent: string): Promise<void> => {
      const { error } = await supabase.from('app_config').upsert({
          key: 'rate_card',
          value: { html: htmlContent }
      }, { onConflict: 'key' });
      if (error) throw error;
  },

  // --- BRAND KITS (ONBOARDING) ---
  getBrandKit: async (clientName: string): Promise<BrandKit | null> => {
      const { data, error } = await supabase.from('client_brand_kits').select('*').eq('client_name', clientName).maybeSingle();
      if (error) return null;
      return data as BrandKit;
  },

  saveBrandKit: async (kit: BrandKit): Promise<void> => {
      const { error } = await supabase.from('client_brand_kits').upsert(kit, { onConflict: 'client_name' });
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
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
      
      if (error || !data) return null;
      
      if (data.password === password) {
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
      const { data, error } = await supabase.from('users').select('*').order('name');
      if (error) return [];
      return data as User[];
  },

  createUser: async (userData: { email: string, password: string, name: string, role: UserRole, clientId?: string }): Promise<void> => {
      const newUser = {
          id: crypto.randomUUID(),
          email: userData.email,
          password: userData.password, 
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
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
  },

  // --- LEGACY RECOVERY ---
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
      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
      await supabase.from('clients').insert({ name, accessCode, currency: 'USD' });
  },

  updateClient: async (originalName: string, updates: Partial<ClientProfile>): Promise<void> => {
      const { error } = await supabase.from('clients').update(updates).eq('name', originalName);
      if (error) throw error;

      if (updates.name && originalName !== updates.name) {
          // Cascade rename if the name is changed
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

      const templates: Template[] = [
          {
              id: crypto.randomUUID(), name: "Corporate Announcement", platform: "LinkedIn",
              captionSkeleton: "We are proud to announce a new strategic partnership with [Partner Name]. This collaboration marks a significant milestone in our journey to [Goal]. Read the full press release here: [Link]",
              tags: ["#Partnership", "#BusinessGrowth"]
          },
          {
              id: crypto.randomUUID(), name: "Hype Launch", platform: "Twitter",
              captionSkeleton: "🚨 IT IS FINALLY HERE! 🚨\n\n[Product Name] is live. You asked, we delivered. \n\nGrab yours before they are gone: [Link] 🔥",
              tags: ["#LaunchDay", "#Hype"]
          },
          {
              id: crypto.randomUUID(), name: "Behind the Scenes", platform: "Instagram",
              captionSkeleton: "Ever wonder what goes into making [Product]? 🛠️ Here is a sneak peek at the team hard at work.\n\nDrop a comment if you want to see more BTS content! 👇",
              tags: ["#BTS", "#TeamCulture"]
          },
          {
              id: crypto.randomUUID(), name: "Educational Tip", platform: "LinkedIn",
              captionSkeleton: "Did you know that [Statistic/Fact]? 💡\n\nMany businesses struggle with [Problem], but the solution is often simpler than you think.\n\n1. [Tip 1]\n2. [Tip 2]\n3. [Tip 3]\n\nFollow for more industry insights!",
              tags: ["#Tips", "#Education"]
          },
          {
              id: crypto.randomUUID(), name: "Flash Sale", platform: "Instagram",
              captionSkeleton: "⚡ FLASH SALE ALERT ⚡\n\nFor the next 24 hours only, get [Discount]% OFF everything!\n\nCode: [Code]\n\nDon't sleep on this. ⏰",
              tags: ["#Sale", "#Discount"]
          }
      ];
      for (const t of templates) await db.saveTemplate(t);

      const snippets: Snippet[] = [
          { id: crypto.randomUUID(), label: "CTA - Bio Link", content: "Tap the link in our bio to get started! 🔗" },
          { id: crypto.randomUUID(), label: "CTA - Sales", content: "Shop the collection now at [Website] 🛍️" },
          { id: crypto.randomUUID(), label: "Tech Hashtags", content: "#TechTrends #Innovation #FutureOfWork #SaaS #StartupLife" },
          { id: crypto.randomUUID(), label: "Legal Disclaimer", content: "*Limited time offer. Terms and conditions apply. Not valid with other offers." },
          { id: crypto.randomUUID(), label: "Question Engagement", content: "What are your thoughts on this? Let us know in the comments! 👇" }
      ];
      for (const s of snippets) await db.saveSnippet(s);

      const services: ServiceItem[] = [
          { id: 'svc_basic', name: 'Basic Content Tier', defaultRate: 500.00, description: '6 Feed Posts, 8 Story Sets, 4 Reels' },
          { id: 'svc_growth', name: 'Growth Content Tier', defaultRate: 800.00, description: '8 Feed Posts, 12 Story Sets, 6 Reels' },
          { id: 'svc_pro', name: 'Pro Content Tier', defaultRate: 1200.00, description: '10 Feed Posts, 16 Story Sets, 10 Reels' },
          { id: 'svc_scale', name: 'Scale Content Tier', defaultRate: 1800.00, description: '12 Feed Posts, 20 Story Sets, 14 Reels' },
          { id: 'svc_authority', name: 'Authority Content Tier', defaultRate: 2500.00, description: '16 Feed Posts, 25 Story Sets, 20 Reels' },
          { id: 'svc_web_starter', name: 'Starter Website (Brochure)', defaultRate: 1200.00, description: 'Mobile-first design, up to 2 pages' },
          { id: 'svc_web_business', name: 'Business Website System', defaultRate: 2000.00, description: 'Service-based booking & leads, up to 5 pages' },
          { id: 'svc_web_ecom', name: 'E-commerce Website', defaultRate: 2900.00, description: 'Store setup, payments, shipping rules' },
          { id: 'svc_care_lite', name: 'Lite Care Plan', defaultRate: 150.00, description: 'Security updates, backups, 1hr edits' },
          { id: 'svc_care_std', name: 'Standard Care Plan', defaultRate: 300.00, description: 'Includes Lite + landing page updates (3hrs)' },
          { id: 'svc_ads', name: 'Paid Ads Management', defaultRate: 250.00, description: 'Meta Ads Management (Starting price)' },
          { id: 'svc_content_day', name: 'Content Day (On-location)', defaultRate: 300.00, description: 'On-location shoot (Starting price)' },
      ];
      for (const svc of services) await db.saveService(svc);

      await db.saveRateCard(DEFAULT_RATE_CARD_HTML);

      const author = "Agency Director";
      const today = new Date().toISOString().split('T')[0];
      
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
         await supabase.from('client_brand_kits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
     } catch (e) {
         console.error("Failed to clear Supabase tables:", e);
     }
  }
};
