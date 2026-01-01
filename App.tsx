
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './services/db';
import { storage } from './services/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Post, UserRole, PLATFORMS, Platform, PostStatus, MediaType, Template, Snippet, STATUS_FLOW, HistoryEntry, Comment } from './types';
import { PostCard } from './components/PostCard';
import { CalendarView } from './components/CalendarView';
import { KanbanBoard } from './components/KanbanBoard';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { LogOut, Plus, Search, Filter, Building2, Upload, Link, X, Image as ImageIcon, Loader2, LayoutGrid, Calendar as CalendarIcon, Video, Smile, Kanban, BarChart3, Copy, FileText, Download, Bell, MessageSquare, CheckCircle, AlertCircle, Settings as SettingsIcon, Save, Edit2, Moon, Sun, AlertTriangle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { supabase } from './services/supabaseClient';

type NotificationType = {
    id: string;
    postId: string;
    type: 'comment' | 'status';
    text: string;
    timestamp: number;
    read: boolean;
    client: string;
};

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loggedInClientName, setLoggedInClientName] = useState<string | null>(null);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [configError, setConfigError] = useState<boolean>(false);

  const [statusFilter, setStatusFilter] = useState<PostStatus | 'All'>('All');
  const [agencyClientFilter, setAgencyClientFilter] = useState<string>('All Clients');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'kanban' | 'analytics' | 'settings'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [newPostClient, setNewPostClient] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState<Platform>('Instagram');
  const [newPostDate, setNewPostDate] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [newPostMediaType, setNewPostMediaType] = useState<MediaType>('image');
  
  // UI State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Image Upload State
  const [mediaInputMode, setMediaInputMode] = useState<'url' | 'upload'>('upload');
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  // Modal State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const selectedPost = posts.find(p => p.id === selectedPostId);

  // Initialization
  useEffect(() => {
    // Check Config Validity
    // A crude but effective check to see if the user is still using placeholders
    // @ts-ignore
    const supabaseUrl = supabase.supabaseUrl;
    if (supabaseUrl.includes('your-project-url')) {
        setConfigError(true);
        return;
    }

    const init = async () => {
        await db.init();
        await refreshData();
    }
    init();
    
    // Check saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
        const [loadedPosts, loadedClients, loadedTemplates, loadedSnippets] = await Promise.all([
            db.getAllPosts(),
            db.getClientNames(),
            db.getTemplates(),
            db.getSnippets()
        ]);

        setPosts(loadedPosts);
        setClients(loadedClients);
        setTemplates(loadedTemplates);
        setSnippets(loadedSnippets);
        
        if (!newPostClient && loadedClients.length > 0) setNewPostClient(loadedClients[0]);
    } catch (error) {
        console.error("Failed to refresh data", error);
    } finally {
        setIsLoading(false);
    }
  };

  // ... [Handlers omitted for brevity as they are unchanged]
  const handleLogin = (role: UserRole, clientName?: string) => {
    setUserRole(role);
    if (role === 'client' && clientName) {
      setLoggedInClientName(clientName);
      setStatusFilter('In Review'); 
      setViewMode('grid'); 
    } else {
      setLoggedInClientName(null);
      setStatusFilter('All');
      setViewMode('kanban'); 
    }
    refreshData(); // Refresh on login to ensure latest data
  };

  const handleLogout = () => {
    setUserRole(null);
    setLoggedInClientName(null);
    setIsFormOpen(false);
    setShowNotifications(false);
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Client,Platform,Status,Date,Caption,MediaURL\r\n";

    const dataToExport = userRole === 'client' 
        ? posts.filter(p => p.client === loggedInClientName)
        : posts; 

    dataToExport.forEach(post => {
        const safeCaption = `"${post.caption.replace(/"/g, '""')}"`;
        const row = [
            post.id,
            post.client,
            post.platform,
            post.status,
            post.date,
            safeCaption,
            post.mediaUrl
        ].join(",");
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `social_posts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const notifications = useMemo(() => {
      if (!userRole) return [];
      
      const notifs: NotificationType[] = [];
      const now = Date.now();
      const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

      posts.forEach(post => {
          if (userRole === 'client' && post.client !== loggedInClientName) return;

          post.history.forEach(h => {
              if ((now - h.timestamp) > THREE_DAYS) return; 
              
              if (userRole === 'agency') {
                  if (h.action.includes('Approved') || h.action.includes('Rejected')) {
                      notifs.push({
                          id: h.id, postId: post.id, type: 'status', 
                          text: `${post.client}: Post ${h.action}`, 
                          timestamp: h.timestamp, read: false, client: post.client
                      });
                  }
              } else {
                  if (h.action.includes('In Review')) {
                      notifs.push({
                          id: h.id, postId: post.id, type: 'status', 
                          text: `Ready for review: ${post.platform} post`, 
                          timestamp: h.timestamp, read: false, client: post.client
                      });
                  }
              }
          });

          post.comments.forEach(c => {
             if ((now - c.timestamp) > THREE_DAYS) return;
             const isMyRole = c.role === userRole;
             if (!isMyRole) {
                 notifs.push({
                     id: c.id, postId: post.id, type: 'comment',
                     text: `${c.author} commented: "${c.text.substring(0, 30)}..."`,
                     timestamp: c.timestamp, read: false, client: post.client
                 });
             }
          });
      });

      return notifs.sort((a, b) => b.timestamp - a.timestamp);
  }, [posts, userRole, loggedInClientName]);


  const handleMediaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingMedia(true);
      try {
        // Firebase Storage Upload
        const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        
        setNewPostMedia(downloadURL);
        setNewPostMediaType(file.type.startsWith('video/') ? 'video' : 'image');

      } catch (err) {
        console.error("Error uploading media", err);
        alert("Failed to upload file. Check console.");
      } finally {
        setIsProcessingMedia(false);
      }
    }
  };

  const applyTemplate = (templateId: string) => {
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl) {
          setNewPostPlatform(tmpl.platform);
          setNewPostCaption(tmpl.captionSkeleton + '\n\n' + tmpl.tags.join(' '));
      }
  };

  const insertSnippet = (content: string) => {
      setNewPostCaption(prev => prev + (prev ? '\n\n' : '') + content);
  };

  const handleEditPost = (post: Post) => {
      setEditingPostId(post.id);
      setNewPostClient(post.client);
      setNewPostPlatform(post.platform);
      setNewPostDate(post.date);
      setNewPostCaption(post.caption);
      setNewPostMedia(post.mediaUrl);
      setNewPostMediaType(post.mediaType);
      
      setSelectedPostId(null);
      setIsFormOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostDate || !newPostCaption) return;
    setIsLoading(true);

    try {
      if (editingPostId) {
          await db.updatePost(editingPostId, {
            client: newPostClient,
            platform: newPostPlatform,
            date: newPostDate,
            caption: newPostCaption,
            mediaUrl: newPostMedia,
            mediaType: newPostMediaType,
          }, 'Agency');
      } else {
          await db.addPost({
            client: newPostClient || clients[0],
            platform: newPostPlatform,
            date: newPostDate,
            caption: newPostCaption,
            mediaUrl: newPostMedia,
            mediaType: newPostMediaType,
            status: 'Draft',
          }, 'Agency');
      }

      setEditingPostId(null);
      setNewPostDate('');
      setNewPostCaption('');
      setNewPostMedia('');
      setNewPostMediaType('image');
      setIsFormOpen(false);
      await refreshData();
    } catch (error) {
        console.error("Error saving post", error);
        alert("Failed to save post");
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      await db.deletePost(id);
      refreshData();
      if (selectedPostId === id) setSelectedPostId(null);
    }
  };

  const handleStatusChange = async (id: string, status: PostStatus) => {
    await db.updatePost(id, { status }, userRole === 'agency' ? 'Agency' : loggedInClientName || 'Client');
    refreshData();
  };

  const filteredPosts = posts.filter(post => {
    if (userRole === 'client') {
      if (post.client !== loggedInClientName) return false;
    } else if (userRole === 'agency') {
      if (agencyClientFilter !== 'All Clients' && post.client !== agencyClientFilter) return false;
    }

    if (viewMode !== 'kanban' && viewMode !== 'settings' && statusFilter !== 'All' && post.status !== statusFilter) return false;

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = post.caption.toLowerCase().includes(q) || 
                      post.client.toLowerCase().includes(q) ||
                      post.platform.toLowerCase().includes(q);
        if (!match) return false;
    }

    return true;
  });

  const getAnalytics = () => {
     const total = filteredPosts.length;
     const approved = filteredPosts.filter(p => p.status === 'Approved' || p.status === 'Scheduled' || p.status === 'Published').length;
     const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
     
     let totalTime = 0;
     let count = 0;
     filteredPosts.forEach(p => {
         if ((p.status === 'Approved' || p.status === 'Scheduled') && p.updatedAt > p.createdAt) {
             totalTime += (p.updatedAt - p.createdAt);
             count++;
         }
     });
     const avgDays = count > 0 ? Math.round(totalTime / (1000 * 60 * 60 * 24)) : 0;

     return { total, rate, avgDays };
  };

  const analytics = getAnalytics();

  if (configError) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
              <div className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-red-100 dark:border-red-900">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Setup Required</h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      You have switched to the Cloud-enabled version, but you haven't configured your <strong>Supabase</strong> and <strong>Firebase</strong> keys yet.
                  </p>
                  <div className="text-left bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-200 space-y-2 mb-6 font-mono">
                      <p>1. Open <strong>services/supabaseClient.ts</strong> and add your Supabase URL/Key.</p>
                      <p>2. Open <strong>services/firebaseConfig.ts</strong> and add your Firebase Config.</p>
                  </div>
                  <p className="text-xs text-gray-400">After updating these files, refresh the page.</p>
              </div>
          </div>
      )
  }

  const AppContent = () => {
      if (!userRole) {
        return <Login onLogin={handleLogin} clients={clients} />;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-200">
          {/* Navigation Bar */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-colors duration-200">
            <div className="max-w-screen-2xl mx-auto px-4 h-16 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${userRole === 'agency' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                  <span className="text-white font-bold text-xl">{userRole === 'agency' ? 'A' : 'C'}</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-tight">SocialFlow <span className="hidden sm:inline text-gray-400 dark:text-gray-500 font-normal">| {userRole === 'agency' ? 'Agency Workspace' : 'Client Portal'}</span></h1>
                  {userRole === 'client' && <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">{loggedInClientName}</p>}
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4">
                {/* Loading Indicator */}
                {isLoading && <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />}

                {/* Search Bar (Desktop) */}
                <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 w-64 border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts..."
                        className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 dark:text-white ml-2"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"/></button>}
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Toggle Theme"
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notification Bell */}
                <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
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
                                            onClick={() => { setSelectedPostId(n.postId); setShowNotifications(false); }}
                                            className="p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 cursor-pointer flex gap-3 transition-colors"
                                        >
                                            <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${n.type === 'status' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                            <div>
                                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{n.text}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 flex justify-between gap-4">
                                                    <span>{n.client}</span>
                                                    <span>{new Date(n.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {userRole === 'agency' && (
                    <div className="flex items-center gap-2">
                      {/* Analytics Badge (hidden on mobile) */}
                      <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span>{analytics.total} Posts</span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                            <span>{analytics.rate}% Approved</span>
                      </div>
                      
                      {/* Settings Button */}
                      <button 
                        onClick={() => setViewMode('settings')} 
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'settings' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        title="Settings"
                      >
                        <SettingsIcon className="w-5 h-5" />
                      </button>
                    </div>
                )}
                
                <button 
                    onClick={handleLogout}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow max-w-screen-2xl w-full mx-auto px-4 py-6 overflow-hidden flex flex-col pb-24">
            
            {/* Controls Header (Hidden in Settings Mode) */}
            {viewMode !== 'settings' && (
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
              
              <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-start md:items-center">
                
                {/* Mobile Search Bar (Only visible on mobile) */}
                <div className="md:hidden flex items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 w-full border border-gray-200 dark:border-gray-700">
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
                    />
                </div>

                {/* View Toggle */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 flex items-center shadow-sm w-full md:w-auto justify-center md:justify-start transition-colors">
                    <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Kanban Board">
                      <Kanban className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`} title="List View">
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Calendar View">
                      <CalendarIcon className="w-5 h-5" />
                    </button>
                    {userRole === 'agency' && (
                        <button onClick={() => setViewMode('analytics')} className={`p-2 rounded-md transition-all ${viewMode === 'analytics' ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Analytics">
                        <BarChart3 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

                {/* Filters */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {userRole === 'agency' && (
                    <div className="relative flex-shrink-0">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select 
                        value={agencyClientFilter}
                        onChange={(e) => setAgencyClientFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        >
                        <option value="All Clients">All Clients</option>
                        {clients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    )}
                    
                    {viewMode !== 'kanban' && viewMode !== 'analytics' && (
                        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 gap-1 flex-shrink-0">
                            {(userRole === 'agency' ? ['All', ...STATUS_FLOW] : ['In Review', 'Approved']).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f as any)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                                        statusFilter === f 
                                        ? 'bg-gray-900 dark:bg-gray-700 text-white shadow-sm' 
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                    onClick={handleExportCSV}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 whitespace-nowrap"
                    title="Download CSV"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
                
                {userRole === 'agency' && (
                    <button
                    onClick={() => {
                      setEditingPostId(null);
                      setNewPostDate('');
                      setNewPostCaption('');
                      setNewPostMedia('');
                      setNewPostMediaType('image');
                      setIsFormOpen(!isFormOpen);
                    }}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap"
                    >
                    <Plus className="w-4 h-4" />
                    Create Post
                    </button>
                )}
              </div>
            </div>
            )}

            {/* Create/Edit Post Form (Agency Only) */}
            {isFormOpen && userRole === 'agency' && (
              <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-indigo-100 dark:border-gray-700 animate-in slide-in-from-top-4 fade-in z-20 relative transition-colors">
                <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b border-indigo-50 dark:border-gray-700 rounded-t-xl flex justify-between items-center">
                  <h3 className="text-base font-bold text-indigo-900 dark:text-white flex items-center gap-2">
                    {editingPostId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                    {editingPostId ? 'Edit Post' : 'New Social Post'}
                  </h3>
                  <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSavePost} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Metadata */}
                  <div className="md:col-span-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Client & Platform</label>
                      <div className="grid grid-cols-2 gap-3">
                        <select 
                            value={newPostClient}
                            onChange={(e) => setNewPostClient(e.target.value)}
                            className="w-full rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2.5 text-sm focus:ring-indigo-500"
                        >
                            {clients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select 
                            value={newPostPlatform}
                            onChange={(e) => setNewPostPlatform(e.target.value as Platform)}
                            className="w-full rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2.5 text-sm focus:ring-indigo-500"
                        >
                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Schedule</label>
                      <input 
                        type="date" 
                        required
                        value={newPostDate}
                        onChange={(e) => setNewPostDate(e.target.value)}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2.5 text-sm focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Templates</label>
                        <div className="grid grid-cols-1 gap-2">
                            {templates.map(t => (
                                <button 
                                    key={t.id} type="button" 
                                    onClick={() => applyTemplate(t.id)}
                                    className="text-left text-xs p-2 rounded border border-gray-100 dark:border-gray-600 dark:text-gray-300 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-3 h-3 text-indigo-400" />
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>
                  </div>

                  {/* Middle Column: Visuals */}
                  <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Visual Asset</label>
                      
                      <div className="flex gap-2 mb-2 p-1 bg-gray-50 dark:bg-gray-700 rounded-lg w-fit">
                          <button
                            type="button"
                            onClick={() => setMediaInputMode('upload')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                              mediaInputMode === 'upload' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5" /> Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => setMediaInputMode('url')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                              mediaInputMode === 'url' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                          >
                            <Link className="w-3.5 h-3.5" /> URL
                          </button>
                      </div>

                      <div className="h-48 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
                          {newPostMedia ? (
                              <>
                                {newPostMediaType === 'video' ? (
                                    <video src={newPostMedia} className="h-full w-full object-contain" controls />
                                ) : (
                                    <img src={newPostMedia} alt="Preview" className="h-full w-full object-contain" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setNewPostMedia(''); setNewPostMediaType('image'); }}
                                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                              </>
                          ) : (
                              mediaInputMode === 'upload' ? (
                                <>
                                    <input type="file" accept="image/*,video/*" onChange={handleMediaFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    {isProcessingMedia ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <div className="text-center p-4"><div className="flex justify-center gap-2 text-gray-400 dark:text-gray-500 mb-2"><ImageIcon className="w-6 h-6"/><Video className="w-6 h-6"/></div><p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Drag & drop or click</p></div>}
                                </>
                              ) : (
                                <input 
                                    type="url" 
                                    placeholder="Paste image/video URL"
                                    className="w-full h-full p-4 bg-transparent text-center focus:outline-none text-sm dark:text-white"
                                    onChange={(e) => {
                                        setNewPostMedia(e.target.value);
                                        if (e.target.value.match(/\.(mp4|webm|ogg)$/i)) setNewPostMediaType('video');
                                    }}
                                />
                              )
                          )}
                      </div>
                  </div>

                  {/* Right Column: Caption */}
                  <div className="md:col-span-4 flex flex-col relative">
                      <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Caption</label>
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                      </div>
                      <div className="relative flex-grow">
                          <textarea 
                            required
                            value={newPostCaption}
                            onChange={(e) => setNewPostCaption(e.target.value)}
                            placeholder="Write something engaging..."
                            className="w-full h-full rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-3 focus:ring-indigo-500 text-sm resize-none"
                          />
                          {showEmojiPicker && (
                            <div className="absolute top-10 right-0 z-50 shadow-2xl rounded-xl border border-gray-100 bg-white">
                              <EmojiPicker onEmojiClick={(data) => setNewPostCaption(prev => prev + data.emoji)} width={300} height={350} previewConfig={{ showPreview: false }} />
                              <div className="fixed inset-0 z-[-1]" onClick={() => setShowEmojiPicker(false)}></div>
                            </div>
                          )}
                      </div>
                      
                      {/* Snippets Toolbar */}
                      <div className="mt-2 flex gap-1 flex-wrap">
                          {snippets.map(s => (
                              <button 
                                    key={s.id} type="button" 
                                    onClick={() => insertSnippet(s.content)}
                                    className="text-[10px] bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 border border-gray-200 dark:border-gray-600"
                                >
                                    {s.label}
                              </button>
                          ))}
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm text-sm flex items-center gap-2">
                              <Save className="w-4 h-4"/> {editingPostId ? 'Update Post' : 'Create Post'}
                            </button>
                      </div>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW RENDERERS */}
            {viewMode === 'settings' ? (
              <Settings 
                  clients={clients} 
                  templates={templates} 
                  snippets={snippets} 
                  onUpdate={refreshData}
                  onClose={() => setViewMode(userRole === 'client' ? 'grid' : 'kanban')}
              />
            ) : viewMode === 'analytics' ? (
                <div className="animate-in fade-in space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">Total Posts</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{analytics.total}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">Approval Rate</p>
                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{analytics.rate}%</p>
                            <p className="text-xs text-gray-400 mt-1">of total posts</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">Avg Approval Time</p>
                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{analytics.avgDays} <span className="text-base text-gray-400 font-normal">days</span></p>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Workflow Distribution</h3>
                        <div className="space-y-4">
                            {STATUS_FLOW.map(status => {
                                const count = filteredPosts.filter(p => p.status === status).length;
                                const pct = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                                return (
                                    <div key={status}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-200">{status}</span>
                                            <span className="text-gray-500 dark:text-gray-400">{count} posts ({Math.round(pct)}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                            <div className={`h-2.5 rounded-full ${
                                                status === 'Draft' ? 'bg-gray-400' :
                                                status === 'In Review' ? 'bg-amber-400' :
                                                status === 'Approved' ? 'bg-green-500' :
                                                status === 'Scheduled' ? 'bg-blue-500' : 'bg-indigo-600'
                                            }`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            ) : viewMode === 'kanban' ? (
              <div className="animate-in fade-in overflow-hidden h-full">
                  <KanbanBoard 
                    posts={filteredPosts} 
                    role={userRole} 
                    onPostClick={(post) => setSelectedPostId(post.id)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
              </div>
            ) : viewMode === 'calendar' ? (
              <CalendarView posts={filteredPosts} onPostClick={(post) => setSelectedPostId(post.id)} />
            ) : (
              /* Grid/List View */
              <>
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400 dark:text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No posts found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or search terms.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                    {filteredPosts.map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        role={userRole}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        onEdit={handleEditPost}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Modal Overlay for Post Details */}
            {selectedPost && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" 
                onClick={() => setSelectedPostId(null)}
              >
                <div className="w-full max-w-2xl bg-transparent flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end mb-3">
                      <button 
                        onClick={() => setSelectedPostId(null)} 
                        className="text-white hover:text-gray-200 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-md"
                      >
                          <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl flex-grow flex flex-col">
                      <PostCard 
                          post={selectedPost} 
                          role={userRole} 
                          onDelete={(id) => { handleDelete(id); setSelectedPostId(null); }}
                          onStatusChange={async (id, s, f) => { 
                              await handleStatusChange(id, s); 
                              if(f) {
                                  await db.addComment(id, {author: userRole === 'agency' ? 'Agency' : (loggedInClientName || 'Client'), role: userRole, text: f}); 
                                  await refreshData();
                              }
                          }}
                          onEdit={handleEditPost}
                      />
                    </div>
                </div>
              </div>
            )}
          </main>
        </div>
      );
  };

  return (
    <div className={darkMode ? "dark" : ""}>
       <AppContent />
    </div>
  );
}
