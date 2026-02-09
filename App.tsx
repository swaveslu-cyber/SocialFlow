
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    LayoutGrid, Calendar as CalendarIcon, List, Settings as SettingsIcon,
    LogOut, Plus, Search, Bell, Menu, X, UploadCloud,
    Smile, Loader2, ArrowRight, RotateCcw, ChevronDown, Building2, Coffee, BookOpen, BarChart3, Inbox, CheckCheck, DollarSign, Link
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { db } from './services/db';
import { storage } from './services/storage';
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
    Post, PostStatus, User, Platform, MediaType,
    Template, Snippet, PLATFORMS, Campaign, PERMISSIONS, AppConfig, Invoice, ClientProfile, ServiceItem
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

const STATUS_PILLS: { label: string, value: PostStatus | 'All', color: string }[] = [
    { label: 'All', value: 'All', color: 'bg-gray-100 text-gray-800' },
    { label: 'Draft', value: 'Draft', color: 'bg-gray-600 text-white' },
    { label: 'Review', value: 'In Review', color: 'bg-amber-600 text-white' },
    { label: 'Approved', value: 'Approved', color: 'bg-emerald-600 text-white' },
    { label: 'Scheduled', value: 'Scheduled', color: 'bg-blue-600 text-white' },
    { label: 'Published', value: 'Published', color: 'bg-indigo-600 text-white' },
];

export default function App() {
    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Data State
    const [posts, setPosts] = useState<Post[]>([]);
    const [clients, setClients] = useState<ClientProfile[]>([]); // Optimized: Store full profiles
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
    const [branding, setBranding] = useState<AppConfig>(DEFAULT_BRANDING);
    const [loading, setLoading] = useState(true);

    // UI State
    const [currentView, setCurrentView] = useState<'feed' | 'calendar' | 'kanban' | 'archive' | 'finance' | 'reports'>('feed');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showDailyBriefing, setShowDailyBriefing] = useState(false);
    const [showServiceGuide, setShowServiceGuide] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showClientSelector, setShowClientSelector] = useState(false);

    // Filter State
    const [targetPostAction, setTargetPostAction] = useState<{ id: string, mode: 'content' | 'comments' | 'history', triggerId: string } | null>(null);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
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

    const notificationRef = useRef<HTMLDivElement>(null);
    const clientSelectorRef = useRef<HTMLDivElement>(null);
    const saveMenuRef = useRef<HTMLDivElement>(null);

    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('swave_read_notifications');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('swave_read_notifications', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    useEffect(() => {
        const init = async () => {
            await db.init();

            // Fetch branding immediately so Login screen works
            try {
                const fetchedBranding = await db.getAppConfig();
                setBranding(prev => ({ ...prev, ...fetchedBranding }));

                if (fetchedBranding) {
                    document.documentElement.style.setProperty('--color-primary', fetchedBranding.primaryColor || DEFAULT_BRANDING.primaryColor);
                    document.documentElement.style.setProperty('--color-secondary', fetchedBranding.secondaryColor || DEFAULT_BRANDING.secondaryColor);
                    document.title = `${fetchedBranding.agencyName || 'Swave'} - Operations`;
                }
            } catch (e) { console.error("Failed to load initial branding", e); }

            const storedUser = localStorage.getItem('swave_user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setCurrentUser(parsedUser);
                    setFilterClient(parsedUser.clientId || 'All');
                } catch (e) {
                    localStorage.removeItem('swave_user');
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (currentUser) loadData(true);
    }, [currentUser]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
            if (clientSelectorRef.current && !clientSelectorRef.current.contains(event.target as Node)) setShowClientSelector(false);
            if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) setShowSaveMenu(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadData = async (silent: boolean = false) => {
        if (!silent) setLoading(true);
        try {
            // Optimized: Fetching all required data in parallel here to serve as the single source of truth
            const [fetchedPosts, fetchedClients, fetchedCampaigns, fetchedTemplates, fetchedSnippets, fetchedBranding, fetchedInvoices, fetchedUsers, fetchedServices, fetchedBrandKits] = await Promise.all([
                db.getAllPosts(), db.getClients(), db.getCampaigns(), db.getTemplates(), db.getSnippets(), db.getAppConfig(), db.getInvoices(), db.getUsers(), db.getServices(), db.getBrandKits()
            ]);

            const cleanPosts = (fetchedPosts || []).filter(p => p && p.id && p.status);
            setPosts(cleanPosts);
            setClients(fetchedClients || []);
            setCampaigns(fetchedCampaigns || []);
            setTemplates(fetchedTemplates || []);
            setSnippets(fetchedSnippets || []);
            setInvoices(fetchedInvoices || []);
            setAllUsers(fetchedUsers || []);
            setServices(fetchedServices || []);
            setBrandKits(fetchedBrandKits || []);

            let appliedBranding = { ...DEFAULT_BRANDING, ...fetchedBranding };
            setBranding(appliedBranding);

            if (appliedBranding) {
                document.documentElement.style.setProperty('--color-primary', appliedBranding.primaryColor || DEFAULT_BRANDING.primaryColor);
                document.documentElement.style.setProperty('--color-secondary', appliedBranding.secondaryColor || DEFAULT_BRANDING.secondaryColor);
                document.title = `${appliedBranding.agencyName || 'Swave'} - Operations`;
            }

            // Initialize default client selection for new posts
            if (!isFormOpen && !currentUser?.clientId && fetchedClients && fetchedClients.length > 0) {
                setNewPostClient(fetchedClients[0].name);
            } else if (currentUser?.clientId) {
                setNewPostClient(currentUser.clientId);
            }
        } catch (error) {
            console.error("Data load failed", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleLogin = (user: User) => {
        localStorage.setItem('swave_user', JSON.stringify(user));
        setCurrentUser(user);
        setFilterClient(user.clientId || 'All');
    };

    const handleLogout = () => {
        localStorage.removeItem('swave_user');
        setCurrentUser(null);
        setPosts([]);
        setSidebarOpen(false);
        setCurrentView('feed');
    };

    const filteredGroupedPosts = useMemo(() => {
        if (!posts) return [];

        const isTrash = currentView === 'archive';
        const rawFiltered = posts.filter(p => {
            if (!p || !p.id) return false;

            // 1. Strict Client Security Check (Must be first)
            if (currentUser?.clientId && p.client !== currentUser.clientId) {
                return false;
            }

            // 2. View Mode Logic
            if (isTrash) {
                // In Archive View: ONLY show Trashed items
                if (p.status !== 'Trashed') return false;
            } else {
                // In Main View: Hide Trashed items
                if (p.status === 'Trashed') return false;
                // In Main View: Clients should not see Drafts
                if (currentUser?.role.startsWith('client') && p.status === 'Draft') return false;
            }

            const matchesSearch = (p.caption || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.client || '').toLowerCase().includes(searchTerm.toLowerCase());

            // 3. Status Filter (Ignore status pills in Archive view as status is always Trashed)
            const matchesStatus = isTrash ? true : (filterStatus === 'All' || p.status === filterStatus);

            // 4. Agency Client Filter (If agency user, check dropdown selection)
            const matchesClient = currentUser?.clientId ? true : (filterClient === 'All' || p.client === filterClient);

            const matchesCampaign = filterCampaign === 'All' || p.campaign === filterCampaign;
            return matchesSearch && matchesStatus && matchesClient && matchesCampaign;
        });

        const groups: Record<string, GroupedPost> = {};
        rawFiltered.forEach(p => {
            const client = p.client || 'Unknown';
            const campaign = p.campaign || '';
            const date = p.date || '';
            const status = p.status || 'Draft';
            // Group by content similarity
            const key = `${client}-${campaign}-${date}-${status}-${(p.caption || '').substring(0, 20)}`;

            if (!groups[key]) {
                groups[key] = { ...p, ids: [p.id], platforms: [p.platform] };
            } else {
                groups[key].ids.push(p.id);
                groups[key].platforms.push(p.platform);
            }
        });

        return Object.values(groups).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }, [posts, searchTerm, filterStatus, filterClient, filterCampaign, currentUser, currentView]);

    const notifications = useMemo(() => {
        if (!currentUser || !posts) return [];
        const list: any[] = [];
        const now = Date.now();
        const NOTIFICATION_WINDOW = 172800000;

        posts.forEach(p => {
            if (!p || p.status === 'Trashed') return;
            if (currentUser.clientId && p.client !== currentUser.clientId) return;

            if (p.comments) {
                p.comments.forEach(c => {
                    if (now - c.timestamp < NOTIFICATION_WINDOW && c.author !== currentUser.name) {
                        if (c.isInternal && !PERMISSIONS.isInternal(currentUser.role)) return;
                        if (dismissedIds.includes(c.id)) return;
                        list.push({ id: c.id, type: 'post', subtype: 'comment', data: p, text: `${c.author} commented on ${p.client}`, time: c.timestamp });
                    }
                });
            }
        });
        return list.sort((a, b) => b.time - a.time);
    }, [posts, invoices, currentUser, dismissedIds]);

    const openNewPostForm = () => {
        setEditingPostIds([]); setNewPostCaption(''); setNewPostMediaUrl('');
        setNewPostDate(new Date().toISOString().split('T')[0]);
        setNewPostPlatforms(['Instagram']); setIsFormOpen(true);
    };

    const openEditPostForm = (post: GroupedPost) => {
        setEditingPostIds(post.ids); setNewPostClient(post.client); setNewPostPlatforms(post.platforms);
        setNewPostDate(post.date ? post.date.split(' ')[0] : '');
        setNewPostCaption(post.caption || ''); setNewPostMediaUrl(post.mediaUrl || '');
        setNewPostMediaType(post.mediaType || 'image');
        setIsFormOpen(true);
    };

    const closeForm = () => { setIsFormOpen(false); setShowSaveMenu(false); };

    const handleSavePost = async (targetStatus: PostStatus) => {
        if (!newPostCaption) return alert("Missing content");
        setIsSaving(true);
        const dateStr = newPostDate && newPostTime ? `${newPostDate} ${newPostTime}` : new Date().toISOString().split('T')[0];

        try {
            if (editingPostIds.length > 0) {
                await Promise.all(editingPostIds.map(id => db.updatePost(id, { caption: newPostCaption, mediaUrl: newPostMediaUrl, mediaType: newPostMediaType, date: dateStr, status: targetStatus }, currentUser!.name)));
            } else {
                await Promise.all(newPostPlatforms.map(p => db.addPost({ client: newPostClient, platform: p, date: dateStr, caption: newPostCaption, mediaUrl: newPostMediaUrl, mediaType: newPostMediaType, status: targetStatus }, currentUser!.name)));
            }
            closeForm(); loadData(true);
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    const handleStatusChange = async (ids: string[], status: PostStatus, feedback?: string) => {
        try {
            await Promise.all(ids.map(async (id) => {
                if (feedback) {
                    // Omit timestamp, db adds it
                    await db.addComment(id, {
                        author: currentUser!.name,
                        role: currentUser!.role,
                        text: `Feedback: ${feedback}`,
                        isInternal: PERMISSIONS.isInternal(currentUser!.role)
                    });
                }
                return db.updatePost(id, { status }, currentUser!.name);
            }));
            loadData(true);
        } catch (e) { console.error(e); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setIsUploading(true);
            try {
                const url = await storage.uploadFile(e.target.files[0]);
                setNewPostMediaUrl(url);
                setNewPostMediaType(e.target.files[0].type.startsWith('video') ? 'video' : 'image');
            } catch (e: any) { alert(e.message); } finally { setIsUploading(false); }
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-black"><Loader2 className="animate-spin w-8 h-8 text-swave-orange" /></div>;
    if (!currentUser) return <Login onLogin={handleLogin} branding={branding} />;

    const isActive = (view: string) => currentView === view;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#050508] overflow-hidden relative">
            {/* Simple Hexagon Background */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-gray-50 dark:bg-[#050508]">
                <svg className="w-full h-full opacity-40 dark:opacity-20 absolute inset-0" preserveAspectRatio="none">
                    <defs>
                        <pattern id="hex-bg" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
                            <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" fill="#8E3EBB" opacity="0.4" transform="scale(3) translate(20,20)" />
                            <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" fill="#F27A21" opacity="0.4" transform="scale(2.5) translate(80,80)" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hex-bg)" />
                </svg>
            </div>

            {/* OVERLAYS */}
            {showDailyBriefing && <DailyBriefing posts={posts} onClose={() => setShowDailyBriefing(false)} />}
            {showServiceGuide && <ServiceGuide onClose={() => setShowServiceGuide(false)} branding={branding} />}
            {isSettingsOpen && (
                <Settings
                    clients={clients} // Pass full profiles
                    templates={templates}
                    snippets={snippets}
                    onUpdate={() => loadData(true)}
                    onClose={() => setIsSettingsOpen(false)}
                    currentUser={currentUser}
                    users={allUsers}
                    branding={branding}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-[#09090b] border-r border-gray-100 dark:border-white/10 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 p-1.5 shadow-lg border border-gray-100 dark:border-white/10"><SwaveLogo className="w-full h-full" customLogoUrl={branding.logoUrl} /></div>
                        <h1 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white truncate">{branding.agencyName}</h1>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto"><X className="w-6 h-6 text-gray-400" /></button>
                    </div>

                    <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
                        <div>
                            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Operations</p>
                            <button onClick={() => { setCurrentView('feed'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('feed') ? 'bg-swave-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}><List className="w-4 h-4" /> Master Feed</button>
                            <button onClick={() => { setCurrentView('calendar'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('calendar') ? 'bg-swave-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}><CalendarIcon className="w-4 h-4" /> Schedule Plan</button>
                            <button onClick={() => { setCurrentView('kanban'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('kanban') ? 'bg-swave-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}><LayoutGrid className="w-4 h-4" /> Workflow Board</button>
                            <button onClick={() => { setCurrentView('archive'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('archive') ? 'bg-red-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}><RotateCcw className="w-4 h-4" /> Archive</button>
                        </div>
                        <div>
                            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Resources</p>
                            <button onClick={() => { setCurrentView('reports'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('reports') ? 'bg-swave-orange text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}><BarChart3 className="w-4 h-4" /> Reports</button>
                            <button onClick={() => { setCurrentView('finance'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('finance') ? 'bg-swave-orange text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}><DollarSign className="w-4 h-4" /> Finance</button>
                            <button onClick={() => setShowServiceGuide(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"><BookOpen className="w-4 h-4" /> Guide</button>
                        </div>
                        {PERMISSIONS.canManageTeam(currentUser.role) && (
                            <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"><SettingsIcon className="w-4 h-4" /> Settings</button>
                        )}
                    </nav>

                    <div className="p-6 border-t border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-swave-purple text-white flex items-center justify-center font-bold text-xs">{currentUser.name.substring(0, 2)}</div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{currentUser.role.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100"><LogOut className="w-4 h-4" /> Sign Out</button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 md:ml-72 relative z-10">
                {/* HEADER */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/10 px-6 py-3 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 bg-white rounded-lg shadow-sm border"><Menu className="w-5 h-5" /></button>
                        {!currentUser.clientId && (
                            <div className="relative" ref={clientSelectorRef}>
                                <button onClick={() => setShowClientSelector(!showClientSelector)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200">
                                    <Building2 className="w-4 h-4" /> {filterClient === 'All' ? 'All Clients' : filterClient} <ChevronDown className="w-3 h-3" />
                                </button>
                                {showClientSelector && (
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1">
                                        <button onClick={() => { setFilterClient('All'); setShowClientSelector(false) }} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50">All Clients</button>
                                        {clients.map(c => <button key={c.name} onClick={() => { setFilterClient(c.name); setShowClientSelector(false) }} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50">{c.name}</button>)}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl text-sm outline-none w-64 focus:ring-2 focus:ring-swave-orange" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {PERMISSIONS.canEdit(currentUser.role) && (
                            <button onClick={openNewPostForm} className="bg-gradient-to-r from-swave-purple to-swave-orange text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><Plus className="w-4 h-4" /> Create</button>
                        )}
                        <button onClick={() => setShowDailyBriefing(true)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl text-gray-500 hover:text-swave-purple"><Coffee className="w-5 h-5" /></button>
                        <div className="relative" ref={notificationRef}>
                            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl text-gray-500 hover:text-swave-orange relative">
                                <Bell className="w-5 h-5" />
                                {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-bold text-sm flex justify-between">
                                        <span>Notifications</span>
                                        {notifications.length > 0 && <button onClick={() => setDismissedIds(prev => [...prev, ...notifications.map(n => n.id)])}><CheckCheck className="w-4 h-4 text-gray-400" /></button>}
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? <p className="p-4 text-xs text-gray-400 text-center">No new notifications.</p> : notifications.map(n => (
                                            <div key={n.id} onClick={() => { setDismissedIds(prev => [...prev, n.id]); setCurrentView('feed'); setTargetPostAction({ id: n.data.id, mode: 'comments', triggerId: n.id }); setShowNotifications(false); }} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700/50">
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{n.text}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.time).toLocaleTimeString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* CONTENT VIEWS */}
                <div className={`flex-grow overflow-auto p-6 md:p-8 pb-32 ${currentView === 'calendar' ? 'p-0' : ''}`}>
                    {currentView === 'feed' && (
                        <>
                            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {STATUS_PILLS.map(pill => (
                                    <button key={pill.value} onClick={() => setFilterStatus(pill.value)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterStatus === pill.value ? pill.color + ' shadow-md scale-105' : 'bg-white dark:bg-white/10 text-gray-500 hover:bg-gray-100'}`}>{pill.label}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredGroupedPosts.map((post, idx) => (
                                    <PostCard
                                        key={post.ids?.[0] || idx}
                                        post={post as any}
                                        user={currentUser}
                                        onDelete={(ids) => Promise.all(ids.map(id => db.updatePost(id, { status: 'Trashed' }, currentUser.name))).then(() => loadData(true))}
                                        onStatusChange={handleStatusChange}
                                        onEdit={openEditPostForm}
                                        requestedViewMode={targetPostAction && post.ids.includes(targetPostAction.id) ? targetPostAction : undefined}
                                        brandColor={brandKits.find(k => k.client_name === post.client)?.visual_identity.colors.primary}
                                    />
                                ))}
                            </div>
                            {filteredGroupedPosts.length === 0 && <div className="h-64 flex flex-col items-center justify-center text-gray-400"><Inbox className="w-12 h-12 mb-2 opacity-50" /><p className="text-sm font-bold">No posts found</p></div>}
                        </>
                    )}
                    {currentView === 'archive' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredGroupedPosts.map((post, idx) => (
                                <PostCard key={post.ids?.[0] || idx} post={post as any} user={currentUser} onRestore={(ids) => Promise.all(ids.map(id => db.updatePost(id, { status: 'Draft' }, currentUser.name))).then(() => loadData(true))} onDelete={(ids) => Promise.all(ids.map(id => db.deletePost(id))).then(() => loadData(true))} />
                            ))}
                            {filteredGroupedPosts.length === 0 && <div className="h-64 flex flex-col items-center justify-center text-gray-400"><Inbox className="w-12 h-12 mb-2 opacity-50" /><p className="text-sm font-bold">Archive is empty</p></div>}
                        </div>
                    )}
                    {currentView === 'calendar' && (
                        <div className="h-[85vh] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <CalendarView posts={filteredGroupedPosts} onPostClick={openEditPostForm} />
                        </div>
                    )}
                    {currentView === 'kanban' && <KanbanBoard posts={filteredGroupedPosts} user={currentUser} onPostClick={openEditPostForm} onStatusChange={handleStatusChange} onDelete={() => { }} />}
                    {currentView === 'finance' && (
                        <FinanceModule
                            onOpenSidebar={() => setSidebarOpen(true)}
                            currentUser={currentUser}
                            clients={clients}
                            invoices={invoices}
                            services={services}
                            branding={branding}
                            onRefresh={() => loadData(true)}
                        />
                    )}
                    {currentView === 'reports' && (
                        <ReportsModule
                            posts={posts}
                            invoices={invoices}
                            users={allUsers}
                            clients={clients.map(c => c.name)}
                            currentUser={currentUser}
                            onOpenSidebar={() => setSidebarOpen(true)}
                        />
                    )}
                </div>
            </div>

            {/* POST FORM MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={closeForm}>
                    <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Studio</h2>
                            <button onClick={closeForm} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                {!currentUser.clientId && <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">Client</label><select value={newPostClient} onChange={e => setNewPostClient(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold border-none">{clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>}
                                <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">Campaign</label><input list="campaigns" value={newPostCampaign} onChange={e => setNewPostCampaign(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl font-bold border-none" placeholder="e.g. Q1 Launch" /><datalist id="campaigns">{Array.from(new Set(posts.map(p => p.campaign))).map(c => <option key={c} value={c!} />)}</datalist></div>
                                <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">Platforms</label><div className="flex flex-wrap gap-2">{PLATFORMS.map(p => <button key={p} onClick={() => { if (editingPostIds.length === 0) setNewPostPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]) }} className={`px-4 py-2 rounded-xl text-xs font-bold border ${newPostPlatforms.includes(p) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'}`}>{p}</button>)}</div></div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Asset</label>
                                        {newPostMediaUrl && (
                                            <button
                                                onClick={() => { setNewPostMediaUrl(''); setNewPostMediaType('image'); }}
                                                className="text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                CLEAR
                                            </button>
                                        )}
                                    </div>

                                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-1 overflow-hidden relative group min-h-[200px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/50">
                                        {newPostMediaUrl ? (
                                            (() => {
                                                const embedUrl = (url: string) => {
                                                    if (!url) return null;
                                                    // Robust YouTube matching
                                                    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/);
                                                    if (ytMatch && ytMatch[1]) {
                                                        return `https://www.youtube.com/embed/${ytMatch[1]}`;
                                                    }
                                                    if (url.includes('vimeo.com')) {
                                                        const vimeoId = url.split('/').pop();
                                                        if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
                                                    }
                                                    // Canva
                                                    if (url.includes('canva.com/design/')) {
                                                        const match = url.match(/canva\.com\/design\/([A-Za-z0-9_-]+)/);
                                                        if (match && match[1]) {
                                                            return `https://www.canva.com/design/${match[1]}/watch?embed`;
                                                        }
                                                    }
                                                    if (url.includes('canva.com')) return url.includes('embed') ? url : `${url}?embed`;
                                                    return null;
                                                };
                                                const embed = embedUrl(newPostMediaUrl);

                                                // Enhanced detection matching PostCard logic
                                                const isVideo = newPostMediaType === 'video' || newPostMediaUrl.match(/\.(mp4|mov|webm|ogg|m4v)(\?|$)/i);

                                                if (embed) {
                                                    return <iframe src={embed} className="w-full h-64 rounded-2xl bg-black" frameBorder="0" allowFullScreen referrerPolicy="no-referrer" />;
                                                } else if (isVideo) {
                                                    return (
                                                        <video
                                                            key={newPostMediaUrl}
                                                            src={newPostMediaUrl}
                                                            className="w-full max-h-64 object-contain rounded-2xl bg-black"
                                                            controls
                                                            playsInline
                                                            preload="metadata"
                                                            muted
                                                        />
                                                    );
                                                } else {
                                                    return <img src={newPostMediaUrl} className="w-full max-h-64 object-contain rounded-2xl" alt="Preview" />;
                                                }
                                            })()
                                        ) : (
                                            <div className="text-gray-400 flex flex-col items-center p-8 pointer-events-none">
                                                <UploadCloud className="w-10 h-10 mb-3 opacity-50" />
                                                <p className="text-xs font-bold uppercase tracking-wider">Drag & Drop or Click</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" title="Upload File" />
                                    </div>

                                    {/* URL Input */}
                                    <div className="flex gap-3">
                                        <div className="relative flex-grow group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Link className="h-4 w-4 text-gray-400 group-focus-within:text-swave-purple transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={newPostMediaUrl.startsWith('blob:') ? '' : newPostMediaUrl}
                                                onChange={(e) => {
                                                    const url = e.target.value.trim();
                                                    setNewPostMediaUrl(url);
                                                    // Robust Regex for Auto-Detection
                                                    if (url.match(/\.(mp4|mov|webm|ogg|m4v)|youtube|youtu\.be|vimeo|canva/i)) {
                                                        setNewPostMediaType('video');
                                                    }
                                                }}
                                                placeholder="Paste YouTube, Canva, or image link..."
                                                className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-swave-purple outline-none transition-all placeholder-gray-400"
                                            />
                                        </div>
                                        <select
                                            value={newPostMediaType}
                                            onChange={e => setNewPostMediaType(e.target.value as MediaType)}
                                            className="w-28 px-3 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-swave-orange outline-none cursor-pointer"
                                        >
                                            <option value="image">Image</option>
                                            <option value="video">Video</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col h-full space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase flex justify-between"><span>Caption</span><span>{newPostCaption.length} chars</span></label>
                                <div className="flex-1 relative"><textarea value={newPostCaption} onChange={e => setNewPostCaption(e.target.value)} className="w-full h-full p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl resize-none outline-none text-lg font-medium" placeholder="Write something..." /><button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute bottom-4 right-4 p-2 bg-white rounded-xl shadow-md"><Smile className="w-5 h-5 text-gray-500" /></button>{showEmojiPicker && <div className="absolute bottom-16 right-4 z-10"><EmojiPicker onEmojiClick={e => setNewPostCaption(p => p + e.emoji)} width={300} height={400} previewConfig={{ showPreview: false }} /></div>}</div>
                            </div>
                        </div>
                        <div className="p-8 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <button onClick={closeForm} className="text-xs font-bold text-gray-400 hover:text-red-500">DISCARD</button>
                            <div className="flex gap-4">
                                <button onClick={() => handleSavePost('Draft')} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50">Save Draft</button>
                                <div className="relative" ref={saveMenuRef}>
                                    <button onClick={() => setShowSaveMenu(!showSaveMenu)} className="px-8 py-3 bg-swave-purple text-white rounded-xl font-bold text-sm shadow-xl flex items-center gap-2">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'} <ChevronDown className="w-4 h-4" /></button>
                                    {showSaveMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1">
                                            <button onClick={() => handleSavePost('In Review')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> Submit for Review</button>
                                            {PERMISSIONS.canApprove(currentUser.role) && <button onClick={() => handleSavePost('Approved')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Approve</button>}
                                            {PERMISSIONS.canEdit(currentUser.role) && <button onClick={() => handleSavePost('Scheduled')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Schedule</button>}
                                            {PERMISSIONS.canPublish(currentUser.role) && <button onClick={() => handleSavePost('Published')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Publish Now</button>}
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
