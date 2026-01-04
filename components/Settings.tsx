
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebaseConfig';
import { Template, Snippet, Platform, PLATFORMS, ClientProfile, User, UserRole, AppConfig, BrandKit, ServiceItem } from '../types';
import { Trash2, Plus, Save, X, Building2, FileText, Hash, ShieldCheck, Download, Upload, Database, RefreshCw, Lock, HelpCircle, Receipt, ArrowLeft, Sun, Moon, Users, UserPlus, Palette, Image as ImageIcon, Eye, EyeOff, Edit2, Loader2, BookOpen, Settings2, Briefcase, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2, Quote, Code, Globe, Mail, Phone, MapPin, CreditCard, Copy, Key } from 'lucide-react';
import { OnboardingWizard } from './OnboardingWizard';
import { BrandCard } from './BrandCard';
import { OnboardingConfigurator } from './OnboardingConfigurator';

interface SettingsProps {
  clients: string[]; 
  templates: Template[];
  snippets: Snippet[];
  onUpdate: () => void;
  onClose: () => void;
  currentUser: User;
}

export const Settings: React.FC<SettingsProps> = ({ clients: clientNames, templates, snippets, onUpdate, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'team' | 'branding' | 'services' | 'templates' | 'snippets' | 'security'>('clients');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Branding State
  const [brandingConfig, setBrandingConfig] = useState<AppConfig>({ 
      agencyName: 'SWAVE', 
      primaryColor: '#8E3EBB', 
      secondaryColor: '#F27A21',
      primaryTextColor: '#FFFFFF',
      secondaryTextColor: '#FFFFFF',
      buttonColor: '#F3F4F6',
      buttonTextColor: '#1F2937' 
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Client State
  const [newClientName, setNewClientName] = useState('');
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [originalClientName, setOriginalClientName] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  
  const [fullProfiles, setFullProfiles] = useState<ClientProfile[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  
  // Onboarding State
  const [onboardingClient, setOnboardingClient] = useState<string | null>(null);
  const [onboardingKit, setOnboardingKit] = useState<BrandKit | undefined>(undefined);
  const [viewingBrandKit, setViewingBrandKit] = useState<BrandKit | null>(null);
  const [configuringClient, setConfiguringClient] = useState<string | null>(null);
  
  // Team State
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'agency_creator' as UserRole, clientId: '' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  
  // Password Visibility Toggle State
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Rate Card State
  const [rateCardContent, setRateCardContent] = useState('');
  const [isSavingRateCard, setIsSavingRateCard] = useState(false);
  const [serviceList, setServiceList] = useState<ServiceItem[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  // Theme Toggle Effect
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
    loadProfiles();
    loadBranding();
    if (activeTab === 'team') loadTeam();
    if (activeTab === 'services') loadServicesAndRateCard();
  }, [clientNames, activeTab]);

  // Sync content to editor ref when loaded
  useEffect(() => {
    if (activeTab === 'services' && editorRef.current && rateCardContent && editorRef.current.innerHTML === '') {
        editorRef.current.innerHTML = rateCardContent;
    }
  }, [activeTab, rateCardContent]);

  const loadProfiles = async () => {
      const profiles = await db.getClients();
      setFullProfiles(profiles);
  };
  
  const loadTeam = async () => {
      const users = await db.getUsers();
      setTeamMembers(users);
  };
  
  const loadBranding = async () => {
      const config = await db.getAppConfig();
      setBrandingConfig(prev => ({ ...prev, ...config }));
  };

  const loadServicesAndRateCard = async () => {
      const [content, services] = await Promise.all([
          db.getRateCard(),
          db.getServices()
      ]);
      setRateCardContent(content);
      // If the editor is already mounted, update it manually to avoid cursor jumps
      if (editorRef.current) {
          editorRef.current.innerHTML = content;
      }
      setServiceList(services);
  };

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Template State
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [tempTags, setTempTags] = useState('');

  // Snippet State
  const [editingSnippet, setEditingSnippet] = useState<Partial<Snippet> | null>(null);
  
  // --- HANDLERS ---
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientName.trim()) {
      await db.addClient(newClientName.trim());
      setNewClientName('');
      onUpdate();
      loadProfiles();
    }
  };

  const handleOpenBrandKit = async (clientName: string) => {
      const kit = await db.getBrandKit(clientName);
      if (kit) {
          setViewingBrandKit(kit);
      } else {
          setOnboardingKit(undefined);
          setOnboardingClient(clientName);
      }
  };

  const handleConfigureQuestions = async (clientName: string) => {
      const kit = await db.getBrandKit(clientName);
      setViewingBrandKit(kit);
      setConfiguringClient(clientName);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.email || !newUser.password) return;
      
      setIsSavingUser(true);
      try {
          if (editingUserId) {
              await db.updateUser(editingUserId, {
                  name: newUser.name,
                  email: newUser.email,
                  password: newUser.password,
                  role: newUser.role,
                  clientId: (newUser.role === 'client_admin' || newUser.role === 'client_viewer') ? newUser.clientId : null
              });
          } else {
              await db.createUser({
                  name: newUser.name,
                  email: newUser.email,
                  password: newUser.password,
                  role: newUser.role,
                  clientId: (newUser.role === 'client_admin' || newUser.role === 'client_viewer') ? newUser.clientId : undefined
              });
          }
          setShowNewUserForm(false);
          setEditingUserId(null);
          setNewUser({ name: '', email: '', password: '', role: 'agency_creator', clientId: '' });
          loadTeam();
      } catch (e: any) {
          alert(`Failed to save user. Error: ${e.message}`);
      } finally {
          setIsSavingUser(false);
      }
  };

  const handleEditUser = (user: User) => {
      setEditingUserId(user.id);
      setNewUser({
          name: user.name,
          email: user.email,
          password: user.password || '', 
          role: user.role,
          clientId: user.clientId || ''
      });
      setShowNewUserForm(true);
  };

  const handleDeleteUser = async (id: string) => {
      if (id === currentUser.id) {
          alert("You cannot delete your own account.");
          return;
      }
      if(confirm("Remove this user permanently? This cannot be undone.")) {
          setIsDeletingUser(id);
          try {
              await db.deleteUser(id);
              await new Promise(r => setTimeout(r, 500));
              await loadTeam();
          } catch (e: any) {
              console.error(e);
              alert(`Failed to delete user. Please ensure database permissions are set.\n\nTechnical Error: ${e.message}`);
          } finally {
              setIsDeletingUser(null);
          }
      }
  };

  const togglePasswordVisibility = (id: string) => {
      setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Branding Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsUploadingLogo(true);
          try {
              const file = e.target.files[0];
              const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
              await uploadBytes(storageRef, file);
              const url = await getDownloadURL(storageRef);
              setBrandingConfig(prev => ({ ...prev, logoUrl: url }));
          } catch (e) {
              alert("Logo upload failed");
          } finally {
              setIsUploadingLogo(false);
          }
      }
  };

  const saveBranding = async () => {
      setIsSavingBranding(true);
      try {
          await db.saveAppConfig(brandingConfig);
          onUpdate();
          alert("Branding saved successfully!");
      } catch (e: any) {
          console.error(e);
          alert(`Failed to save branding. Check database permissions.\nError: ${e.message}`);
      } finally {
          setIsSavingBranding(false);
      }
  };

  const handleSaveRateCard = async () => {
      setIsSavingRateCard(true);
      try {
          // Get content directly from ref to ensure latest edits
          const content = editorRef.current?.innerHTML || rateCardContent;
          await db.saveRateCard(content);
          alert("Service Guide updated successfully!");
      } catch (e) {
          alert("Failed to save content.");
      } finally {
          setIsSavingRateCard(false);
      }
  };

  // Editor Toolbar Handler
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        setRateCardContent(editorRef.current.innerHTML);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingClient) return;
      setIsSavingClient(true);
      try {
          await db.updateClient(originalClientName, editingClient);
          setEditingClient(null);
          onUpdate();
          loadProfiles();
      } catch (err: any) { alert(err.message); }
      finally { setIsSavingClient(false); }
  };

  const handleEditClick = (client: ClientProfile) => {
      setEditingClient(JSON.parse(JSON.stringify(client)));
      setOriginalClientName(client.name);
  };

  const handleNewTemplate = () => {
      setEditingTemplate({ id: crypto.randomUUID(), name: '', platform: 'Instagram', captionSkeleton: '', tags: [] });
      setTempTags('');
  };

  const handleEditTemplate = (t: Template) => {
      setEditingTemplate({...t});
      setTempTags(t.tags.join(', '));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate && editingTemplate.name && editingTemplate.captionSkeleton) {
       const tagsArray = tempTags.split(',').map(t => t.trim()).filter(Boolean);
       await db.saveTemplate({ ...editingTemplate, tags: tagsArray } as Template);
       setEditingTemplate(null);
       onUpdate();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
      if(confirm("Delete template?")) { await db.deleteTemplate(id); onUpdate(); }
  };

  const handleNewSnippet = () => setEditingSnippet({ id: crypto.randomUUID(), label: '', content: '' });
  
  const handleEditSnippet = (s: Snippet) => setEditingSnippet({...s});

  const handleSaveSnippet = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingSnippet && editingSnippet.label && editingSnippet.content) {
          await db.saveSnippet(editingSnippet as Snippet);
          setEditingSnippet(null);
          onUpdate();
      }
  };

  const handleDeleteSnippet = async (id: string) => {
      if(confirm("Delete snippet?")) { await db.deleteSnippet(id); onUpdate(); }
  };

  const handleClearData = async () => {
      if (confirm("WARNING: This will delete ALL posts, clients, and settings. This action cannot be undone. Are you sure?")) {
          try { await db.clearDatabase(); onUpdate(); alert("All data cleared."); } catch (e) { console.error(e); alert("Failed to clear data."); }
      }
  };

  const handleExportData = async () => {
    const json = await db.exportDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `socialflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 w-[95vw] max-w-[1920px] mx-auto flex flex-col h-[92vh]">
      {/* HEADER */}
      <div className="border-b border-gray-100 dark:border-gray-700 flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-20">
         <div className="flex items-center gap-4">
             <button 
                onClick={onClose}
                className="p-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">System Settings</h2>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
             </button>
         </div>
      </div>

      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* SIDEBAR TABS */}
        <div className="w-full md:w-64 bg-gray-100 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-700 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar md:overflow-visible flex-shrink-0">
            {[
                { id: 'clients', label: 'Clients', icon: Building2 },
                { id: 'team', label: 'Team & Roles', icon: Users },
                { id: 'branding', label: 'Look & Feel', icon: Palette },
                { id: 'services', label: 'Service Menu', icon: Briefcase },
                { id: 'templates', label: 'Templates', icon: FileText },
                { id: 'snippets', label: 'Snippets', icon: Hash },
                { id: 'security', label: 'Data', icon: Database }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all w-full whitespace-nowrap md:whitespace-normal ${
                        activeTab === tab.id 
                        ? 'bg-gradient-to-r from-swave-purple to-swave-orange text-swave-purple-text shadow-lg shadow-purple-500/20 dark:shadow-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent'
                    }`}
                >
                    <tab.icon className="w-5 h-5" /> {tab.label}
                </button>
            ))}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto bg-white dark:bg-gray-800 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* --- CLIENTS TAB --- */}
            {activeTab === 'clients' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 relative z-10">
                {!editingClient ? (
                    <>
                        {/* New Client Form */}
                         <div className="flex flex-col md:flex-row gap-4">
                            <form onSubmit={handleAddClient} className="flex-grow flex gap-3 max-w-xl">
                                <input
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    placeholder="Enter New Organization Name..."
                                    className="flex-grow p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-swave-orange outline-none font-medium transition-all"
                                />
                                <button type="submit" disabled={!newClientName.trim()} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:scale-100">Add</button>
                            </form>
                        </div>
                        
                        {/* Clients List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {fullProfiles.map(client => (
                                <div key={client.name} className="flex flex-col justify-between p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-swave-purple/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all group gap-4 relative overflow-hidden min-h-[140px]">
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-12 h-12 bg-gradient-to-br from-swave-purple to-indigo-600 rounded-2xl flex items-center justify-center text-swave-purple-text font-black text-lg shadow-lg shadow-purple-200 dark:shadow-none shrink-0">
                                            {client.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-900 dark:text-white text-base truncate">{client.name}</p>
                                            {/* Access Code Display in Card */}
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                                    <Key className="w-3 h-3 text-gray-400"/>
                                                    <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">{client.accessCode}</span>
                                                </div>
                                                <button onClick={() => { navigator.clipboard.writeText(client.accessCode || ''); alert("Code Copied!"); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-400 hover:text-swave-purple transition-colors" title="Copy Code">
                                                    <Copy className="w-3 h-3"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end relative z-10 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                                        <button onClick={() => handleConfigureQuestions(client.name)} className="p-2 text-gray-400 hover:text-swave-orange hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors" title="Customize Questions">
                                            <Settings2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleOpenBrandKit(client.name)} className="px-4 py-2 text-xs font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:scale-105 rounded-xl transition-all shadow-md flex items-center gap-2">
                                            <BookOpen className="w-3 h-3" /> Brand Kit
                                        </button>
                                        <button onClick={() => handleEditClick(client)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-swave-purple hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors">Edit</button>
                                        <button onClick={async () => { if(confirm(`Remove ${client.name}?`)) { await db.removeClient(client.name); onUpdate(); loadProfiles(); }}} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleUpdateClient} className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden animate-in fade-in">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                             <div>
                                 <h3 className="text-xl font-black text-gray-900 dark:text-white">Edit Client Profile</h3>
                                 <p className="text-sm text-gray-500">Manage details for {originalClientName}</p>
                             </div>
                             <button type="button" onClick={() => setEditingClient(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            {/* General Info */}
                            <div>
                                <h4 className="text-xs font-bold text-swave-purple uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">General Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Organization Name</label>
                                        <input 
                                            value={editingClient.name}
                                            onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Access Code</label>
                                        <div className="relative flex items-center">
                                            <input 
                                                value={editingClient.accessCode || 'N/A'}
                                                readOnly
                                                className="w-full pl-10 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono font-bold text-center tracking-widest cursor-text"
                                            />
                                            <Key className="absolute left-3 w-4 h-4 text-gray-400" />
                                            <button 
                                                type="button"
                                                onClick={() => { navigator.clipboard.writeText(editingClient.accessCode || ''); alert("Access Code Copied!"); }}
                                                className="absolute right-2 p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-swave-purple transition-all"
                                                title="Copy Code"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute top-3.5 left-3 w-4 h-4 text-gray-400" />
                                            <input 
                                                value={editingClient.website || ''}
                                                onChange={e => setEditingClient({...editingClient, website: e.target.value})}
                                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Email</label>
                                        <div className="relative">
                                            <Mail className="absolute top-3.5 left-3 w-4 h-4 text-gray-400" />
                                            <input 
                                                value={editingClient.email || ''}
                                                onChange={e => setEditingClient({...editingClient, email: e.target.value})}
                                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
                                        <div className="relative">
                                            <Phone className="absolute top-3.5 left-3 w-4 h-4 text-gray-400" />
                                            <input 
                                                value={editingClient.phone || ''}
                                                onChange={e => setEditingClient({...editingClient, phone: e.target.value})}
                                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Billing */}
                            <div>
                                <h4 className="text-xs font-bold text-swave-orange uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Billing & Operations</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billing Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute top-3.5 left-3 w-4 h-4 text-gray-400" />
                                            <textarea 
                                                value={editingClient.billingAddress || ''}
                                                onChange={e => setEditingClient({...editingClient, billingAddress: e.target.value})}
                                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tax ID / VAT</label>
                                        <div className="relative">
                                            <CreditCard className="absolute top-3.5 left-3 w-4 h-4 text-gray-400" />
                                            <input 
                                                value={editingClient.taxId || ''}
                                                onChange={e => setEditingClient({...editingClient, taxId: e.target.value})}
                                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Currency</label>
                                        <select 
                                            value={editingClient.currency || 'USD'}
                                            onChange={e => setEditingClient({...editingClient, currency: e.target.value as any})}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="XCD">XCD ($)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Internal Notes</label>
                                        <textarea 
                                            value={editingClient.notes || ''}
                                            onChange={e => setEditingClient({...editingClient, notes: e.target.value})}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                                            rows={3}
                                            placeholder="Access codes, preferences, or important details..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingClient(null)} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                            <button type="submit" disabled={isSavingClient} className="px-8 py-3 bg-swave-purple text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2">
                                {isSavingClient ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}
            </div>
            )}
            
            {/* ... (Rest of Tabs remain unchanged) ... */}
            {activeTab === 'team' && (
                // ... Existing Team content
                <div className="space-y-8 animate-in slide-in-from-right-4 relative z-10">
                     <div className="flex justify-between items-center">
                         <h3 className="text-xl font-black text-gray-900 dark:text-white">User Management</h3>
                         <button onClick={() => { setShowNewUserForm(!showNewUserForm); setEditingUserId(null); setNewUser({ name: '', email: '', password: '', role: 'agency_creator', clientId: '' }); }} className="flex items-center gap-2 bg-swave-purple text-swave-purple-text px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-purple-700 transition-all">
                             <UserPlus className="w-4 h-4" /> {showNewUserForm ? 'Close Form' : 'Add User'}
                         </button>
                     </div>

                     {showNewUserForm && (
                         <form onSubmit={handleSaveUser} className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                             <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-2">{editingUserId ? 'Edit User' : 'Create New User'}</h4>
                             <div className="grid grid-cols-2 gap-4">
                                 <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Full Name" className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                                 <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="Email Address" className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                                 <input required type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Password (Visible)" className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                                 <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                     <option value="agency_admin">Agency Admin (Super)</option>
                                     <option value="agency_creator">Agency Creator (Standard)</option>
                                     <option value="client_admin">Client Admin (Approver)</option>
                                     <option value="client_viewer">Client Viewer (Read Only)</option>
                                 </select>
                             </div>
                             {(newUser.role === 'client_admin' || newUser.role === 'client_viewer') && (
                                 <select required value={newUser.clientId} onChange={e => setNewUser({...newUser, clientId: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                     <option value="">Select Organization...</option>
                                     {fullProfiles.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                 </select>
                             )}
                             <div className="flex justify-end gap-2">
                                 <button type="button" onClick={() => { setShowNewUserForm(false); setEditingUserId(null); }} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                                 <button type="submit" disabled={isSavingUser} className="px-4 py-2 bg-swave-purple text-swave-purple-text rounded-lg font-bold flex items-center gap-2">
                                     {isSavingUser && <Loader2 className="w-4 h-4 animate-spin"/>}
                                     {editingUserId ? 'Save Changes' : 'Create User'}
                                 </button>
                             </div>
                         </form>
                     )}

                     <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden overflow-x-auto">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                 <tr>
                                     <th className="p-4 text-gray-500 font-bold">Name</th>
                                     <th className="p-4 text-gray-500 font-bold">Role</th>
                                     {currentUser.role === 'agency_admin' && <th className="p-4 text-gray-500 font-bold">Password</th>}
                                     <th className="p-4 text-gray-500 font-bold">Scope</th>
                                     <th className="p-4 text-gray-500 font-bold text-right">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                 {teamMembers.map(u => (
                                     <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                         <td className="p-4">
                                             <div className="font-bold text-gray-900 dark:text-white">{u.name}</div>
                                             <div className="text-xs text-gray-500">{u.email}</div>
                                         </td>
                                         <td className="p-4">
                                             <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                                 ${u.role.includes('admin') ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                                             `}>
                                                 {u.role.replace('_', ' ')}
                                             </span>
                                         </td>
                                         {currentUser.role === 'agency_admin' && (
                                            <td className="p-4 font-mono text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <span>{visiblePasswords[u.id] ? u.password : '••••••••'}</span>
                                                    <button onClick={() => togglePasswordVisibility(u.id)} className="text-gray-400 hover:text-swave-purple">
                                                        {visiblePasswords[u.id] ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                                    </button>
                                                </div>
                                            </td>
                                         )}
                                         <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                                             {u.clientId || 'Agency (Internal)'}
                                         </td>
                                         <td className="p-4 text-right">
                                              <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleEditUser(u)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="Edit User">
                                                     <Edit2 className="w-4 h-4"/>
                                                 </button>
                                                 {u.id !== currentUser.id && (
                                                     <button type="button" onClick={() => handleDeleteUser(u.id)} disabled={isDeletingUser === u.id} className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50" title="Delete User">
                                                         {isDeletingUser === u.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500"/> : <Trash2 className="w-4 h-4"/>}
                                                     </button>
                                                 )}
                                              </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </div>
            )}
            
            {/* --- SERVICES / RATE CARD TAB --- */}
            {activeTab === 'services' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 relative z-10 max-w-4xl">
                     {/* Rate Card Editor (Visual) */}
                     <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
                         <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                             <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3"><FileText className="w-6 h-6 text-swave-purple"/> Client Service Guide</h3>
                                <p className="text-xs text-gray-500 mt-1">Design the document your clients see. Select text to format.</p>
                             </div>
                             <button onClick={handleSaveRateCard} disabled={isSavingRateCard} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                {isSavingRateCard ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Update Guide
                            </button>
                         </div>
                         
                         {/* Toolbar */}
                         <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-wrap items-center gap-1">
                            <button onClick={() => execCmd('bold')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Bold"><Bold className="w-4 h-4"/></button>
                            <button onClick={() => execCmd('italic')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Italic"><Italic className="w-4 h-4"/></button>
                            <button onClick={() => execCmd('underline')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Underline"><Underline className="w-4 h-4"/></button>
                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Heading 1"><Heading1 className="w-4 h-4"/></button>
                            <button onClick={() => execCmd('formatBlock', 'H3')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Heading 2"><Heading2 className="w-4 h-4"/></button>
                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            <button onClick={() => execCmd('justifyLeft')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Align Left"><AlignLeft className="w-4 h-4"/></button>
                            <button onClick={() => execCmd('justifyCenter')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Align Center"><AlignCenter className="w-4 h-4"/></button>
                            <button onClick={() => execCmd('justifyRight')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Align Right"><AlignRight className="w-4 h-4"/></button>
                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            <button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Bullet List"><List className="w-4 h-4"/></button>
                            <button onClick={() => execCmd('insertOrderedList')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Numbered List"><ListOrdered className="w-4 h-4"/></button>
                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            <button onClick={() => execCmd('formatBlock', 'BLOCKQUOTE')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Quote"><Quote className="w-4 h-4"/></button>
                         </div>

                         {/* Editor Area */}
                         <div className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900 cursor-text p-8" onClick={() => editorRef.current?.focus()}>
                            <div 
                                ref={editorRef}
                                contentEditable
                                onInput={(e) => setRateCardContent(e.currentTarget.innerHTML)}
                                className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 min-h-full max-w-3xl mx-auto p-12 outline-none prose dark:prose-invert max-w-none rounded-xl"
                                style={{ minHeight: '100%' }}
                            />
                         </div>
                     </div>

                     {/* Linked Services List */}
                     <div className="space-y-4">
                         <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-swave-orange"/> Linked Invoicing Items</h3>
                         <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                             <table className="w-full text-left text-sm">
                                 <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                     <tr>
                                         <th className="p-4 font-bold text-gray-500">Service Name</th>
                                         <th className="p-4 font-bold text-gray-500">Default Rate</th>
                                         <th className="p-4 font-bold text-gray-500">Description</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                     {serviceList.map(s => (
                                         <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                             <td className="p-4 font-bold text-gray-900 dark:text-white">{s.name}</td>
                                             <td className="p-4 font-mono text-gray-600 dark:text-gray-300">${s.defaultRate}</td>
                                             <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">{s.description}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-500">
                                 Manage these items fully in the Finance Module
                             </div>
                         </div>
                     </div>
                </div>
            )}

            {/* --- BRANDING TAB --- */}
            {activeTab === 'branding' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 relative z-10 max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3"><Palette className="w-6 h-6 text-swave-purple"/> Brand Identity</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Agency Name</label>
                                <input 
                                    value={brandingConfig.agencyName}
                                    onChange={e => setBrandingConfig({...brandingConfig, agencyName: e.target.value})}
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Color</label>
                                    <div className="flex gap-2 items-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <input type="color" value={brandingConfig.primaryColor} onChange={e => setBrandingConfig({...brandingConfig, primaryColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"/>
                                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{brandingConfig.primaryColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Secondary Color</label>
                                    <div className="flex gap-2 items-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <input type="color" value={brandingConfig.secondaryColor} onChange={e => setBrandingConfig({...brandingConfig, secondaryColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"/>
                                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{brandingConfig.secondaryColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Text Color</label>
                                    <div className="flex gap-2 items-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <input type="color" value={brandingConfig.primaryTextColor || '#FFFFFF'} onChange={e => setBrandingConfig({...brandingConfig, primaryTextColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"/>
                                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{brandingConfig.primaryTextColor || '#FFFFFF'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Secondary Text Color</label>
                                    <div className="flex gap-2 items-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <input type="color" value={brandingConfig.secondaryTextColor || '#FFFFFF'} onChange={e => setBrandingConfig({...brandingConfig, secondaryTextColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"/>
                                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{brandingConfig.secondaryTextColor || '#FFFFFF'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Button Color</label>
                                    <div className="flex gap-2 items-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <input type="color" value={brandingConfig.buttonColor || '#F3F4F6'} onChange={e => setBrandingConfig({...brandingConfig, buttonColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"/>
                                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{brandingConfig.buttonColor || '#F3F4F6'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Button Text Color</label>
                                    <div className="flex gap-2 items-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <input type="color" value={brandingConfig.buttonTextColor || '#1F2937'} onChange={e => setBrandingConfig({...brandingConfig, buttonTextColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"/>
                                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{brandingConfig.buttonTextColor || '#1F2937'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Agency Logo</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center relative overflow-hidden group">
                                        {brandingConfig.logoUrl ? (
                                            <img src={brandingConfig.logoUrl} className="w-full h-full object-contain p-2" alt="Logo Preview" />
                                        ) : (
                                            <ImageIcon className="text-gray-400" />
                                        )}
                                        {isUploadingLogo && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">Uploading...</div>}
                                    </div>
                                    <div className="flex-grow">
                                        <input type="file" onChange={handleLogoUpload} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-swave-purple file:text-white hover:file:bg-purple-700 transition-all"/>
                                        <p className="text-xs text-gray-400 mt-2">Recommended: 200x200px PNG transparent</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button onClick={saveBranding} disabled={isSavingBranding} className="bg-swave-purple text-swave-purple-text px-8 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2">
                                {isSavingBranding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TEMPLATES TAB --- */}
            {activeTab === 'templates' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 relative z-10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Content Templates</h3>
                        <button onClick={handleNewTemplate} className="bg-swave-purple text-swave-purple-text px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Template
                        </button>
                    </div>
                    
                    {editingTemplate && (
                        <form onSubmit={handleSaveTemplate} className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 mb-8 animate-in fade-in">
                            <div className="flex justify-between">
                                <h4 className="font-bold text-gray-700 dark:text-gray-200">Editor</h4>
                                <button type="button" onClick={() => setEditingTemplate(null)}><X className="w-5 h-5 text-gray-400"/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input required value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} placeholder="Template Name" className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                                <select value={editingTemplate.platform} onChange={e => setEditingTemplate({...editingTemplate, platform: e.target.value as Platform})} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <textarea required value={editingTemplate.captionSkeleton} onChange={e => setEditingTemplate({...editingTemplate, captionSkeleton: e.target.value})} placeholder="Caption structure..." className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-32" />
                            <input value={tempTags} onChange={e => setTempTags(e.target.value)} placeholder="Tags (comma separated)..." className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                            <div className="flex justify-end">
                                <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-xl font-bold">Save Template</button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map(t => (
                            <div key={t.id} className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group relative">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditTemplate(t)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-500"><Edit2 className="w-3 h-3"/></button>
                                    <button onClick={() => handleDeleteTemplate(t.id)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500"><Trash2 className="w-3 h-3"/></button>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{t.platform}</span>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{t.name}</h4>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap mb-3">{t.captionSkeleton}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {t.tags.map(tag => <span key={tag} className="text-[9px] text-swave-purple bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded font-bold">{tag}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- SNIPPETS TAB --- */}
            {activeTab === 'snippets' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 relative z-10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Reusable Snippets</h3>
                        <button onClick={handleNewSnippet} className="bg-swave-orange text-swave-orange-text px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Snippet
                        </button>
                    </div>

                    {editingSnippet && (
                        <form onSubmit={handleSaveSnippet} className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 mb-8 animate-in fade-in">
                            <div className="flex justify-between">
                                <h4 className="font-bold text-gray-700 dark:text-gray-200">Snippet Editor</h4>
                                <button type="button" onClick={() => setEditingSnippet(null)}><X className="w-5 h-5 text-gray-400"/></button>
                            </div>
                            <input required value={editingSnippet.label} onChange={e => setEditingSnippet({...editingSnippet, label: e.target.value})} placeholder="Label (e.g. CTA Website)" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                            <textarea required value={editingSnippet.content} onChange={e => setEditingSnippet({...editingSnippet, content: e.target.value})} placeholder="Snippet content..." className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-24" />
                            <div className="flex justify-end">
                                <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-xl font-bold">Save Snippet</button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {snippets.map(s => (
                            <div key={s.id} className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group relative flex flex-col justify-between">
                                <div>
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditSnippet(s)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-500"><Edit2 className="w-3 h-3"/></button>
                                        <button onClick={() => handleDeleteSnippet(s.id)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500"><Trash2 className="w-3 h-3"/></button>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{s.label}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded-lg break-words">{s.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ... (Security tab remains same) */}
            {activeTab === 'security' && (
                 <div className="space-y-10 max-w-2xl mx-auto animate-in slide-in-from-right-4 relative z-10">
                     <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                         <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 mb-6"><Database className="w-6 h-6 text-blue-500"/> Data Management</h3>
                         <button onClick={handleExportData} className="w-full py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center gap-2 transition-all group">
                             <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors"><Download className="w-5 h-5"/></div> Backup Database (JSON)
                         </button>
                     </div>
                     <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2rem] border-2 border-red-100 dark:border-red-900/50">
                         <h3 className="text-xl font-black text-red-600 dark:text-red-400 flex items-center gap-3 mb-4"> Danger Zone</h3>
                         <button onClick={handleClearData} className="w-full py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl hover:shadow-red-500/20 transition-all">
                            <Trash2 className="w-5 h-5"/> Wipe Database
                         </button>
                     </div>
                 </div>
            )}
        </div>
      </div>
    </div>
    
    {/* Modals for Onboarding / Brand Card / Configuration */}
    {onboardingClient && (
        <OnboardingWizard 
            clientName={onboardingClient} 
            existingKit={onboardingKit}
            onComplete={() => {
                const name = onboardingClient;
                setOnboardingClient(null);
                setOnboardingKit(undefined);
                handleOpenBrandKit(name);
            }}
            onCancel={() => {
                setOnboardingClient(null);
                setOnboardingKit(undefined);
            }} 
        />
    )}
    
    {viewingBrandKit && !configuringClient && (
        <BrandCard 
            kit={viewingBrandKit} 
            onClose={() => setViewingBrandKit(null)} 
            onEdit={() => {
                setOnboardingKit(viewingBrandKit);
                setOnboardingClient(viewingBrandKit.client_name);
                setViewingBrandKit(null);
            }}
        />
    )}

    {configuringClient && (
        <OnboardingConfigurator 
            clientName={configuringClient}
            existingKit={viewingBrandKit} // Passed from handleConfigureQuestions
            onClose={() => {
                setConfiguringClient(null);
                setViewingBrandKit(null);
            }}
            onSave={() => {
                // Refresh logic if needed
            }}
        />
    )}
    </>
  );
};
