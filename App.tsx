
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, Calendar as CalendarIcon, List, Settings as SettingsIcon, 
  LogOut, Plus, Search, Filter, Bell, Menu, X, UploadCloud, 
  Image as ImageIcon, Smile, Save, Loader2, ArrowRight,
  Instagram, Linkedin, Facebook, Video, Check, Trash2, RotateCcw, ChevronDown, Building2, Flag, DollarSign, User as UserIcon, Shield, Sun, Coffee, BookOpen, BarChart3, ChevronUp, Inbox, CheckCheck
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './services/firebaseConfig';
import { db } from './services/db';
import { Login } from './components/Login';
import { PostCard } from './components/PostCard';
import { CalendarView } from './components/CalendarView';
import { KanbanBoard } from './components/KanbanBoard';
import { Settings } from './components/Settings';
import { DailyBriefing } from './components/DailyBriefing';
import { FinanceModule } from './components/FinanceModule';
import { ServiceGuide } from './components/ServiceGuide';
import { ReportsModule } from './components/ReportsModule';
import { SwaveLogo } from './components/Logo';
import { 
  Post, PostStatus, UserRole, User, Platform, MediaType, 
  Template, Snippet, PLATFORMS, Campaign, PERMISSIONS, AppConfig, Invoice
} from './types';

export interface GroupedPost extends Omit<Post, 'platform' | 'id'> {
  ids: string[];
  platforms: Platform[];
}

const DEFAULT_BRANDING: AppConfig = { 
    agencyName: 'SWAVE', 
    primaryColor: '#8E3EBB', 
    secondaryColor: '#F27A21',
    primaryTextColor: '#FFFFFF',
    secondaryTextColor: '#FFFFFF',
    buttonColor: '#F3F4F6',
    buttonTextColor: '#1F2937'
};

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [branding, setBranding] = useState<AppConfig>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'kanban' | 'trash' | 'finance' | 'reports'>('list');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [showServiceGuide, setShowServiceGuide] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [showClientSelector, setShowClientSelector] = useState(false);
  const clientSelectorRef = useRef<HTMLDivElement>(null);

  const [showCampaignSelector, setShowCampaignSelector] = useState(false);
  
  // New: Calendar specific UI state
  const [isCalendarFocused, setIsCalendarFocused] = useState(false);

  // New: Invoice Deep Linking from Notifications
  const [notificationInvoiceId, setNotificationInvoiceId] = useState<string | null>(null);

  // Save Menu State
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('swave_read_notifications');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });

  useEffect(() => {
      localStorage.setItem('swave_read_notifications', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PostStatus | 'All'>('All');
  const [filterClient, setFilterClient] = useState<string>('All');
  const [filterCampaign, setFilterCampaign] = useState<string>('All');

  // Form State
  const [editingPostIds, setEditingPostIds] = useState<string[]>([]);
  const [newPostClient, setNewPostClient] = useState('');
  const [newPostCampaign, setNewPostCampaign] = useState('');
  const [newPostPlatforms, setNewPostPlatforms] = useState<Platform[]>(['Instagram']);
  const [newPostDate, setNewPostDate] = useState('');
  const [newPostTime, setNewPostTime] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [newPostMediaType, setNewPostMediaType] = useState<MediaType>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // --- SESSION PERSISTENCE & INIT ---
  useEffect(() => {
    const init = async () => {
      await db.init();
      
      // Check for persisted user session
      const storedUser = localStorage.getItem('swave_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          setFilterClient(parsedUser.clientId || 'All');
        } catch (e) {
          console.error("Failed to parse stored user", e);
          localStorage.removeItem('swave_user');
        }
      }

      const clientNames = await db.getClientNames();
      setClients(clientNames);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
      // Load and apply branding every time user loads or updates occur
      loadData(true);
      const subscription = db.subscribeToPosts(() => loadData(true));
      return () => { subscription.unsubscribe(); };
  }, [currentUser]); // Trigger load on user change too

  // Dynamic CSS Variable Injection for Branding
  useEffect(() => {
      if (branding) {
          document.documentElement.style.setProperty('--color-primary', branding.primaryColor || DEFAULT_BRANDING.primaryColor);
          document.documentElement.style.setProperty('--color-secondary', branding.secondaryColor || DEFAULT_BRANDING.secondaryColor);
          document.documentElement.style.setProperty('--color-primary-text', branding.primaryTextColor || DEFAULT_BRANDING.primaryTextColor!);
          document.documentElement.style.setProperty('--color-secondary-text', branding.secondaryTextColor || DEFAULT_BRANDING.secondaryTextColor!);
          document.documentElement.style.setProperty('--color-button', branding.buttonColor || DEFAULT_BRANDING.buttonColor!);
          document.documentElement.style.setProperty('--color-button-text', branding.buttonTextColor || DEFAULT_BRANDING.buttonTextColor!);
          document.title = `${branding.agencyName} - Operations`;
      }
  }, [branding]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
          setShowNotifications(false);
      }
      if (clientSelectorRef.current && !clientSelectorRef.current.contains(event.target as Node)) {
          setShowClientSelector(false);
      }
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) {
          setShowSaveMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    const [fetchedPosts, fetchedClients, fetchedCampaigns, fetchedTemplates, fetchedSnippets, fetchedBranding, fetchedInvoices, fetchedUsers] = await Promise.all([
      db.getAllPosts(), db.getClientNames(), db.getCampaigns(), db.getTemplates(), db.getSnippets(), db.getAppConfig(), db.getInvoices(), db.getUsers()
    ]);
    setPosts(fetchedPosts);
    setClients(fetchedClients);
    setCampaigns(fetchedCampaigns);
    setTemplates(fetchedTemplates);
    setSnippets(fetchedSnippets);
    setInvoices(fetchedInvoices);
    setAllUsers(fetchedUsers);
    
    // START: Branding Logic
    // STRICT MODE: Enforce Default/Global branding (Extension of Website)
    // Client-specific override logic removed to maintain consistent App ID
    let appliedBranding = { ...DEFAULT_BRANDING, ...fetchedBranding };
    setBranding(appliedBranding);
    // END: Branding Logic
    
    // Set default client selection for Agency Admins/Creators
    if (!isFormOpen && !currentUser?.clientId && fetchedClients.length > 0) {
        setNewPostClient(fetchedClients[0]);
    } else if (currentUser?.clientId) {
        setNewPostClient(currentUser.clientId);
    }

    if (!silent) setLoading(false);
  };

  const handleLogin = (user: User) => {
    // Save session
    localStorage.setItem('swave_user', JSON.stringify(user));
    setCurrentUser(user);
    setFilterClient(user.clientId || 'All');
  };

  const handleLogout = () => {
    // Clear session
    localStorage.removeItem('swave_user');
    setCurrentUser(null);
    setPosts([]);
    setSidebarOpen(false);
    setViewMode('list');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPostMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setIsUploading(true);
      try {
        const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setNewPostMediaUrl(url);
      } catch (error) { alert("Upload failed."); } finally { setIsUploading(false); }
    }
  };

  const handleSavePost = async (targetStatus: PostStatus) => {
    if (!currentUser) return;
    if (!newPostCaption || !newPostMediaUrl) { alert("Missing caption or media."); return; }
    if (newPostPlatforms.length === 0) { alert("Select a platform."); return; }
    
    setIsSaving(true);
    const client = currentUser.clientId || newPostClient;
    const dateStr = newPostDate && newPostTime ? `${newPostDate} ${newPostTime}` : new Date().toISOString().split('T')[0];
    const authorName = currentUser.name;

    try {
      if (editingPostIds.length > 0) {
        const updatePromises = editingPostIds.map(id => 
           db.updatePost(id, { caption: newPostCaption, mediaUrl: newPostMediaUrl, mediaType: newPostMediaType, date: dateStr, campaign: newPostCampaign, status: targetStatus }, authorName)
        );
        await Promise.all(updatePromises);
      } else {
        const createPromises = newPostPlatforms.map(platform => 
             db.addPost({ client, platform, campaign: newPostCampaign, date: dateStr, caption: newPostCaption, mediaUrl: newPostMediaUrl, mediaType: newPostMediaType, status: targetStatus }, authorName)
        );
        await Promise.all(createPromises);
      }
      closeForm();
      loadData(true); 
    } catch (error) { alert("Error saving."); } finally { setIsSaving(false); }
  };

  const handleDeletePost = async (ids: string[]) => {
    // Check if we are in the Archive view to determine if this is a permanent delete
    const isPermanent = viewMode === 'trash';
    const message = isPermanent 
        ? "Permanently delete these posts? This cannot be undone." 
        : "Move to Archive? Posts are deleted automatically after 15 days.";

    if (confirm(message)) {
        try {
            if (isPermanent) {
                const promises = ids.map(id => db.deletePost(id));
                await Promise.all(promises);
            } else {
                const promises = ids.map(id => db.updatePost(id, { status: 'Trashed' }, currentUser?.name || 'Unknown'));
                await Promise.all(promises);
            }
            // Force data reload to update UI immediately
            await loadData(true);
        } catch (e) {
            console.error("Delete failed", e);
            alert("Failed to delete posts. Please try again.");
        }
    }
  };

  const handleRestorePost = async (ids: string[]) => {
      if (confirm("Restore to Draft?")) {
          const promises = ids.map(id => db.updatePost(id, { status: 'Draft' }, currentUser?.name || 'Unknown'));
          await Promise.all(promises);
          await loadData(true);
      }
  };

  const handleStatusChange = async (ids: string[], status: PostStatus, feedback?: string) => {
    if (!currentUser) return;
    try {
      const promises = ids.map(async (id) => {
          if (feedback) {
              await db.addComment(id, {
                  author: currentUser.name,
                  role: currentUser.role,
                  text: `[Feedback] ${feedback}`,
                  isInternal: PERMISSIONS.isInternal(currentUser.role)
              });
          }
          return db.updatePost(id, { status }, currentUser.name);
      });
      await Promise.all(promises);
      // Reload data to reflect changes in UI
      await loadData(true);
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status.");
    }
  };

  const openNewPostForm = () => {
     setEditingPostIds([]);
     setNewPostCaption('');
     setNewPostMediaUrl('');
     setNewPostCampaign('');
     setNewPostDate(new Date().toISOString().split('T')[0]);
     setNewPostTime('12:00');
     setNewPostPlatforms(['Instagram']);
     if (currentUser?.clientId) setNewPostClient(currentUser.clientId);
     setIsFormOpen(true);
  };

  const openEditPostForm = (post: GroupedPost) => {
    setEditingPostIds(post.ids);
    setNewPostClient(post.client);
    setNewPostCampaign(post.campaign || '');
    setNewPostPlatforms(post.platforms);
    const [d, t] = post.date.includes(' ') ? post.date.split(' ') : [post.date, ''];
    setNewPostDate(d);
    setNewPostTime(t || '12:00');
    setNewPostCaption(post.caption);
    setNewPostMediaUrl(post.mediaUrl);
    setNewPostMediaType(post.mediaType);
    setIsFormOpen(true);
  };

  const closeForm = () => { setIsFormOpen(false); setShowEmojiPicker(false); setShowSaveMenu(false); };

  const togglePlatform = (p: Platform) => {
      if (editingPostIds.length > 0) return; 
      setNewPostPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const filteredGroupedPosts = useMemo(() => {
    const rawFiltered = posts.filter(p => {
       if (viewMode === 'trash') return p.status === 'Trashed';
       if (p.status === 'Trashed') return false;
       
       // SECURITY: Hide Drafts from Clients
       if (currentUser?.role.startsWith('client') && p.status === 'Draft') return false;

       const matchesSearch = p.caption.toLowerCase().includes(searchTerm.toLowerCase()) || p.client.toLowerCase().includes(searchTerm.toLowerCase());
       const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
       // Logic: If user has a clientId, strictly filter by it. Else allow 'All' filter selection.
       const matchesClient = currentUser?.clientId ? p.client === currentUser.clientId : (filterClient === 'All' || p.client === filterClient);
       const matchesCampaign = filterCampaign === 'All' || p.campaign === filterCampaign;
       return matchesSearch && matchesStatus && matchesClient && matchesCampaign;
    });

    const groups: Record<string, GroupedPost> = {};
    rawFiltered.forEach(p => {
        const key = `${p.client}-${p.campaign}-${p.date}-${p.caption}-${p.mediaUrl}-${p.status}`;
        if (!groups[key]) {
            groups[key] = { ...p, ids: [p.id], platforms: [p.platform] };
        } else {
            groups[key].ids.push(p.id);
            groups[key].platforms.push(p.platform);
        }
    });

    return Object.values(groups).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [posts, searchTerm, filterStatus, filterClient, filterCampaign, currentUser, viewMode]);

  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const list: any[] = [];
    const now = Date.now();
    const NOTIFICATION_WINDOW = 172800000; // 48 hours

    // 1. POST NOTIFICATIONS (Comments, History, Creation)
    posts.forEach(p => {
        if (p.status === 'Trashed') return;
        if (currentUser.clientId && p.client !== currentUser.clientId) return;
        
        // A. Comments
        p.comments.forEach(c => {
             if (now - c.timestamp < NOTIFICATION_WINDOW && c.author !== currentUser.name) {
                 if (c.isInternal && !PERMISSIONS.isInternal(currentUser.role)) return;
                 if (dismissedIds.includes(c.id)) return;
                 list.push({ 
                     id: c.id, 
                     type: 'post', 
                     data: p,
                     text: `${c.author} commented on ${p.client}`, 
                     time: c.timestamp 
                 });
             }
        });

        // B. History (Creation, Status Changes, Edits)
        p.history.forEach(h => {
            if (now - h.timestamp < NOTIFICATION_WINDOW && h.by !== currentUser.name) {
                if (dismissedIds.includes(h.id)) return;
                
                let msg = `${h.by}: ${h.action}`;
                if (h.action === 'Asset Deployed') msg = `${h.by} created a new post`;
                else if (h.action === 'Workflow Shift') msg = `${h.by} updated status: ${h.details}`;
                else if (h.action === 'Copy Refined') msg = `${h.by} edited caption`;

                list.push({
                    id: h.id,
                    type: 'post',
                    data: p,
                    text: msg,
                    time: h.timestamp
                });
            }
        });
    });

    // 2. INVOICE NOTIFICATIONS
    if (PERMISSIONS.canViewFinance(currentUser.role)) {
        invoices.forEach(inv => {
            if (currentUser.clientId && inv.clientName !== currentUser.clientId) return;

            // A. New Invoice (Checking creation time)
            if (now - inv.createdAt < NOTIFICATION_WINDOW) {
                const notifId = `inv-create-${inv.id}`;
                if (!dismissedIds.includes(notifId)) {
                    // Only show if we didn't just create it ourselves (rough check via timestamp usually fine, but strictly everyone gets notified of new finance docs)
                    // If user is client, definitely show. If user is agency, still useful to know a draft started by someone else.
                    list.push({
                        id: notifId,
                        type: 'invoice',
                        itemId: inv.id, // Store ID directly for deep linking
                        text: `New Invoice #${inv.invoiceNumber} created for ${inv.clientName}`,
                        time: inv.createdAt
                    });
                }
            }

            // B. Invoice Comments
            if (inv.comments) {
                inv.comments.forEach(c => {
                    if (now - c.timestamp < NOTIFICATION_WINDOW && c.author !== currentUser.name) {
                        if (dismissedIds.includes(c.id)) return;
                        list.push({
                            id: c.id,
                            type: 'invoice',
                            itemId: inv.id,
                            text: `${c.author} on Invoice #${inv.invoiceNumber}: ${c.text}`,
                            time: c.timestamp
                        });
                    }
                });
            }
        });
    }

    return list.sort((a, b) => b.time - a.time);
  }, [posts, invoices, currentUser, dismissedIds]);

  const handleNotificationClick = (n: any) => {
      setDismissedIds(prev => [...prev, n.id]);
      setShowNotifications(false);
      
      if (n.type === 'post') {
          // Construct grouped post structure for editor
          const p = n.data;
          const grouped: any = { ...p, ids: [p.id], platforms: [p.platform] };
          openEditPostForm(grouped);
      } else if (n.type === 'invoice') {
          setNotificationInvoiceId(n.itemId);
          setViewMode('finance');
      }
  };

  const handleMarkAllRead = () => {
      const ids = notifications.map(n => n.id);
      setDismissedIds(prev => [...prev, ...ids]);
      setShowNotifications(false);
  };

  const STATUS_PILLS: { label: string, value: PostStatus | 'All', color: string }[] = [
    { label: 'All', value: 'All', color: 'bg-gray-100 text-gray-800' },
    { label: 'Draft', value: 'Draft', color: 'bg-gray-600 text-white' }, // Darkened from 400
    { label: 'Review', value: 'In Review', color: 'bg-amber-600 text-white' }, // Darkened from 500
    { label: 'Approved', value: 'Approved', color: 'bg-emerald-600 text-white' }, // Darkened from 500
    { label: 'Scheduled', value: 'Scheduled', color: 'bg-blue-600 text-white' }, // Darkened from 500
    { label: 'Published', value: 'Published', color: 'bg-indigo-600 text-white' }, // Good
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050508]"><Loader2 className="w-10 h-10 animate-spin text-swave-orange" /></div>;
  if (!currentUser) return <Login onLogin={handleLogin} branding={branding} />;
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#050508] overflow-hidden relative transition-colors duration-500">
        {/* Background Gradients matching the Website Image */}
        <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-[#8E3EBB]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-60 animate-pulse duration-[10000ms]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-[#F27A21]/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50 animate-pulse duration-[7000ms]"></div>
        
        {/* Logo Pattern Overlay (Updated to Colored Hexagons) */}
        <div className="absolute inset-0 pointer-events-none z-0">
            <svg className="w-full h-full opacity-30 dark:opacity-40" width="100%" height="100%">
                <defs>
                    <pattern id="hex-pattern" x="0" y="0" width="600" height="600" patternUnits="userSpaceOnUse">
                        {/* Large Purple - Top/Left */}
                        <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" fill="#8E3EBB" opacity="0.6" transform="translate(50, 0) scale(4)"/>
                        {/* Large Orange - Bottom/Center overlap */}
                        <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" fill="#F27A21" opacity="0.6" transform="translate(250, 200) scale(3.5)"/>
                        {/* Purple Outline - Top Right */}
                        <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" stroke="#8E3EBB" strokeWidth="3" fill="none" opacity="0.7" transform="translate(400, 50) scale(3)"/>
                    </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#hex-pattern)" />
            </svg>
        </div>

        {/* Modals & Overlays - Click outside behavior implemented on wrapper divs */}
        {showDailyBriefing && <DailyBriefing posts={posts} onClose={() => setShowDailyBriefing(false)} />}
        {showServiceGuide && <ServiceGuide onClose={() => setShowServiceGuide(false)} branding={branding} />}
        
        {isSettingsOpen && (
            <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-in fade-in" onClick={() => setIsSettingsOpen(false)}>
                <div onClick={e => e.stopPropagation()} className="w-full max-w-[1920px]">
                    <Settings 
                        clients={clients} 
                        templates={templates} 
                        snippets={snippets} 
                        onUpdate={() => loadData(true)} 
                        onClose={() => setIsSettingsOpen(false)} 
                        currentUser={currentUser} 
                    />
                </div>
            </div>
        )}

        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
            <div className="fixed inset-0 z-[55] bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Hide Sidebar in Calendar Focus Mode. Added overflow-hidden to prevent content bleeding when w-0 */}
        <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-[#09090b] border-r border-gray-100 dark:border-white/10 transform transition-all duration-300 ease-in-out overflow-hidden md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isCalendarFocused ? 'md:-translate-x-full md:w-0 md:opacity-0' : 'md:w-72 md:opacity-100'} shadow-2xl md:shadow-none`}>
            {/* Sidebar Content Omitted for brevity as it hasn't changed... */}
            <div className="h-full flex flex-col min-w-[18rem]">
                <div className="p-8 short:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 short:w-8 short:h-8 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center p-1.5 shadow-xl shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-white/10 transition-transform hover:scale-110 active:scale-95 cursor-pointer overflow-hidden">
                            <SwaveLogo className="w-full h-full" customLogoUrl={branding.logoUrl} />
                        </div>
                        <h1 className="text-xl short:text-lg font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase truncate max-w-[140px]">{branding.agencyName}</h1>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow px-4 short:px-2 space-y-8 short:space-y-4 overflow-y-auto">
                    <div>
                        <p className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4 short:mb-2">Operations</p>
                        <div className="space-y-1">
                            <button onClick={() => { setViewMode('list'); setSidebarOpen(false); setIsCalendarFocused(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'list' ? 'bg-swave-orange text-swave-orange-text shadow-lg shadow-orange-500/20' : 'bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                <List className="w-5 h-5 short:w-4 short:h-4" /> Master Feed
                            </button>
                            <button onClick={() => { setViewMode('calendar'); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'calendar' ? 'bg-swave-orange text-swave-orange-text shadow-lg shadow-orange-500/20' : 'bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                <CalendarIcon className="w-5 h-5 short:w-4 short:h-4" /> Schedule Plan
                            </button>
                            <button onClick={() => { setViewMode('kanban'); setSidebarOpen(false); setIsCalendarFocused(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'kanban' ? 'bg-swave-orange text-swave-orange-text shadow-lg shadow-orange-500/20' : 'bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                <LayoutGrid className="w-5 h-5 short:w-4 short:h-4" /> Workflow Board
                            </button>
                            {PERMISSIONS.canDelete(currentUser.role) && (
                                <button onClick={() => { setViewMode('trash'); setSidebarOpen(false); setIsCalendarFocused(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all mt-4 short:mt-2 ${viewMode === 'trash' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'}`}>
                                    <Trash2 className="w-5 h-5 short:w-4 short:h-4" /> Archive
                                </button>
                            )}
                        </div>
                    </div>
                    {/* ... other nav items ... */}
                    <div>
                        <p className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4 short:mb-2">Resources</p>
                        <div className="space-y-1">
                             <button onClick={() => { setViewMode('reports'); setSidebarOpen(false); setIsCalendarFocused(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'reports' ? 'bg-swave-orange text-swave-orange-text shadow-lg shadow-orange-500/20' : 'bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                <BarChart3 className="w-5 h-5 short:w-4 short:h-4" /> Reports & Stats
                            </button>
                             <button onClick={() => { setShowServiceGuide(true); setSidebarOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10">
                                <BookOpen className="w-5 h-5 short:w-4 short:h-4" /> Service Guide
                            </button>
                             {PERMISSIONS.canViewFinance(currentUser.role) && (
                                <button onClick={() => { setViewMode('finance'); setSidebarOpen(false); setIsCalendarFocused(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'finance' ? 'bg-swave-orange text-swave-orange-text shadow-lg shadow-orange-500/20' : 'bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                    <DollarSign className="w-5 h-5 short:w-4 short:h-4" /> Invoicing
                                </button>
                             )}
                        </div>
                    </div>
                    {PERMISSIONS.canManageTeam(currentUser.role) && (
                        <div>
                             <p className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4 short:mb-2">Administration</p>
                             <div className="space-y-1">
                                 <button onClick={() => { setIsSettingsOpen(true); setSidebarOpen(false); setIsCalendarFocused(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${isSettingsOpen ? 'bg-swave-purple text-swave-purple-text shadow-lg shadow-purple-500/20' : 'bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                    <SettingsIcon className="w-5 h-5 short:w-4 short:h-4" /> Settings & Team
                                </button>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-8 short:p-4 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${!currentUser.clientId ? 'bg-swave-purple text-swave-purple-text' : 'bg-swave-orange text-swave-orange-text'}`}>
                            {currentUser.name.substring(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                            <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-gray-400" />
                                <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{currentUser.role.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2.5 px-4 py-4 short:py-2 text-[12px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all active:scale-95">
                        <LogOut className="w-4 h-4" /> End Session
                    </button>
                </div>
            </div>
        </aside>

        {/* Updated Main with Z-Index fix for Full Screen Calendar */}
        <main className={`flex-1 flex flex-col min-w-0 overflow-hidden relative bg-transparent transition-all ${isCalendarFocused ? 'z-[70]' : 'z-10'}`}>
            {viewMode === 'finance' && <FinanceModule onOpenSidebar={() => setSidebarOpen(true)} currentUser={currentUser} initialInvoiceId={notificationInvoiceId} />}
            {viewMode === 'reports' && (
                <ReportsModule 
                    posts={posts} 
                    invoices={invoices} 
                    users={allUsers}
                    clients={clients}
                    currentUser={currentUser}
                    onOpenSidebar={() => setSidebarOpen(true)}
                />
            )}
            
            {(viewMode === 'list' || viewMode === 'calendar' || viewMode === 'kanban' || viewMode === 'trash') && (
            <>
            {/* Header - Hidden when Calendar Focus is Active */}
            {!isCalendarFocused && (
            <header className="bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-3xl sticky top-0 z-40 border-b border-gray-100 dark:border-white/10 px-6 py-4 md:px-8 short:py-2 animate-in slide-in-from-top-2">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-6 short:mb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3 short:p-2 bg-white dark:bg-gray-800 rounded-[1.25rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-transform active:scale-90"><Menu className="w-6 h-6 short:w-5 short:h-5" /></button>
                        
                        {/* ROLE INDICATOR BADGE */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/5">
                             <div className={`w-2 h-2 rounded-full ${currentUser.role.includes('admin') ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{currentUser.role.replace('_', ' ')} View</span>
                        </div>

                        {!currentUser.clientId && viewMode !== 'trash' && (
                             <div className="flex gap-3 short:gap-1.5">
                                <div className="relative" ref={clientSelectorRef}>
                                    <button onClick={() => { setShowClientSelector(!showClientSelector); setShowCampaignSelector(false); }} className="flex items-center gap-3 px-6 py-3.5 short:py-2 short:px-4 bg-[var(--color-button)] text-[var(--color-button-text)] dark:bg-white/10 dark:text-gray-200 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-all active:scale-95 hover:bg-gray-200 dark:hover:bg-white/20">
                                        <Building2 className="w-4 h-4 text-swave-purple" />
                                        <span className="text-sm font-black hidden sm:inline">{filterClient === 'All' ? 'All Portfolios' : filterClient}</span>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>
                                    {showClientSelector && (
                                        <div className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-[#1a1a1e] rounded-[2.5rem] shadow-2xl z-20 overflow-hidden animate-in slide-in-from-top-2 border border-gray-100 dark:border-white/10">
                                            <button onClick={() => { setFilterClient('All'); setShowClientSelector(false); }} className={`w-full text-left px-6 py-5 text-xs font-black uppercase tracking-widest border-b border-gray-50 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${filterClient === 'All' ? 'text-swave-orange' : 'text-gray-600'}`}>Show All</button>
                                            <div className="max-h-80 overflow-y-auto">
                                                {clients.map(c => <button key={c} onClick={() => { setFilterClient(c); setShowClientSelector(false); }} className={`w-full text-left px-6 py-5 text-xs font-bold border-b border-gray-50 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${filterClient === c ? 'text-swave-purple' : 'text-gray-700 dark:text-gray-200'}`}>{c}</button>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* SEARCH BAR */}
                        {viewMode !== 'trash' && (
                             <div className="relative hidden xl:block group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-swave-orange transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-64 pl-10 pr-3 py-3.5 border border-gray-200 dark:border-white/10 bg-[var(--color-button)] text-[var(--color-button-text)] dark:bg-white/5 dark:text-white rounded-2xl text-sm font-medium focus:ring-2 focus:ring-swave-orange focus:border-swave-orange transition-all outline-none placeholder-gray-400"
                                    placeholder="Search content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                             </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 short:gap-1.5">
                         {PERMISSIONS.canEdit(currentUser.role) && viewMode !== 'trash' && (
                             <button onClick={openNewPostForm} className="bg-gradient-to-r from-swave-purple to-swave-orange text-swave-purple-text p-3.5 md:px-6 md:py-4 short:py-2 rounded-2xl text-sm font-black flex items-center gap-2.5 shadow-2xl shadow-orange-300/40 dark:shadow-none hover:scale-[1.02] transition-all active:scale-95"><Plus className="w-6 h-6 md:w-5 md:h-5" /> <span className="hidden md:inline">Produce Post</span></button>
                         )}
                         <div className="flex gap-2">
                             <button onClick={() => setShowDailyBriefing(true)} className="p-3.5 short:p-2 bg-[var(--color-button)] text-[var(--color-button-text)] dark:bg-white/5 dark:text-gray-400 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 hover:text-swave-purple transition-all active:scale-90" title="Daily Briefing">
                                <Coffee className="w-6 h-6 short:w-5 short:h-5" />
                             </button>
                             <div className="relative" ref={notificationRef}>
                                <button onClick={() => setShowNotifications(!showNotifications)} className="p-3.5 short:p-2 bg-[var(--color-button)] text-[var(--color-button-text)] dark:bg-white/5 dark:text-gray-400 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 hover:text-swave-orange transition-all active:scale-90">
                                    <Bell className="w-6 h-6 short:w-5 short:h-5" />
                                    {notifications.length > 0 && <span className="absolute top-3.5 right-3.5 w-3.5 h-3.5 short:w-2.5 short:h-2.5 bg-red-500 rounded-full border-4 border-white dark:border-[#09090b]"></span>}
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 top-full mt-5 w-80 bg-white dark:bg-[#1a1a1e] rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/10 overflow-hidden z-50 animate-in slide-in-from-top-2">
                                         <div className="px-6 py-5 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                                             <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Inbox</span>
                                                <span className="text-[10px] bg-swave-orange text-swave-orange-text px-3 py-1 rounded-full font-black tracking-widest">{notifications.length} NEW</span>
                                             </div>
                                             {notifications.length > 0 && (
                                                 <button onClick={handleMarkAllRead} className="text-gray-400 hover:text-swave-purple p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" title="Mark all as read">
                                                     <CheckCheck className="w-4 h-4"/>
                                                 </button>
                                             )}
                                         </div>
                                         <div className="max-h-[400px] overflow-y-auto pb-2">
                                             {notifications.length === 0 ? <div className="p-12 text-center text-gray-400 text-sm font-bold italic opacity-40">Your inbox is clear. ✨</div> : notifications.map(n => <div key={n.id} onClick={() => handleNotificationClick(n)} className="p-5 border-b border-gray-50 dark:border-white/5 hover:bg-orange-50/40 dark:hover:bg-orange-900/20 cursor-pointer flex gap-4 transition-colors">
                                                 <div className="mt-2 flex-shrink-0 w-3 h-3 rounded-full bg-swave-orange" />
                                                 <div className="flex-grow"><p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 leading-snug">{n.text}</p><p className="text-xs text-gray-400 font-black mt-2 uppercase tracking-widest">{new Date(n.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p></div>
                                             </div>)}
                                         </div>
                                    </div>
                                )}
                             </div>
                         </div>
                    </div>
                </div>
                {/* STATUS FILTER PILLS - FULL BLEED SCROLL FIX */}
                <div className="-mx-6 px-6 md:mx-0 md:px-0 overflow-x-auto pb-2 pt-1 short:pb-1 no-scrollbar">
                    <div className="inline-flex items-center gap-2.5 p-2 short:p-1 bg-gray-100/50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-inner whitespace-nowrap">
                        <div className="flex gap-2.5 short:gap-1.5">
                            {STATUS_PILLS.map((pill) => <button key={pill.label} onClick={() => setFilterStatus(pill.value)} className={`px-6 py-2.5 short:py-1.5 short:px-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === pill.value ? pill.color + ' shadow-xl scale-105 ring-4 ring-white dark:ring-[#09090b] z-10' : 'bg-[var(--color-button)] text-[var(--color-button-text)] border border-gray-200 dark:border-white/10 hover:opacity-80 dark:bg-white/5 dark:text-gray-400'}`}>{pill.label}</button>)}
                        </div>
                    </div>
                </div>
            </header>
            )}

            <div className={`flex-grow overflow-auto ${isCalendarFocused ? 'p-0' : 'p-6 md:p-8 pb-20 short:p-4 short:pb-24'}`}>
                {(viewMode === 'list' || viewMode === 'trash') && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 short:gap-4">
                            {filteredGroupedPosts.map(post => <PostCard key={post.ids[0]} post={post as any} user={currentUser} onDelete={handleDeletePost} onRestore={handleRestorePost} onStatusChange={handleStatusChange} onEdit={openEditPostForm} onUpdate={() => loadData(true)} />)}
                        </div>
                        {filteredGroupedPosts.length === 0 && (
                            <div className="h-96 flex flex-col items-center justify-center text-center opacity-40">
                                <Inbox className="w-16 h-16 text-gray-400 mb-4" />
                                <h3 className="text-xl font-black text-gray-400">All caught up!</h3>
                                <p className="text-sm font-bold text-gray-300 mt-2">No posts match your filters.</p>
                            </div>
                        )}
                    </>
                )}
                {viewMode === 'calendar' && (
                    <div className="h-full bg-white dark:bg-[#09090b] rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                        <CalendarView 
                            posts={filteredGroupedPosts as any} 
                            onPostClick={openEditPostForm} 
                            onToggleFocus={setIsCalendarFocused}
                        />
                    </div>
                )}
                {viewMode === 'kanban' && <KanbanBoard posts={filteredGroupedPosts as any} user={currentUser} onPostClick={openEditPostForm} onStatusChange={handleStatusChange} onDelete={handleDeletePost} />}
            </div>
            </>
            )}
        </main>
        {/* Form Logic - Modal with click outside to close */}
        {isFormOpen && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-0 md:p-4 animate-in fade-in" onClick={closeForm}>
                 <div className="bg-white dark:bg-[#09090b] rounded-none md:rounded-[4rem] shadow-2xl w-full md:max-w-[95vw] h-full md:h-[95vh] overflow-hidden flex flex-col scale-100 animate-in zoom-in-90 border border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 md:p-10 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#09090b] shrink-0">
                        <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Studio Workspace</h2>
                        <button type="button" onClick={closeForm} className="p-2 md:p-4 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl md:rounded-3xl transition-all text-gray-500 hover:rotate-180 duration-500"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
                    </div>
                    {/* Simplified Layout Reuse */}
                    <div className="flex-grow overflow-y-auto p-4 md:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-7 gap-6 md:gap-12">
                           {/* ... Form content ... */}
                           <div className="lg:col-span-3 space-y-6 md:space-y-10">
                                {!currentUser.clientId && (
                                <div className="md:flex md:items-center md:gap-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 md:mb-0 md:w-32">Strategic Account</label>
                                    <select value={newPostClient} onChange={e => setNewPostClient(e.target.value)} className="w-full p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] bg-white dark:bg-[#1a1a1e] dark:text-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black outline-none shadow-xl">{clients.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                </div>
                                )}
                                <div className="md:flex md:items-center md:gap-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 md:mb-0 md:w-32">Campaign Name</label>
                                    <input list="campaigns-list" value={newPostCampaign} onChange={e => setNewPostCampaign(e.target.value)} placeholder="e.g. Winter Sale 2024" className="w-full p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] bg-white dark:bg-[#1a1a1e] dark:text-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black outline-none shadow-xl" />
                                    <datalist id="campaigns-list">{Array.from(new Set(posts.map(p => p.campaign).filter(Boolean))).map(c => <option key={c} value={c!} />)}</datalist>
                                </div>
                                <div className="md:flex md:items-center md:gap-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 md:mb-0 md:w-32">Channels</label>
                                    <div className="flex flex-wrap gap-2 md:gap-3">{PLATFORMS.map(p => <button key={p} type="button" onClick={() => togglePlatform(p)} className={`flex items-center gap-1.5 px-3 py-2 md:px-6 md:py-4 rounded-xl md:rounded-[1.25rem] text-[10px] md:text-[11px] font-black border-2 transition-all active:scale-95 ${newPostPlatforms.includes(p) ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-2xl' : 'bg-white dark:bg-[#1a1a1e] border-gray-100 dark:border-white/10 text-gray-500 hover:border-swave-orange'}`}>{p}</button>)}</div>
                                </div>
                                <div className="md:flex md:items-center md:gap-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 md:mb-0 md:w-32">Activation</label>
                                    <input type="date" value={newPostDate} onChange={e => setNewPostDate(e.target.value)} className="w-full p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] bg-white dark:bg-[#1a1a1e] dark:text-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black shadow-xl outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-2 md:mb-4">Creative Asset</label>
                                    <div className="border-4 border-dashed border-gray-200 dark:border-white/10 rounded-3xl md:rounded-[3rem] p-4 md:p-10 text-center relative bg-white/30 dark:bg-white/5">
                                        {newPostMediaUrl ? (
                                            <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/10 flex justify-center items-center min-h-[150px] md:min-h-[250px] shadow-2xl">
                                                {newPostMediaType === 'video' ? <video src={newPostMediaUrl} className="w-full h-auto max-h-[200px] md:max-h-[400px] object-contain" controls /> : <img src={newPostMediaUrl} alt="Preview" className="w-full h-auto max-h-[200px] md:max-h-[400px] object-contain" />}
                                                <button type="button" onClick={() => setNewPostMediaUrl('')} className="absolute top-2 right-2 md:top-6 md:right-6 bg-red-500 text-white p-2 md:p-3 rounded-full active:scale-90"><X className="w-4 h-4 md:w-6 md:h-6" /></button>
                                            </div>
                                        ) : (
                                            <div className="py-8 md:py-12 flex flex-col items-center justify-center text-gray-400">
                                                {isUploading ? <Loader2 className="w-8 h-8 md:w-16 md:h-16 animate-spin text-swave-orange"/> : <UploadCloud className="w-8 h-8 md:w-16 md:h-16 mb-2 md:mb-5 opacity-40" />}
                                                <p className="text-xs md:text-sm font-black uppercase tracking-widest">Deploy Assets</p>
                                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-4 flex flex-col h-full space-y-4 md:space-y-10">
                                <div className="flex-grow flex flex-col">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 md:mb-4 flex justify-between items-center"><span>Post Copy / Caption</span><span className="font-black bg-swave-purple/10 text-swave-purple px-4 py-1.5 rounded-full text-[10px]">{newPostCaption.length} CHARS</span></label>
                                <div className="relative flex-grow flex flex-col min-h-[200px] md:min-h-[400px]">
                                    <textarea value={newPostCaption} onChange={e => setNewPostCaption(e.target.value)} className="w-full flex-grow p-4 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-white dark:bg-[#1a1a1e] dark:text-gray-200 border-none text-sm md:text-[16px] font-medium outline-none resize-none shadow-2xl leading-relaxed transition-all placeholder-gray-400" placeholder="Tell a story..." />
                                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute bottom-4 right-4 md:bottom-8 md:right-8 text-gray-400 hover:text-swave-orange bg-gray-50 dark:bg-white/10 p-2 md:p-4 rounded-2xl md:rounded-3xl shadow-lg active:scale-90"><Smile className="w-5 h-5 md:w-7 md:h-7" /></button>
                                    {showEmojiPicker && <div className="absolute bottom-16 right-4 md:bottom-24 md:right-8 z-20 shadow-2xl rounded-[2.5rem] overflow-hidden"><EmojiPicker onEmojiClick={(e) => { setNewPostCaption(prev => prev + e.emoji); setShowEmojiPicker(false); }} width={300} height={400} previewConfig={{ showPreview: false }} /></div>}
                                </div>
                                </div>
                            </div>
                    </div>
                    <div className="p-4 md:p-10 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#09090b] flex flex-row justify-between items-center gap-3 md:gap-6 shrink-0">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-3 text-gray-400 hover:text-red-500 rounded-xl text-xs md:text-sm font-black uppercase tracking-[0.2em] transition-colors hidden sm:block">Discard</button>
                        <button type="button" onClick={() => setIsFormOpen(false)} className="p-3 text-gray-400 hover:text-red-500 rounded-xl sm:hidden border border-gray-100 dark:border-white/10"><Trash2 className="w-5 h-5" /></button>

                        <div className="flex flex-wrap gap-3 md:gap-5 w-full sm:w-auto justify-end">
                            <button type="button" disabled={isSaving} onClick={() => handleSavePost('Draft')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-10 md:py-5 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-xl md:rounded-[1.5rem] text-xs md:text-sm font-black active:scale-95 disabled:opacity-50"><Save className="w-4 h-4 md:w-5 md:h-5" /> Save Draft</button>
                            
                            {/* Unified Save Dropdown */}
                            <div className="relative flex-1 sm:flex-none" ref={saveMenuRef}>
                                <button 
                                    type="button" 
                                    disabled={isSaving} 
                                    onClick={() => setShowSaveMenu(!showSaveMenu)} 
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 md:px-10 md:py-5 bg-gradient-to-r from-swave-purple to-swave-orange text-white rounded-xl md:rounded-[1.5rem] text-xs md:text-sm font-black shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    Save & Update <ChevronDown className={`w-4 h-4 transition-transform ${showSaveMenu ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {showSaveMenu && (
                                    <div className="absolute bottom-full right-0 mb-3 w-64 bg-white dark:bg-[#1a1a1e] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                                        <div className="p-2 space-y-1">
                                            <button onClick={() => handleSavePost('In Review')} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 rounded-xl transition-colors flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Submit for Review
                                            </button>
                                            
                                            {PERMISSIONS.canApprove(currentUser.role) && (
                                                <button onClick={() => handleSavePost('Approved')} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 rounded-xl transition-colors flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Approve
                                                </button>
                                            )}
                                            
                                            {['agency_admin', 'agency_creator'].includes(currentUser.role) && (
                                                <button onClick={() => handleSavePost('Scheduled')} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 rounded-xl transition-colors flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Schedule
                                                </button>
                                            )}
                                            
                                            {['agency_admin'].includes(currentUser.role) && (
                                                <button onClick={() => handleSavePost('Published')} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div> Publish Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
}
