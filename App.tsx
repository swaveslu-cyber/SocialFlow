
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, Calendar as CalendarIcon, List, Settings as SettingsIcon, 
  LogOut, Plus, Search, Filter, Bell, Menu, X, UploadCloud, 
  Image as ImageIcon, Smile, Save, Loader2, ArrowRight,
  Instagram, Linkedin, Twitter, Facebook, Video, Check, Trash2, RotateCcw, ChevronDown, Building2, Flag, DollarSign, User as UserIcon, Shield
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
import { SwaveLogo } from './components/Logo';
import { 
  Post, PostStatus, UserRole, User, Platform, MediaType, 
  Template, Snippet, PLATFORMS, Campaign, PERMISSIONS
} from './types';

export interface GroupedPost extends Omit<Post, 'platform' | 'id'> {
  ids: string[];
  platforms: Platform[];
}

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'kanban' | 'trash' | 'finance'>('list');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showCampaignSelector, setShowCampaignSelector] = useState(false);

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
      if (!currentUser) return;
      
      // Auto-filter for client users
      if (currentUser.clientId) {
          setFilterClient(currentUser.clientId);
      }

      loadData();
      const subscription = db.subscribeToPosts(() => loadData(true));
      return () => { subscription.unsubscribe(); };
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    const [fetchedPosts, fetchedClients, fetchedCampaigns, fetchedTemplates, fetchedSnippets] = await Promise.all([
      db.getAllPosts(), db.getClientNames(), db.getCampaigns(), db.getTemplates(), db.getSnippets()
    ]);
    setPosts(fetchedPosts);
    setClients(fetchedClients);
    setCampaigns(fetchedCampaigns);
    setTemplates(fetchedTemplates);
    setSnippets(fetchedSnippets);
    
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
    if (confirm("Trash these posts?")) {
        const promises = ids.map(id => db.updatePost(id, { status: 'Trashed' }, currentUser?.name || 'Unknown'));
        await Promise.all(promises);
    }
  };

  const handleRestorePost = async (ids: string[]) => {
      if (confirm("Restore to Draft?")) {
          const promises = ids.map(id => db.updatePost(id, { status: 'Draft' }, currentUser?.name || 'Unknown'));
          await Promise.all(promises);
      }
  };

  const handleStatusChange = async (ids: string[], status: PostStatus, feedback?: string) => {
    if (!currentUser) return;
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

  const closeForm = () => { setIsFormOpen(false); setShowEmojiPicker(false); };

  const togglePlatform = (p: Platform) => {
      if (editingPostIds.length > 0) return; 
      setNewPostPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const filteredGroupedPosts = useMemo(() => {
    const rawFiltered = posts.filter(p => {
       if (viewMode === 'trash') return p.status === 'Trashed';
       if (p.status === 'Trashed') return false;
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

    return Object.values(groups).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [posts, searchTerm, filterStatus, filterClient, filterCampaign, currentUser, viewMode]);

  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const list: any[] = [];
    const now = Date.now();
    posts.forEach(p => {
        if (p.status === 'Trashed') return;
        if (currentUser.clientId && p.client !== currentUser.clientId) return;
        
        // Notification Logic
        p.comments.forEach(c => {
             if (now - c.timestamp < 172800000 && c.author !== currentUser.name) {
                 if (c.isInternal && !PERMISSIONS.isInternal(currentUser.role)) return;
                 list.push({ id: c.id, postId: p.id, text: `${c.author} commented`, time: c.timestamp });
             }
        });
    });
    return list.sort((a, b) => b.time - a.time);
  }, [posts, currentUser]);

  const STATUS_PILLS: { label: string, value: PostStatus | 'All', color: string }[] = [
    { label: 'All', value: 'All', color: 'bg-gray-100 text-gray-800' },
    { label: 'Draft', value: 'Draft', color: 'bg-gray-400 text-white' },
    { label: 'Review', value: 'In Review', color: 'bg-amber-500 text-white' },
    { label: 'Approved', value: 'Approved', color: 'bg-emerald-500 text-white' },
    { label: 'Scheduled', value: 'Scheduled', color: 'bg-blue-500 text-white' },
    { label: 'Published', value: 'Published', color: 'bg-indigo-600 text-white' },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="w-10 h-10 animate-spin text-swave-orange" /></div>;
  if (!currentUser) return <Login onLogin={handleLogin} />;
  
  if (isSettingsOpen) return <Settings clients={clients} templates={templates} snippets={snippets} onUpdate={() => loadData(true)} onClose={() => setIsSettingsOpen(false)} currentUser={currentUser} />;

  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-gray-950 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-swave-orange/10 rounded-full blur-[160px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-swave-purple/10 rounded-full blur-[160px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
        {showDailyBriefing && <DailyBriefing posts={posts} onClose={() => setShowDailyBriefing(false)} />}

        <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none`}>
            <div className="h-full flex flex-col">
                <div className="p-8 short:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 short:w-8 short:h-8 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center p-1.5 shadow-xl shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-gray-700 transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                            <SwaveLogo className="w-full h-full" />
                        </div>
                        <h1 className="text-2xl short:text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">SWAVE</h1>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow px-4 short:px-2 space-y-8 short:space-y-4 overflow-y-auto no-scrollbar">
                    <div>
                        <p className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4 short:mb-2">Operations</p>
                        <div className="space-y-1">
                            <button onClick={() => { setViewMode('list'); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'list' ? 'bg-swave-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <List className="w-5 h-5 short:w-4 short:h-4" /> Master Feed
                            </button>
                            <button onClick={() => { setViewMode('calendar'); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'calendar' ? 'bg-swave-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <CalendarIcon className="w-5 h-5 short:w-4 short:h-4" /> Schedule Plan
                            </button>
                            <button onClick={() => { setViewMode('kanban'); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'kanban' ? 'bg-swave-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <LayoutGrid className="w-5 h-5 short:w-4 short:h-4" /> Workflow Board
                            </button>
                            {PERMISSIONS.canDelete(currentUser.role) && (
                                <button onClick={() => { setViewMode('trash'); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all mt-4 short:mt-2 ${viewMode === 'trash' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'}`}>
                                    <Trash2 className="w-5 h-5 short:w-4 short:h-4" /> Archive
                                </button>
                            )}
                        </div>
                    </div>
                    {PERMISSIONS.canViewFinance(currentUser.role) && (
                        <div>
                            <p className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4 short:mb-2">Finance</p>
                            <div className="space-y-1">
                                <button onClick={() => { setViewMode('finance'); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${viewMode === 'finance' ? 'bg-swave-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <DollarSign className="w-5 h-5 short:w-4 short:h-4" /> Invoicing
                                </button>
                            </div>
                        </div>
                    )}
                    {PERMISSIONS.canManageTeam(currentUser.role) && (
                        <div>
                             <p className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4 short:mb-2">Administration</p>
                             <div className="space-y-1">
                                 <button onClick={() => { setIsSettingsOpen(true); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 short:py-2 text-sm font-black rounded-2xl transition-all ${isSettingsOpen ? 'bg-swave-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <SettingsIcon className="w-5 h-5 short:w-4 short:h-4" /> Settings & Team
                                </button>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-8 short:p-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${!currentUser.clientId ? 'bg-swave-purple' : 'bg-swave-orange'}`}>
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

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-transparent dark:bg-gray-950">
            {viewMode === 'finance' ? <FinanceModule /> : (
            <>
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-3xl sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 px-6 py-4 md:px-8 short:py-2">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-6 short:mb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3 short:p-2 bg-white dark:bg-gray-800 rounded-[1.25rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-transform active:scale-90"><Menu className="w-6 h-6 short:w-5 short:h-5" /></button>
                        
                        {/* ROLE INDICATOR BADGE */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                             <div className={`w-2 h-2 rounded-full ${currentUser.role.includes('admin') ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{currentUser.role.replace('_', ' ')} View</span>
                        </div>

                        {!currentUser.clientId && viewMode !== 'trash' && (
                             <div className="flex gap-3 short:gap-1.5">
                                <div className="relative">
                                    <button onClick={() => { setShowClientSelector(!showClientSelector); setShowCampaignSelector(false); }} className="flex items-center gap-3 px-6 py-3.5 short:py-2 short:px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95">
                                        <Building2 className="w-4 h-4 text-swave-purple" />
                                        <span className="text-sm font-black text-gray-700 dark:text-gray-200 hidden sm:inline">{filterClient === 'All' ? 'All Portfolios' : filterClient}</span>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>
                                    {showClientSelector && (
                                        <div className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl z-20 overflow-hidden animate-in slide-in-from-top-2">
                                            <button onClick={() => { setFilterClient('All'); setShowClientSelector(false); }} className={`w-full text-left px-6 py-5 text-xs font-black uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${filterClient === 'All' ? 'text-swave-orange' : 'text-gray-600'}`}>Show All</button>
                                            <div className="max-h-80 overflow-y-auto no-scrollbar">
                                                {clients.map(c => <button key={c} onClick={() => { setFilterClient(c); setShowClientSelector(false); }} className={`w-full text-left px-6 py-5 text-xs font-bold border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${filterClient === c ? 'text-swave-purple' : 'text-gray-700 dark:text-gray-200'}`}>{c}</button>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 short:gap-1.5">
                         {PERMISSIONS.canEdit(currentUser.role) && viewMode !== 'trash' && (
                             <button onClick={openNewPostForm} className="bg-gradient-to-r from-swave-purple to-swave-orange text-white p-3.5 md:px-6 md:py-4 short:py-2 rounded-2xl text-sm font-black flex items-center gap-2.5 shadow-2xl shadow-orange-300/40 dark:shadow-none hover:scale-[1.02] transition-all active:scale-95"><Plus className="w-6 h-6 md:w-5 md:h-5" /> <span className="hidden md:inline">Produce Post</span></button>
                         )}
                         <div className="relative" ref={notificationRef}>
                            <button onClick={() => setShowNotifications(!showNotifications)} className="p-3.5 short:p-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-swave-orange transition-all active:scale-90">
                                <Bell className="w-6 h-6 short:w-5 short:h-5" />
                                {notifications.length > 0 && <span className="absolute top-3.5 right-3.5 w-3.5 h-3.5 short:w-2.5 short:h-2.5 bg-red-500 rounded-full border-4 border-white dark:border-gray-800"></span>}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-5 w-80 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-top-2">
                                     <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900">
                                         <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Inbox</span>
                                         <span className="text-[10px] bg-swave-orange text-white px-3 py-1 rounded-full font-black tracking-widest ml-2">{notifications.length} NEW</span>
                                     </div>
                                     <div className="max-h-[400px] overflow-y-auto no-scrollbar pb-2">
                                         {notifications.length === 0 ? <div className="p-12 text-center text-gray-400 text-sm font-bold italic opacity-40">Your inbox is clear. ✨</div> : notifications.map(n => <div key={n.id} onClick={() => { const p = posts.find(post => post.id === n.postId); if(p) { /* handle scroll to or open */ setShowNotifications(false); } }} className="p-5 border-b border-gray-50 dark:border-gray-800 hover:bg-orange-50/40 dark:hover:bg-orange-900/10 cursor-pointer flex gap-4 transition-colors">
                                             <div className="mt-2 flex-shrink-0 w-3 h-3 rounded-full bg-swave-orange" />
                                             <div className="flex-grow"><p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 leading-snug">{n.text}</p><p className="text-xs text-gray-400 font-black mt-2 uppercase tracking-widest">{new Date(n.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p></div>
                                         </div>)}
                                     </div>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 short:pb-1">
                    <div className="flex items-center gap-2.5 p-2 short:p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-inner w-full md:w-auto">
                        <div className="flex gap-2.5 short:gap-1.5 min-w-full md:min-w-0">
                            {STATUS_PILLS.map((pill) => <button key={pill.label} onClick={() => setFilterStatus(pill.value)} className={`px-6 py-2.5 short:py-1.5 short:px-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === pill.value ? pill.color + ' shadow-xl scale-105 ring-4 ring-white dark:ring-gray-900 z-10' : 'bg-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{pill.label}</button>)}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-grow overflow-auto p-6 md:p-8 pb-20 no-scrollbar short:p-4 short:pb-24">
                {(viewMode === 'list' || viewMode === 'trash') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 short:gap-4">
                        {filteredGroupedPosts.map(post => <PostCard key={post.ids[0]} post={post as any} user={currentUser} onDelete={handleDeletePost} onRestore={handleRestorePost} onStatusChange={handleStatusChange} onEdit={openEditPostForm} onUpdate={() => loadData(true)} />)}
                    </div>
                )}
                {viewMode === 'calendar' && <div className="h-full bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"><CalendarView posts={filteredGroupedPosts as any} onPostClick={openEditPostForm} /></div>}
                {viewMode === 'kanban' && <KanbanBoard posts={filteredGroupedPosts as any} user={currentUser} onPostClick={openEditPostForm} onStatusChange={handleStatusChange} onDelete={handleDeletePost} />}
            </div>
            </>
            )}
        </main>

        {isFormOpen && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in short:p-2">
                {/* Form Logic kept simple for brevity, assumed standard edits */}
                 <div className="bg-white dark:bg-gray-800 rounded-[4rem] shadow-2xl w-full max-w-[95vw] h-[95vh] short:h-[98vh] short:rounded-[2rem] overflow-hidden flex flex-col scale-100 animate-in zoom-in-90">
                    <div className="p-10 short:p-4 border-b border-gray-100 flex justify-between items-center bg-white dark:bg-gray-800">
                        <h2 className="text-3xl short:text-xl font-black text-gray-900 dark:text-white tracking-tighter">Studio Workspace</h2>
                        <button type="button" onClick={closeForm} className="p-4 short:p-2 hover:bg-gray-100 rounded-3xl transition-all text-gray-500 hover:rotate-180 duration-500"><X className="w-8 h-8 short:w-6 short:h-6" /></button>
                    </div>
                    {/* Simplified Layout Reuse */}
                    <div className="flex-grow overflow-y-auto p-10 lg:p-12 short:p-4 grid grid-cols-1 lg:grid-cols-7 gap-12 short:gap-6 no-scrollbar">
                           <div className="lg:col-span-3 space-y-10 short:space-y-4">
                                {!currentUser.clientId && (
                                <div className="short:flex short:items-center short:gap-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 short:mb-0 short:w-32">Strategic Account</label>
                                    <select value={newPostClient} onChange={e => setNewPostClient(e.target.value)} className="w-full p-5 short:p-3 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black outline-none shadow-xl">{clients.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                </div>
                                )}
                                <div className="short:flex short:items-center short:gap-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 short:mb-0 short:w-32">Campaign Name</label>
                                    <input list="campaigns-list" value={newPostCampaign} onChange={e => setNewPostCampaign(e.target.value)} placeholder="e.g. Winter Sale 2024" className="w-full p-5 short:p-3 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black outline-none shadow-xl" />
                                    <datalist id="campaigns-list">{Array.from(new Set(posts.map(p => p.campaign).filter(Boolean))).map(c => <option key={c} value={c!} />)}</datalist>
                                </div>
                                <div className="short:flex short:items-center short:gap-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 short:mb-0 short:w-32">Channels</label>
                                    <div className="flex flex-wrap gap-3 short:gap-1.5">{PLATFORMS.map(p => <button key={p} type="button" onClick={() => togglePlatform(p)} className={`flex items-center gap-3 short:gap-1.5 px-6 py-4 short:py-2 short:px-3 rounded-[1.25rem] text-[11px] font-black border-2 transition-all active:scale-95 ${newPostPlatforms.includes(p) ? 'bg-gray-900 text-white border-gray-900 shadow-2xl' : 'bg-white border-gray-100 text-gray-500 hover:border-swave-orange'}`}>{p}</button>)}</div>
                                </div>
                                <div className="short:flex short:items-center short:gap-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 short:mb-0 short:w-32">Activation</label>
                                    <input type="date" value={newPostDate} onChange={e => setNewPostDate(e.target.value)} className="w-full p-5 short:p-3 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black shadow-xl outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 short:mb-2">Creative Asset</label>
                                    <div className="border-4 border-dashed border-gray-200 rounded-[3rem] short:rounded-[1.5rem] p-10 short:p-4 text-center relative bg-white/30">
                                        {newPostMediaUrl ? (
                                            <div className="relative rounded-[2rem] short:rounded-[1rem] overflow-hidden bg-gray-100 border flex justify-center items-center min-h-[250px] short:min-h-[150px] shadow-2xl">
                                                {newPostMediaType === 'video' ? <video src={newPostMediaUrl} className="w-full h-auto max-h-[400px] short:max-h-[200px] object-contain" controls /> : <img src={newPostMediaUrl} alt="Preview" className="w-full h-auto max-h-[400px] short:max-h-[200px] object-contain" />}
                                                <button type="button" onClick={() => setNewPostMediaUrl('')} className="absolute top-6 right-6 short:top-2 short:right-2 bg-red-500 text-white p-3 short:p-2 rounded-full active:scale-90"><X className="w-6 h-6 short:w-4 short:h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="py-12 short:py-4 flex flex-col items-center justify-center text-gray-400">
                                                {isUploading ? <Loader2 className="w-16 h-16 short:w-8 short:h-8 animate-spin text-swave-orange"/> : <UploadCloud className="w-16 h-16 short:w-8 short:h-8 mb-5 short:mb-2 opacity-40" />}
                                                <p className="text-sm font-black uppercase tracking-widest">Deploy Assets</p>
                                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-4 flex flex-col h-full space-y-10 short:space-y-4">
                                <div className="flex-grow flex flex-col">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 short:mb-2 flex justify-between items-center"><span>Post Copy / Caption</span><span className="font-black bg-swave-purple/10 text-swave-purple px-4 py-1.5 rounded-full text-[10px]">{newPostCaption.length} CHARS</span></label>
                                <div className="relative flex-grow flex flex-col min-h-[400px] short:min-h-[200px]">
                                    <textarea value={newPostCaption} onChange={e => setNewPostCaption(e.target.value)} className="w-full flex-grow p-8 short:p-4 rounded-[2.5rem] short:rounded-[1.5rem] bg-white border-none text-[16px] short:text-sm font-medium outline-none resize-none shadow-2xl leading-relaxed transition-all" placeholder="Tell a story..." />
                                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute bottom-8 right-8 short:bottom-4 short:right-4 text-gray-400 hover:text-swave-orange bg-gray-50 p-4 short:p-2 rounded-3xl shadow-lg active:scale-90"><Smile className="w-7 h-7 short:w-5 short:h-5" /></button>
                                    {showEmojiPicker && <div className="absolute bottom-24 right-8 short:bottom-16 short:right-4 z-20 shadow-2xl rounded-[2.5rem] overflow-hidden"><EmojiPicker onEmojiClick={(e) => { setNewPostCaption(prev => prev + e.emoji); setShowEmojiPicker(false); }} width={350} height={450} previewConfig={{ showPreview: false }} /></div>}
                                </div>
                                </div>
                            </div>
                    </div>
                    <div className="p-10 short:p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-6 short:gap-2">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto px-10 py-5 short:py-2 text-gray-400 hover:text-red-500 rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-colors">Discard</button>
                        <div className="flex gap-5 short:gap-2 w-full sm:w-auto">
                            <button type="button" disabled={isSaving} onClick={() => handleSavePost('Draft')} className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 short:py-3 short:px-4 bg-gray-100 text-gray-900 rounded-[1.5rem] text-sm font-black active:scale-95 disabled:opacity-50"><Save className="w-5 h-5" /> Store Draft</button>
                            {PERMISSIONS.canApprove(currentUser.role) ? (
                                <button type="button" disabled={isSaving} onClick={() => handleSavePost('Approved')} className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 short:py-3 short:px-6 bg-gradient-to-r from-swave-purple to-swave-orange text-white rounded-[1.5rem] text-sm font-black shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest"><Check className="w-5 h-5"/> Final Approval</button>
                            ) : (
                                <button type="button" disabled={isSaving} onClick={() => handleSavePost('In Review')} className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 short:py-3 short:px-6 bg-gradient-to-r from-swave-purple to-swave-orange text-white rounded-[1.5rem] text-sm font-black shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest">Submit for Review</button>
                            )}
                        </div>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
}
