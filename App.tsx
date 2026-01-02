
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, Calendar as CalendarIcon, List, Settings as SettingsIcon, 
  LogOut, Plus, Search, Filter, Bell, Menu, X, UploadCloud, 
  Image as ImageIcon, Smile, Save, Loader2, ArrowRight,
  Instagram, Linkedin, Twitter, Facebook, Video, Check, Trash2, RotateCcw, ChevronDown, Building2, Flag
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
import { 
  Post, PostStatus, UserRole, Platform, MediaType, 
  Template, Snippet, PLATFORMS, Campaign 
} from './types';

const SwaveLogo = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M75 35L55 23.45V31.15L68.3 38.85L45 52.3V44.6L25 56.15V67.7L45 79.25V71.55L31.7 63.85L55 50.4V58.1L75 46.55V35Z" fill="currentColor" />
  </svg>
);

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentClient, setCurrentClient] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'kanban' | 'trash'>('list');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showCampaignSelector, setShowCampaignSelector] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PostStatus | 'All'>('All');
  const [filterClient, setFilterClient] = useState<string>('All');
  const [filterCampaign, setFilterCampaign] = useState<string>('All');

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
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
    const init = async () => {
      await db.init();
      const clientNames = await db.getClientNames();
      setClients(clientNames);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => { if (userRole) loadData(); }, [userRole]);

  useEffect(() => {
    if (!loading && userRole === 'agency' && posts.length > 0) {
      const today = new Date().toDateString();
      const lastBriefing = localStorage.getItem('swave_last_daily_briefing');
      if (lastBriefing !== today) {
        setShowDailyBriefing(true);
        localStorage.setItem('swave_last_daily_briefing', today);
      }
    }
  }, [loading, userRole, posts]);

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
    
    if (!isFormOpen) {
        if (userRole === 'client' && currentClient) setNewPostClient(currentClient);
        else if (fetchedClients.length > 0) setNewPostClient(fetchedClients[0]);
    }
    if (!silent) setLoading(false);
  };

  const handleLogin = (role: UserRole, clientName?: string) => {
    setUserRole(role);
    if (clientName) setCurrentClient(clientName);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentClient('');
    setPosts([]);
    setSidebarOpen(false);
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
    if (!newPostCaption || !newPostMediaUrl) { alert("Missing caption or media."); return; }
    if (newPostPlatforms.length === 0) { alert("Select a platform."); return; }
    
    setIsSaving(true);
    const client = userRole === 'client' ? currentClient : newPostClient;
    const dateStr = newPostDate && newPostTime ? `${newPostDate} ${newPostTime}` : new Date().toISOString().split('T')[0];
    const author = userRole === 'agency' ? 'Agency' : currentClient;

    try {
      if (editingPostId) {
        await db.updatePost(editingPostId, {
          caption: newPostCaption, mediaUrl: newPostMediaUrl, mediaType: newPostMediaType,
          date: dateStr, platform: newPostPlatforms[0], client, campaign: newPostCampaign, status: targetStatus
        }, author);
      } else {
        const createPromises = newPostPlatforms.map(platform => 
             db.addPost({ client, platform, campaign: newPostCampaign, date: dateStr, caption: newPostCaption, mediaUrl: newPostMediaUrl, mediaType: newPostMediaType, status: targetStatus }, author)
        );
        await Promise.all(createPromises);
      }
      closeForm();
      loadData(true); 
    } catch (error) { alert("Error saving."); } finally { setIsSaving(false); }
  };

  const handleDeletePost = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    if (post.status === 'Trashed') {
      if (confirm("Delete permanently?")) {
        setPosts(prev => prev.filter(p => p.id !== id));
        await db.deletePost(id);
        loadData(true); 
      }
    } else if (confirm("Trash this post?")) {
        await handleStatusChange(id, 'Trashed');
    }
  };

  const handleRestorePost = async (id: string) => {
      if (confirm("Restore to Draft?")) await handleStatusChange(id, 'Draft');
  };

  const handleStatusChange = async (id: string, status: PostStatus, feedback?: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    if (feedback) {
         await db.addComment(id, {
             author: userRole === 'agency' ? 'Agency' : currentClient,
             role: userRole,
             text: `[Internal Feedback] ${feedback}`,
             isInternal: userRole === 'agency'
         });
    }
    await db.updatePost(id, { status }, userRole === 'agency' ? 'Agency' : currentClient);
    loadData(true); 
  };

  const openNewPostForm = () => {
     setEditingPostId(null);
     setNewPostCaption('');
     setNewPostMediaUrl('');
     setNewPostCampaign('');
     setNewPostDate(new Date().toISOString().split('T')[0]);
     setNewPostTime('12:00');
     setNewPostPlatforms(['Instagram']);
     setIsFormOpen(true);
  };

  const openEditPostForm = (post: Post) => {
    setEditingPostId(post.id);
    setNewPostClient(post.client);
    setNewPostCampaign(post.campaign || '');
    setNewPostPlatforms([post.platform]);
    const [d, t] = post.date.includes(' ') ? post.date.split(' ') : [post.date, ''];
    setNewPostDate(d);
    setNewPostTime(t || '12:00');
    setNewPostCaption(post.caption);
    setNewPostMediaUrl(post.mediaUrl);
    setNewPostMediaType(post.mediaType);
    setIsFormOpen(true);
  };

  const closeForm = () => { setIsFormOpen(false); setShowEmojiPicker(false); };

  const insertSnippet = (content: string) => setNewPostCaption(prev => prev + (prev ? ' ' : '') + content);

  const togglePlatform = (p: Platform) => {
      if (editingPostId) setNewPostPlatforms([p]);
      else setNewPostPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const filteredPosts = posts.filter(p => {
     if (viewMode === 'trash') return p.status === 'Trashed';
     if (p.status === 'Trashed') return false;
     const matchesSearch = p.caption.toLowerCase().includes(searchTerm.toLowerCase()) || p.client.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
     const matchesClient = userRole === 'client' ? p.client === currentClient : (filterClient === 'All' || p.client === filterClient);
     const matchesCampaign = filterCampaign === 'All' || p.campaign === filterCampaign;
     return matchesSearch && matchesStatus && matchesClient && matchesCampaign;
  });

  const notifications = useMemo(() => {
    if (!userRole) return [];
    const list: any[] = [];
    const now = Date.now();
    posts.forEach(p => {
        if (p.status === 'Trashed') return;
        if (userRole === 'client' && p.client !== currentClient) return;
        p.history.forEach(h => {
             if (now - h.timestamp < 172800000) {
                 if (userRole === 'agency' && (h.action.includes('Approved') || h.action.includes('Shift'))) list.push({ id: h.id, postId: p.id, text: `${p.client}: ${h.action}`, time: h.timestamp, type: 'status' });
             }
        });
        p.comments.forEach(c => {
             if (now - c.timestamp < 172800000 && c.role !== userRole && (userRole === 'agency' || !c.isInternal)) {
                list.push({ id: c.id, postId: p.id, text: `${c.author} commented`, time: c.timestamp, type: 'comment' });
             }
        });
    });
    return list.sort((a, b) => b.time - a.time);
  }, [posts, userRole, currentClient]);

  const STATUS_PILLS: { label: string, value: PostStatus | 'All', color: string }[] = [
    { label: 'All', value: 'All', color: 'bg-gray-100 text-gray-800' },
    { label: 'Draft', value: 'Draft', color: 'bg-gray-400 text-white' },
    { label: 'Review', value: 'In Review', color: 'bg-amber-500 text-white' },
    { label: 'Approved', value: 'Approved', color: 'bg-emerald-500 text-white' },
    { label: 'Scheduled', value: 'Scheduled', color: 'bg-blue-500 text-white' },
    { label: 'Published', value: 'Published', color: 'bg-indigo-600 text-white' },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="w-10 h-10 animate-spin text-swave-orange" /></div>;
  if (!userRole) return <Login clients={clients} onLogin={handleLogin} />;
  if (isSettingsOpen) return <Settings clients={clients} templates={templates} snippets={snippets} onUpdate={() => loadData(true)} onClose={() => setIsSettingsOpen(false)} />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-swave-orange/10 rounded-full blur-[160px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-swave-purple/10 rounded-full blur-[160px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
        {showDailyBriefing && <DailyBriefing posts={posts} onClose={() => setShowDailyBriefing(false)} />}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none`}>
            <div className="h-full flex flex-col">
                {/* Logo Section */}
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-swave-purple to-swave-orange flex items-center justify-center p-2 shadow-xl shadow-orange-100 transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                            <SwaveLogo className="w-full h-full text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">SWAVE</h1>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Nav Links */}
                <div className="flex-grow px-4 space-y-8 overflow-y-auto no-scrollbar">
                    {/* OPERATIONS Section */}
                    <div>
                        <p className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4">Operations</p>
                        <div className="space-y-1">
                            <button 
                                onClick={() => { setViewMode('list'); setSidebarOpen(false); }} 
                                className={`w-full flex items-center gap-4 px-4 py-3.5 text-sm font-black rounded-2xl transition-all ${viewMode === 'list' ? 'bg-swave-orange text-white shadow-xl shadow-orange-200' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                            >
                                <List className="w-5 h-5" /> Master Feed
                            </button>
                            <button 
                                onClick={() => { setViewMode('calendar'); setSidebarOpen(false); }} 
                                className={`w-full flex items-center gap-4 px-4 py-3.5 text-sm font-black rounded-2xl transition-all ${viewMode === 'calendar' ? 'bg-swave-orange text-white shadow-xl shadow-orange-200' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                            >
                                <CalendarIcon className="w-5 h-5" /> Schedule Plan
                            </button>
                            <button 
                                onClick={() => { setViewMode('kanban'); setSidebarOpen(false); }} 
                                className={`w-full flex items-center gap-4 px-4 py-3.5 text-sm font-black rounded-2xl transition-all ${viewMode === 'kanban' ? 'bg-swave-orange text-white shadow-xl shadow-orange-200' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                            >
                                <LayoutGrid className="w-5 h-5" /> Workflow Board
                            </button>
                            {userRole === 'agency' && (
                                <button 
                                    onClick={() => { setViewMode('trash'); setSidebarOpen(false); }} 
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 text-sm font-black rounded-2xl transition-all mt-4 ${viewMode === 'trash' ? 'bg-red-500 text-white shadow-xl shadow-red-100' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
                                >
                                    <Trash2 className="w-5 h-5" /> Archive
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ADMINISTRATION Section */}
                    {userRole === 'agency' && (
                        <div>
                             <p className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4">Administration</p>
                             <div className="space-y-1">
                                 <button 
                                   onClick={() => { setIsSettingsOpen(true); setSidebarOpen(false); }} 
                                   className={`w-full flex items-center gap-4 px-4 py-3.5 text-sm font-black rounded-2xl transition-all ${isSettingsOpen ? 'bg-swave-purple text-white shadow-xl' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                                 >
                                    <SettingsIcon className="w-5 h-5" /> Agency Settings
                                </button>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-8 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-4 text-[12px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all active:scale-95"
                    >
                        <LogOut className="w-4 h-4" /> End Session
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Dashboard Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-gray-50/30 dark:bg-gray-950">
            {/* Unified Top Navigation & Filter Bar */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-3xl sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 px-6 py-4 md:px-10">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3 bg-white dark:bg-gray-800 rounded-[1.25rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-transform active:scale-90"><Menu className="w-6 h-6" /></button>
                        
                        {userRole === 'agency' && viewMode !== 'trash' && (
                             <div className="flex gap-3">
                                <div className="relative">
                                    <button onClick={() => { setShowClientSelector(!showClientSelector); setShowCampaignSelector(false); }} className="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95">
                                        <Building2 className="w-4 h-4 text-swave-purple" />
                                        <span className="text-sm font-black text-gray-700 dark:text-gray-200 hidden sm:inline">{filterClient === 'All' ? 'All Portfolios' : filterClient}</span>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>
                                    {showClientSelector && (
                                        <div className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl z-20 overflow-hidden animate-in slide-in-from-top-2">
                                            <button onClick={() => { setFilterClient('All'); setShowClientSelector(false); }} className={`w-full text-left px-6 py-5 text-xs font-black uppercase tracking-widest border-b ${filterClient === 'All' ? 'text-swave-orange' : 'text-gray-600'}`}>Show All</button>
                                            {clients.map(c => <button key={c} onClick={() => { setFilterClient(c); setShowClientSelector(false); }} className={`w-full text-left px-6 py-5 text-xs font-bold border-b ${filterClient === c ? 'text-swave-purple' : 'text-gray-700'}`}>{c}</button>)}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <button onClick={() => { setShowCampaignSelector(!showCampaignSelector); setShowClientSelector(false); }} className="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95">
                                        <Flag className="w-4 h-4 text-swave-orange" />
                                        <span className="text-sm font-black text-gray-700 dark:text-gray-200 hidden sm:inline">{filterCampaign === 'All' ? 'All Campaigns' : filterCampaign}</span>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>
                                    {showCampaignSelector && (
                                        <div className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl z-20 overflow-hidden animate-in slide-in-from-top-2">
                                            <button onClick={() => { setFilterCampaign('All'); setShowCampaignSelector(false); }} className={`w-full text-left px-6 py-5 text-xs font-black uppercase tracking-widest border-b ${filterCampaign === 'All' ? 'text-swave-orange' : 'text-gray-600'}`}>General Feed</button>
                                            {Array.from(new Set(posts.map(p => p.campaign).filter(Boolean))).map(c => (
                                                <button key={c} onClick={() => { setFilterCampaign(c!); setShowCampaignSelector(false); }} className={`w-full text-left px-6 py-5 text-xs font-bold border-b ${filterCampaign === c ? 'text-swave-orange' : 'text-gray-700'}`}>{c}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                         {userRole === 'agency' && viewMode !== 'trash' && (
                             <button onClick={openNewPostForm} className="bg-gradient-to-r from-swave-purple to-swave-orange text-white p-3.5 md:px-6 md:py-4 rounded-2xl text-sm font-black flex items-center gap-2.5 shadow-2xl transition-all active:scale-95"><Plus className="w-6 h-6" /> <span className="hidden md:inline">Produce Post</span></button>
                         )}
                    </div>
                </div>
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1">
                    <div className="flex items-center gap-2.5 p-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 shadow-inner w-full md:w-auto">
                        <div className="flex gap-2.5">
                            {STATUS_PILLS.map((pill) => (
                                <button key={pill.label} onClick={() => setFilterStatus(pill.value)} className={`px-6 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === pill.value ? pill.color + ' shadow-xl scale-105' : 'bg-transparent text-gray-400 hover:text-gray-700'}`}>{pill.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-grow overflow-auto p-6 md:p-12 pb-40 no-scrollbar">
                {(viewMode === 'list' || viewMode === 'trash') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                        {filteredPosts.map(post => <PostCard key={post.id} post={post} role={userRole} onDelete={handleDeletePost} onRestore={handleRestorePost} onStatusChange={handleStatusChange} onEdit={openEditPostForm} onUpdate={() => loadData(true)} />)}
                    </div>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-[4rem] shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col scale-100 animate-in zoom-in-90">
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-white dark:bg-gray-800">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Studio Workspace</h2>
                            <button type="button" onClick={closeForm} className="p-4 hover:bg-gray-100 rounded-3xl transition-all text-gray-500 hover:rotate-180 duration-500"><X className="w-8 h-8" /></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-7 gap-12 no-scrollbar">
                             <div className="lg:col-span-3 space-y-10">
                                  {userRole === 'agency' && (
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Strategic Account</label>
                                        <select value={newPostClient} onChange={e => setNewPostClient(e.target.value)} className="w-full p-5 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black outline-none shadow-xl">{clients.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                    </div>
                                  )}
                                  <div>
                                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Campaign Name</label>
                                      <input list="campaigns-list" value={newPostCampaign} onChange={e => setNewPostCampaign(e.target.value)} placeholder="e.g. Winter Sale 2024" className="w-full p-5 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black outline-none shadow-xl" />
                                      <datalist id="campaigns-list">
                                          {Array.from(new Set(posts.map(p => p.campaign).filter(Boolean))).map(c => <option key={c} value={c!} />)}
                                      </datalist>
                                  </div>
                                  <div>
                                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Target Channels</label>
                                      <div className="flex flex-wrap gap-3">{PLATFORMS.map(p => <button key={p} type="button" onClick={() => togglePlatform(p)} className={`flex items-center gap-3 px-6 py-4 rounded-[1.25rem] text-[11px] font-black border-2 transition-all active:scale-95 ${newPostPlatforms.includes(p) ? 'bg-gray-900 text-white border-gray-900 shadow-2xl' : 'bg-white border-gray-100 text-gray-500 hover:border-swave-orange'}`}>{p}</button>)}</div>
                                  </div>
                                  <div>
                                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Activation Date</label>
                                      <input type="date" value={newPostDate} onChange={e => setNewPostDate(e.target.value)} className="w-full p-5 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-swave-orange/50 text-sm font-black shadow-xl outline-none" />
                                  </div>
                                  <div>
                                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Creative Asset</label>
                                      <div className="border-4 border-dashed border-gray-200 rounded-[3rem] p-10 text-center relative bg-white/30">
                                          {newPostMediaUrl ? (
                                              <div className="relative rounded-[2rem] overflow-hidden bg-gray-100 border flex justify-center items-center min-h-[250px] shadow-2xl">
                                                  {newPostMediaType === 'video' ? <video src={newPostMediaUrl} className="w-full h-auto max-h-[400px] object-contain" controls /> : <img src={newPostMediaUrl} alt="Preview" className="w-full h-auto max-h-[400px] object-contain" />}
                                                  <button type="button" onClick={() => setNewPostMediaUrl('')} className="absolute top-6 right-6 bg-red-500 text-white p-3 rounded-full active:scale-90"><X className="w-6 h-6" /></button>
                                              </div>
                                          ) : (
                                              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                                                  {isUploading ? <Loader2 className="w-16 h-16 animate-spin text-swave-orange"/> : <UploadCloud className="w-16 h-16 mb-5 opacity-40" />}
                                                  <p className="text-sm font-black uppercase">Deploy Assets</p>
                                                  <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                                              </div>
                                          )}
                                      </div>
                                  </div>
                             </div>
                             <div className="lg:col-span-4 flex flex-col h-full space-y-10">
                                 <div className="flex-grow flex flex-col">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex justify-between items-center"><span>Post Copy / Caption</span><span className="font-black bg-swave-purple/10 text-swave-purple px-4 py-1.5 rounded-full text-[10px]">{newPostCaption.length} CHARS</span></label>
                                    <div className="relative flex-grow flex flex-col min-h-[400px]">
                                        <textarea value={newPostCaption} onChange={e => setNewPostCaption(e.target.value)} className="w-full flex-grow p-8 rounded-[2.5rem] bg-white border-none text-[16px] font-medium outline-none resize-none shadow-2xl leading-relaxed transition-all" placeholder="Tell a story..." />
                                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute bottom-8 right-8 text-gray-400 hover:text-swave-orange bg-gray-50 p-4 rounded-3xl shadow-lg active:scale-90"><Smile className="w-7 h-7" /></button>
                                        {showEmojiPicker && <div className="absolute bottom-24 right-8 z-20 shadow-2xl rounded-[2.5rem] overflow-hidden"><EmojiPicker onEmojiClick={(e) => { setNewPostCaption(prev => prev + e.emoji); setShowEmojiPicker(false); }} width={350} height={450} previewConfig={{ showPreview: false }} /></div>}
                                    </div>
                                 </div>
                             </div>
                        </div>
                        <div className="p-10 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-6">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto px-10 py-5 text-gray-400 hover:text-red-500 rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-colors">Discard</button>
                            <div className="flex gap-5 w-full sm:w-auto">
                                <button type="button" disabled={isSaving} onClick={() => handleSavePost('Draft')} className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-gray-100 text-gray-900 rounded-[1.5rem] text-sm font-black active:scale-95 disabled:opacity-50"><Save className="w-5 h-5" /> Store Draft</button>
                                <button type="button" disabled={isSaving} onClick={() => handleSavePost('In Review')} className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-gradient-to-r from-swave-purple to-swave-orange text-white rounded-[1.5rem] text-sm font-black shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest">Finalize & Review</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
}
