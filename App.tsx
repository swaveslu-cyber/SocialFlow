
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, Calendar as CalendarIcon, List, Settings as SettingsIcon, 
  LogOut, Plus, Search, Filter, Bell, Menu, X, UploadCloud, 
  Image as ImageIcon, Smile, Save, Loader2,
  Instagram, Linkedin, Twitter, Facebook, Video, Check
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
  Template, Snippet, PLATFORMS 
} from './types';

export default function App() {
  // Auth State
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentClient, setCurrentClient] = useState<string>('');

  // Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<string[]>([]); // Just names
  const [templates, setTemplates] = useState<Template[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'kanban'>('list');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Filter/Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PostStatus | 'All'>('All');
  const [filterClient, setFilterClient] = useState<string>('All');

  // Form State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [newPostClient, setNewPostClient] = useState('');
  const [newPostPlatforms, setNewPostPlatforms] = useState<Platform[]>(['Instagram']);
  const [newPostDate, setNewPostDate] = useState('');
  const [newPostTime, setNewPostTime] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [newPostMediaType, setNewPostMediaType] = useState<MediaType>('image');
  const [isUploading, setIsUploading] = useState(false);

  // Initialize
  useEffect(() => {
    const init = async () => {
      await db.init();
      // Load initial data if needed, or wait for login
      setLoading(false);
    };
    init();
  }, []);

  // Load Data on Login
  useEffect(() => {
    if (userRole) {
      loadData();
    }
  }, [userRole]);

  // Check for Daily Briefing trigger (Agency Only)
  useEffect(() => {
    if (!loading && userRole === 'agency' && posts.length > 0) {
      const today = new Date().toDateString();
      const lastBriefing = localStorage.getItem('socialflow_last_daily_briefing');

      if (lastBriefing !== today) {
        setShowDailyBriefing(true);
        localStorage.setItem('socialflow_last_daily_briefing', today);
      }
    }
  }, [loading, userRole, posts]);

  // Click outside handler for notifications
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadData = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    const [fetchedPosts, fetchedClients, fetchedTemplates, fetchedSnippets] = await Promise.all([
      db.getAllPosts(),
      db.getClientNames(),
      db.getTemplates(),
      db.getSnippets()
    ]);
    setPosts(fetchedPosts);
    setClients(fetchedClients);
    setTemplates(fetchedTemplates);
    setSnippets(fetchedSnippets);
    
    // Default form client logic
    if (!isFormOpen) {
        if (userRole === 'client' && currentClient) {
            setNewPostClient(currentClient);
        } else if (fetchedClients.length > 0) {
            setNewPostClient(fetchedClients[0]);
        }
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
    setIsSettingsOpen(false);
    setShowNotifications(false);
    setShowDailyBriefing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');
      setNewPostMediaType(isVideo ? 'video' : 'image');
      setIsUploading(true);
      
      try {
        const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setNewPostMediaUrl(url);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption || !newPostMediaUrl) {
      alert("Please provide caption and media.");
      return;
    }
    
    if (newPostPlatforms.length === 0) {
        alert("Please select at least one platform.");
        return;
    }
    
    const client = userRole === 'client' ? currentClient : newPostClient;
    const dateStr = newPostDate && newPostTime ? `${newPostDate} ${newPostTime}` : new Date().toISOString().split('T')[0];
    const author = userRole === 'agency' ? 'Agency' : currentClient;

    try {
      if (editingPostId) {
        // Edit Mode: Update single post (restrict to first selected platform if array has items)
        await db.updatePost(editingPostId, {
          caption: newPostCaption,
          mediaUrl: newPostMediaUrl,
          mediaType: newPostMediaType,
          date: dateStr,
          platform: newPostPlatforms[0], 
          client: client,
          status: userRole === 'client' ? 'In Review' : 'Draft' 
        }, author);
      } else {
        // Create Mode: Batch create for all selected platforms
        const createPromises = newPostPlatforms.map(platform => 
             db.addPost({
                client: client,
                platform: platform,
                date: dateStr,
                caption: newPostCaption,
                mediaUrl: newPostMediaUrl,
                mediaType: newPostMediaType,
                status: 'Draft',
            }, author)
        );
        await Promise.all(createPromises);
      }
      
      closeForm();
      loadData(true); 
    } catch (error) {
      console.error(error);
      alert("Error saving post");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      setPosts(prev => prev.filter(p => p.id !== id));
      await db.deletePost(id);
      loadData(true); 
    }
  };

  const handleStatusChange = async (id: string, status: PostStatus, feedback?: string) => {
    setPosts(prev => prev.map(p => {
        if (p.id === id) {
            return { ...p, status };
        }
        return p;
    }));

    if (feedback) {
         await db.addComment(id, {
             author: userRole === 'agency' ? 'Agency' : currentClient,
             role: userRole,
             text: `[Status Update] ${feedback}`
         });
    }

    await db.updatePost(id, { status }, userRole === 'agency' ? 'Agency' : currentClient);
    loadData(true); 
  };

  const openNewPostForm = () => {
     setEditingPostId(null);
     setNewPostCaption('');
     setNewPostMediaUrl('');
     setNewPostDate(new Date().toISOString().split('T')[0]);
     setNewPostTime('12:00');
     setNewPostPlatforms(['Instagram']); // Reset to default
     setIsFormOpen(true);
  };

  const openEditPostForm = (post: Post) => {
    setEditingPostId(post.id);
    setNewPostClient(post.client);
    setNewPostPlatforms([post.platform]); // Set single platform
    const [d, t] = post.date.includes(' ') ? post.date.split(' ') : [post.date, ''];
    setNewPostDate(d);
    setNewPostTime(t || '12:00');
    setNewPostCaption(post.caption);
    setNewPostMediaUrl(post.mediaUrl);
    setNewPostMediaType(post.mediaType);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setShowEmojiPicker(false);
  };

  const applyTemplate = (templateId: string) => {
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl) {
          setNewPostPlatforms([tmpl.platform]); // Templates are usually platform specific
          setNewPostCaption(tmpl.captionSkeleton + '\n\n' + tmpl.tags.join(' '));
      }
  };

  const insertSnippet = (content: string) => {
      setNewPostCaption(prev => prev + (prev ? ' ' : '') + content);
  };

  const togglePlatform = (p: Platform) => {
      if (editingPostId) {
          // In Edit mode, allow only one selection
          setNewPostPlatforms([p]);
      } else {
          // In Create mode, allow multiple
          setNewPostPlatforms(prev => 
              prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
          );
      }
  };

  const getPlatformIcon = (p: string) => {
      switch (p) {
        case 'Instagram': return <Instagram className="w-4 h-4" />;
        case 'LinkedIn': return <Linkedin className="w-4 h-4" />;
        case 'Twitter': return <Twitter className="w-4 h-4" />;
        case 'Facebook': return <Facebook className="w-4 h-4" />;
        case 'TikTok': return <Video className="w-4 h-4" />;
        default: return null;
      }
  };

  // Filter Logic
  const filteredPosts = posts.filter(p => {
     const matchesSearch = p.caption.toLowerCase().includes(searchTerm.toLowerCase()) || p.client.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
     const matchesClient = userRole === 'client' ? p.client === currentClient : (filterClient === 'All' || p.client === filterClient);
     return matchesSearch && matchesStatus && matchesClient;
  });

  // Notification Logic
  const notifications = useMemo(() => {
    if (!userRole) return [];
    const list: any[] = [];
    const now = Date.now();
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

    posts.forEach(p => {
        if (userRole === 'client' && p.client !== currentClient) return;

        p.history.forEach(h => {
             if (now - h.timestamp < TWO_DAYS) {
                 if (userRole === 'agency' && (h.action.includes('Approved') || h.action.includes('Review'))) {
                     list.push({
                         id: h.id,
                         postId: p.id,
                         text: `${p.client}: ${h.action.replace('Status: ', '')}`,
                         time: h.timestamp,
                         read: false,
                         type: 'status'
                     });
                 }
                 if (userRole === 'client' && h.action.includes('In Review')) {
                     list.push({
                         id: h.id,
                         postId: p.id,
                         text: `Ready for review: ${p.platform} post`,
                         time: h.timestamp,
                         read: false,
                         type: 'status'
                     });
                 }
             }
        });

        p.comments.forEach(c => {
             if (now - c.timestamp < TWO_DAYS) {
                 if (c.role !== userRole) { 
                     list.push({
                         id: c.id,
                         postId: p.id,
                         text: `${c.author} commented`,
                         time: c.timestamp,
                         read: false,
                         type: 'comment'
                     });
                 }
             }
        });
    });

    return list.sort((a, b) => b.time - a.time);
  }, [posts, userRole, currentClient]);

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!userRole) {
    return <Login clients={clients} onLogin={handleLogin} />;
  }

  if (isSettingsOpen) {
      return <Settings 
        clients={clients} 
        templates={templates} 
        snippets={snippets}
        onUpdate={() => loadData(true)}
        onClose={() => setIsSettingsOpen(false)} 
      />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {/* Daily Briefing Modal */}
        {showDailyBriefing && (
          <DailyBriefing posts={posts} onClose={() => setShowDailyBriefing(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SocialFlow</h1>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-500"><X className="w-5 h-5"/></button>
                </div>

                <div className="flex-grow p-4 space-y-2 overflow-y-auto">
                    <div className="mb-6">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Views</p>
                        <button onClick={() => setViewMode('list')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <List className="w-4 h-4" /> All Posts
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <CalendarIcon className="w-4 h-4" /> Calendar
                        </button>
                        <button onClick={() => setViewMode('kanban')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <LayoutGrid className="w-4 h-4" /> Board
                        </button>
                    </div>

                    {userRole === 'agency' && (
                        <div>
                             <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin</p>
                             <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <SettingsIcon className="w-4 h-4" /> Settings
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                            {userRole === 'agency' ? 'AG' : currentClient.substring(0,2).toUpperCase()}
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{userRole === 'agency' ? 'Agency Admin' : currentClient}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userRole === 'agency' ? 'Manager' : 'Client Access'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {/* Top Bar */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between gap-4 z-40 relative">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Menu className="w-5 h-5" />
                </button>
                
                <div className="flex-grow max-w-xl relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search posts..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 border focus:border-indigo-500 rounded-lg text-sm transition-all outline-none dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-3">
                     {userRole === 'agency' && (
                         <button onClick={openNewPostForm} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Create Post</span>
                         </button>
                     )}
                     <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                     
                     {/* Notifications */}
                     <div className="relative" ref={notificationRef}>
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 relative hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                            )}
                        </button>
                        
                        {/* Dropdown */}
                        {showNotifications && (
                             <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">
                                 <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                                     <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Notifications</span>
                                     <span className="text-xs text-gray-400">{notifications.length} recent</span>
                                 </div>
                                 <div className="max-h-[300px] overflow-y-auto">
                                     {notifications.length === 0 ? (
                                         <div className="p-8 text-center text-gray-400 text-sm">All caught up! 🎉</div>
                                     ) : (
                                         notifications.map(n => (
                                             <div 
                                                 key={n.id} 
                                                 onClick={() => {
                                                     const p = posts.find(post => post.id === n.postId);
                                                     if(p) {
                                                         openEditPostForm(p);
                                                         setShowNotifications(false);
                                                     }
                                                 }}
                                                 className="p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 cursor-pointer flex gap-3 transition-colors"
                                             >
                                                 <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${n.type === 'status' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                                 <div>
                                                     <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{n.text}</p>
                                                     <p className="text-[10px] text-gray-400 mt-1">{new Date(n.time).toLocaleDateString()}</p>
                                                 </div>
                                             </div>
                                         ))
                                     )}
                                 </div>
                             </div>
                        )}
                     </div>
                </div>
            </header>
            
            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar items-center">
                 <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                 <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 outline-none text-gray-700 dark:text-gray-200"
                 >
                    <option value="All">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Published">Published</option>
                 </select>

                 {userRole === 'agency' && (
                    <select 
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 outline-none text-gray-700 dark:text-gray-200"
                    >
                        <option value="All">All Clients</option>
                        {clients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 )}
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
                {viewMode === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredPosts.map(post => (
                            <div key={post.id} className="h-full">
                                <PostCard 
                                    post={post} 
                                    role={userRole} 
                                    onDelete={handleDeletePost}
                                    onStatusChange={handleStatusChange}
                                    onEdit={openEditPostForm}
                                    onUpdate={() => loadData(true)}
                                />
                            </div>
                        ))}
                        {filteredPosts.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                                <Search className="w-12 h-12 mb-2 opacity-20" />
                                <p>No posts found matching your filters.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'calendar' && (
                    <div className="h-full">
                         <CalendarView posts={filteredPosts} onPostClick={openEditPostForm} />
                    </div>
                )}

                {viewMode === 'kanban' && (
                     <KanbanBoard 
                        posts={filteredPosts} 
                        role={userRole} 
                        onPostClick={openEditPostForm}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeletePost}
                     />
                )}
            </div>

            {/* Create/Edit Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleSavePost} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                {editingPostId ? 'Edit Post' : 'Create New Post'}
                            </h2>
                            <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-7 gap-6">
                             {/* Left Column: Metadata & Media */}
                             <div className="md:col-span-3 space-y-4">
                                  {userRole === 'agency' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Client</label>
                                        <select 
                                            value={newPostClient} 
                                            onChange={e => setNewPostClient(e.target.value)}
                                            className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                        >
                                            {clients.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                  )}

                                  <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                          {editingPostId ? 'Platform' : 'Platforms'}
                                      </label>
                                      <div className="flex flex-wrap gap-2">
                                          {PLATFORMS.map(p => {
                                              const isSelected = newPostPlatforms.includes(p);
                                              return (
                                                  <button
                                                      key={p}
                                                      type="button"
                                                      onClick={() => togglePlatform(p)}
                                                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                                          isSelected 
                                                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900' 
                                                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                      }`}
                                                  >
                                                      {getPlatformIcon(p)}
                                                      {p}
                                                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                                                  </button>
                                              );
                                          })}
                                      </div>
                                      {!editingPostId && (
                                          <p className="text-[10px] text-gray-400 mt-1.5">Select multiple to create batch drafts.</p>
                                      )}
                                  </div>

                                  <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Schedule</label>
                                      <input 
                                          type="date" 
                                          value={newPostDate}
                                          onChange={e => setNewPostDate(e.target.value)}
                                          className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                      />
                                  </div>

                                  <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Media</label>
                                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative group">
                                          {newPostMediaUrl ? (
                                              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex justify-center items-center min-h-[150px]">
                                                  {newPostMediaType === 'video' ? (
                                                      <video src={newPostMediaUrl} className="w-full h-auto max-h-[300px] object-contain" controls />
                                                  ) : (
                                                      <img 
                                                        src={newPostMediaUrl} 
                                                        alt="Preview" 
                                                        className="w-full h-auto max-h-[300px] object-contain" 
                                                        referrerPolicy="no-referrer"
                                                      />
                                                  )}
                                                  <button 
                                                    type="button" 
                                                    onClick={() => setNewPostMediaUrl('')}
                                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                                                  >
                                                      <X className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          ) : (
                                              <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                                                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500"/> : <UploadCloud className="w-8 h-8 mb-2" />}
                                                  <p className="text-xs">Click to upload image or video</p>
                                                  <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                                              </div>
                                          )}
                                      </div>
                                  </div>
                             </div>

                             {/* Right Column: Caption & Templates */}
                             <div className="md:col-span-4 flex flex-col">
                                 <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex justify-between">
                                     <span>Caption</span>
                                     <span className="font-normal normal-case">{newPostCaption.length} chars</span>
                                 </label>
                                 <div className="relative flex-grow">
                                     <textarea 
                                         value={newPostCaption}
                                         onChange={e => setNewPostCaption(e.target.value)}
                                         className="w-full h-full min-h-[250px] p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none dark:text-white"
                                         placeholder="Write your caption here..."
                                     />
                                     <button 
                                        type="button" 
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-indigo-500"
                                     >
                                         <Smile className="w-5 h-5" />
                                     </button>
                                     {showEmojiPicker && (
                                         <div className="absolute top-10 right-2 z-20">
                                             <EmojiPicker 
                                                onEmojiClick={(e) => {
                                                    setNewPostCaption(prev => prev + e.emoji);
                                                    setShowEmojiPicker(false);
                                                }} 
                                                width={300} 
                                                height={350}
                                             />
                                         </div>
                                     )}
                                 </div>

                                 {/* Helper Tools */}
                                 <div className="mt-4 space-y-4">
                                     {templates.length > 0 && (
                                         <div>
                                             <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Templates</p>
                                             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                                 <select 
                                                    onChange={(e) => applyTemplate(e.target.value)}
                                                    className="text-xs p-2 rounded bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 outline-none w-full"
                                                 >
                                                     <option value="">Select a template...</option>
                                                     {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.platform})</option>)}
                                                 </select>
                                             </div>
                                         </div>
                                     )}

                                     {snippets.length > 0 && (
                                         <div>
                                             <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Snippets</p>
                                             <div className="flex flex-wrap gap-2">
                                                 {snippets.map(s => (
                                                     <button 
                                                        key={s.id} 
                                                        type="button"
                                                        onClick={() => insertSnippet(s.content)}
                                                        className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                     >
                                                         {s.label}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium">Cancel</button>
                            <div className="flex gap-2">
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider">
                                    Disclaimer
                                </span>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                                    <Save className="w-4 h-4" /> {editingPostId ? 'Update Post' : `Save ${newPostPlatforms.length} Draft${newPostPlatforms.length !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </main>
    </div>
  );
}
