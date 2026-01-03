
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Template, Snippet, Platform, PLATFORMS, ClientProfile } from '../types';
import { Trash2, Plus, Save, X, Building2, FileText, Hash, KeyRound, Copy, ShieldCheck, ArrowLeft, Mail, Phone, Globe, Instagram, Linkedin, Twitter, Facebook, Video, Edit3, UserCircle, StickyNote, Download, Upload, Database, RefreshCw, Lock, HelpCircle, Receipt, CreditCard, Coins, Check, AlertTriangle, Moon, Sun } from 'lucide-react';

interface SettingsProps {
  clients: string[]; 
  templates: Template[];
  snippets: Snippet[];
  onUpdate: () => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ clients: clientNames, templates, snippets, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'templates' | 'snippets' | 'security'>('clients');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Client State
  const [newClientName, setNewClientName] = useState('');
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [originalClientName, setOriginalClientName] = useState('');
  
  const [fullProfiles, setFullProfiles] = useState<ClientProfile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Theme Toggle Effect
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

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

  React.useEffect(() => {
      const loadProfiles = async () => {
          const profiles = await db.getClients();
          setFullProfiles(profiles);
      };
      loadProfiles();
  }, [clientNames]); 

  // Template State
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [tempTags, setTempTags] = useState('');

  // Snippet State
  const [editingSnippet, setEditingSnippet] = useState<Partial<Snippet> | null>(null);

  // Security State
  const [newAgencyPass, setNewAgencyPass] = useState('');
  
  const [newRecoveryQuestion, setNewRecoveryQuestion] = useState('');
  const [newRecoveryAnswer, setNewRecoveryAnswer] = useState('');

  // Load current question on mount
  useEffect(() => {
    if(activeTab === 'security') {
        db.getRecoveryQuestion().then(setNewRecoveryQuestion);
    }
  }, [activeTab]);

  // --- HANDLERS (Same as before, logic unchanged) ---
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientName.trim()) {
      await db.addClient(newClientName.trim());
      setNewClientName('');
      onUpdate();
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingClient) return;
      try {
          await db.updateClient(originalClientName, editingClient);
          setEditingClient(null);
          onUpdate();
      } catch (err: any) { alert(err.message); }
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newAgencyPass.length < 4) { alert("Password too short"); return; }
      await db.updateAgencyPassword(newAgencyPass);
      setNewAgencyPass('');
      alert("Agency password updated successfully!");
  }

  const handleUpdateRecovery = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newRecoveryQuestion.length < 5 || newRecoveryAnswer.length < 3) { alert("Please provide a valid question and answer."); return; }
      await db.updateRecoverySettings(newRecoveryQuestion, newRecoveryAnswer);
      setNewRecoveryAnswer('');
      alert("Recovery settings updated successfully!");
  }

  const handleClearData = async () => {
      if (confirm("WARNING: This will delete ALL posts, clients, and settings. This action cannot be undone. Are you sure?")) {
          setIsProcessing(true);
          try { await db.clearDatabase(); onUpdate(); alert("All data cleared."); } catch (e) { console.error(e); alert("Failed to clear data."); } finally { setIsProcessing(false); }
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

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Optional toast here
  }

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
      case 'Instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'LinkedIn': return <Linkedin className="w-4 h-4 text-blue-700" />;
      case 'Twitter': return <Twitter className="w-4 h-4 text-blue-400" />;
      case 'Facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'TikTok': return <Video className="w-4 h-4 text-black dark:text-white" />;
      default: return null;
    }
  };

  return (
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
        <div className="w-full md:w-64 bg-gray-50/50 dark:bg-gray-900/30 border-r border-gray-100 dark:border-gray-700 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar md:overflow-visible flex-shrink-0">
            {[
                { id: 'clients', label: 'Clients', icon: Building2 },
                { id: 'templates', label: 'Templates', icon: FileText },
                { id: 'snippets', label: 'Snippets', icon: Hash },
                { id: 'security', label: 'Security', icon: ShieldCheck }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all w-full whitespace-nowrap md:whitespace-normal ${activeTab === tab.id ? 'bg-gradient-to-r from-swave-purple to-swave-orange text-white shadow-lg shadow-purple-500/20 dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'}`}
                >
                    <tab.icon className="w-5 h-5" /> {tab.label}
                </button>
            ))}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto bg-white dark:bg-gray-800 relative">
            {/* BACKGROUND DECORATION */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* --- CLIENTS TAB --- */}
            {activeTab === 'clients' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 relative z-10">
                {!editingClient ? (
                    <>
                         <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-grow bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 flex gap-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-xl h-fit text-indigo-600 dark:text-indigo-200"><KeyRound className="w-6 h-6"/></div>
                                <div>
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm mb-1">Access Management</h4>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed max-w-xl">
                                        Each client receives a unique Access Code. Share this code along with their Organization Name.
                                    </p>
                                </div>
                            </div>
                            
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

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {fullProfiles.map(client => (
                                <div key={client.name} className="flex flex-col justify-between p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-swave-purple/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all group gap-4 relative overflow-hidden min-h-[140px]">
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-12 h-12 bg-gradient-to-br from-swave-purple to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-200 dark:shadow-none shrink-0">
                                            {client.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-900 dark:text-white text-base truncate">{client.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <code className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 tracking-widest">{client.accessCode}</code>
                                                <button onClick={() => copyToClipboard(client.accessCode)} className="text-xs font-bold text-swave-orange hover:underline whitespace-nowrap">Copy Code</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end relative z-10 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                                        <button onClick={() => handleEditClick(client)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-swave-purple hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors flex items-center gap-2"><Edit3 className="w-4 h-4"/> Edit</button>
                                        <button onClick={async () => { if(confirm(`Remove ${client.name}?`)) { await db.removeClient(client.name); onUpdate(); }}} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4"/> Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleUpdateClient} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] p-8 shadow-xl relative overflow-hidden h-full flex flex-col">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-4 shrink-0">
                             <div>
                                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Editing Profile</p>
                                 <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{originalClientName}</h3>
                             </div>
                             <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-xl font-mono font-bold text-gray-600 dark:text-gray-300">{editingClient.accessCode}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-4">
                             <div className="space-y-6">
                                 <h4 className="text-xs font-bold text-swave-purple uppercase tracking-widest flex items-center gap-2"><UserCircle className="w-4 h-4"/> Identity & Contact</h4>
                                 <div className="space-y-4">
                                     <input required value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-swave-purple outline-none font-bold" placeholder="Organization Name"/>
                                     <input type="email" value={editingClient.email || ''} onChange={e => setEditingClient({...editingClient, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-swave-purple outline-none" placeholder="Email Address"/>
                                     <input type="tel" value={editingClient.phone || ''} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-swave-purple outline-none" placeholder="Phone Number"/>
                                     <input type="url" value={editingClient.website || ''} onChange={e => setEditingClient({...editingClient, website: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-swave-purple outline-none" placeholder="Website URL"/>
                                 </div>
                             </div>
                             <div className="space-y-6">
                                 <h4 className="text-xs font-bold text-swave-orange uppercase tracking-widest flex items-center gap-2"><Receipt className="w-4 h-4"/> Financial Details</h4>
                                 <div className="space-y-4">
                                     <select value={editingClient.currency || 'USD'} onChange={e => setEditingClient({...editingClient, currency: e.target.value as any})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-swave-orange outline-none font-bold">
                                         <option value="USD">USD ($)</option>
                                         <option value="EUR">EUR (€)</option>
                                         <option value="GBP">GBP (£)</option>
                                         <option value="XCD">XCD ($)</option>
                                     </select>
                                     <input value={editingClient.taxId || ''} onChange={e => setEditingClient({...editingClient, taxId: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-swave-orange outline-none font-mono" placeholder="Tax ID / VAT"/>
                                     <textarea value={editingClient.billingAddress || ''} onChange={e => setEditingClient({...editingClient, billingAddress: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-swave-orange outline-none h-32 resize-none" placeholder="Billing Address"/>
                                 </div>
                             </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setEditingClient(null)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                            <button type="submit" className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">Save Changes</button>
                        </div>
                    </form>
                )}
            </div>
            )}

            {/* --- TEMPLATES TAB --- */}
            {activeTab === 'templates' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 relative z-10 h-full flex flex-col">
                    {editingTemplate ? (
                        <form onSubmit={handleSaveTemplate} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl relative h-full flex flex-col">
                            <button type="button" onClick={() => setEditingTemplate(null)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:rotate-90 transition-transform"><X className="w-5 h-5"/></button>
                            <h3 className="text-xl font-black mb-8">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h3>
                            
                            <div className="flex-grow overflow-y-auto pr-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Template Name</label>
                                        <input required value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold outline-none focus:ring-2 focus:ring-swave-purple" placeholder="e.g. Weekly Update"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Platform</label>
                                        <select value={editingTemplate.platform} onChange={e => setEditingTemplate({...editingTemplate, platform: e.target.value as Platform})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold outline-none focus:ring-2 focus:ring-swave-purple">
                                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-6">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Caption Structure</label>
                                    <textarea required value={editingTemplate.captionSkeleton} onChange={e => setEditingTemplate({...editingTemplate, captionSkeleton: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl font-mono text-sm min-h-[200px] outline-none focus:ring-2 focus:ring-swave-purple leading-relaxed" placeholder="Write your template here..."/>
                                </div>

                                <div className="space-y-2 mb-8">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Tags</label>
                                    <input value={tempTags} onChange={e => setTempTags(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none focus:ring-2 focus:ring-swave-purple" placeholder="newsletter, weekly, urgent"/>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700 shrink-0">
                                <button type="submit" className="px-8 py-3 bg-swave-purple text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-colors">Save Template</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <button onClick={handleNewTemplate} className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 font-bold hover:border-swave-purple hover:text-swave-purple hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all flex items-center justify-center gap-2 group shrink-0">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-swave-purple group-hover:text-white transition-colors"><Plus className="w-5 h-5"/></div> Create New Template
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 overflow-y-auto pb-4">
                                {templates.map(t => (
                                    <div key={t.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-swave-purple/20 transition-all group relative h-full flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl"><PlatformIcon platform={t.platform} /></div>
                                                <h4 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{t.name}</h4>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditTemplate(t)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-500"><Edit3 className="w-4 h-4"/></button>
                                                <button onClick={() => handleDeleteTemplate(t.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700 font-mono text-xs text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed flex-grow">
                                            {t.captionSkeleton}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {t.tags.map(tag => (
                                                <span key={tag} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-purple-100 dark:border-purple-800">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* --- SNIPPETS TAB --- */}
            {activeTab === 'snippets' && (
                 <div className="space-y-8 animate-in slide-in-from-right-4 relative z-10 h-full flex flex-col">
                    {editingSnippet ? (
                        <form onSubmit={handleSaveSnippet} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl relative h-full flex flex-col">
                             <button type="button" onClick={() => setEditingSnippet(null)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:rotate-90 transition-transform"><X className="w-5 h-5"/></button>
                             <h3 className="text-xl font-black mb-8">{editingSnippet.id ? 'Edit Snippet' : 'New Snippet'}</h3>
                             
                             <div className="flex-grow space-y-6 overflow-y-auto pr-4">
                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-400 uppercase">Label</label>
                                     <input required value={editingSnippet.label} onChange={e => setEditingSnippet({...editingSnippet, label: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold outline-none focus:ring-2 focus:ring-swave-orange" placeholder="e.g. Hashtag Set 1"/>
                                 </div>
                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-400 uppercase">Content</label>
                                     <textarea required value={editingSnippet.content} onChange={e => setEditingSnippet({...editingSnippet, content: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl font-mono text-sm min-h-[250px] outline-none focus:ring-2 focus:ring-swave-orange leading-relaxed" placeholder="#growth #social #agency"/>
                                 </div>
                             </div>
                             <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700 shrink-0">
                                 <button type="submit" className="px-8 py-3 bg-swave-orange text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-colors">Save Snippet</button>
                             </div>
                        </form>
                    ) : (
                        <>
                             <button onClick={handleNewSnippet} className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 font-bold hover:border-swave-orange hover:text-swave-orange hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all flex items-center justify-center gap-2 group shrink-0">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-swave-orange group-hover:text-white transition-colors"><Plus className="w-5 h-5"/></div> Create New Snippet
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-4">
                                {snippets.map(s => (
                                    <div key={s.id} className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group flex flex-col justify-between gap-4 h-full">
                                         <div className="flex gap-4 min-w-0 items-start">
                                             <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-swave-orange rounded-xl shrink-0"><Hash className="w-6 h-6"/></div>
                                             <div className="min-w-0 pt-1 w-full">
                                                 <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">{s.label}</h4>
                                                 <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 font-mono text-xs text-gray-500 dark:text-gray-400 break-all relative group/code cursor-pointer line-clamp-3 hover:line-clamp-none transition-all" onClick={() => copyToClipboard(s.content)}>
                                                     {s.content}
                                                     <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur">COPY</div>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="flex gap-2 justify-end border-t border-gray-50 dark:border-gray-700/50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={() => handleEditSnippet(s)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Edit3 className="w-4 h-4"/></button>
                                             <button onClick={() => handleDeleteSnippet(s.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><Trash2 className="w-4 h-4"/></button>
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                 </div>
            )}

            {/* --- SECURITY TAB --- */}
            {activeTab === 'security' && (
                 <div className="space-y-10 max-w-2xl mx-auto animate-in slide-in-from-right-4 relative z-10">
                     {/* Agency Password */}
                     <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                         <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 mb-6"><Lock className="w-6 h-6 text-indigo-600"/> Agency Access</h3>
                         <form onSubmit={handleUpdatePassword} className="flex gap-3">
                             <input 
                                type="password"
                                value={newAgencyPass}
                                onChange={e => setNewAgencyPass(e.target.value)}
                                placeholder="New Master Password"
                                className="flex-grow p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                             />
                             <button type="submit" disabled={!newAgencyPass} className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">Update</button>
                         </form>
                     </div>

                     {/* Recovery Settings */}
                     <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                         <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 mb-6"><HelpCircle className="w-6 h-6 text-swave-purple"/> Account Recovery</h3>
                         <form onSubmit={handleUpdateRecovery} className="space-y-5">
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-gray-400 uppercase">Security Question</label>
                                 <input 
                                    value={newRecoveryQuestion}
                                    onChange={e => setNewRecoveryQuestion(e.target.value)}
                                    placeholder="e.g. What was your first pet's name?"
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-swave-purple font-medium"
                                 />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-gray-400 uppercase">Answer</label>
                                 <input 
                                    type="password"
                                    value={newRecoveryAnswer}
                                    onChange={e => setNewRecoveryAnswer(e.target.value)}
                                    placeholder="Your secure answer"
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-swave-purple font-medium"
                                 />
                             </div>
                             <div className="flex justify-end pt-2">
                                <button type="submit" disabled={!newRecoveryAnswer} className="bg-swave-purple text-white px-8 py-3 rounded-2xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-lg">Save Settings</button>
                             </div>
                         </form>
                     </div>

                     {/* Data Management */}
                     <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                         <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 mb-6"><Database className="w-6 h-6 text-blue-500"/> Data Management</h3>
                         <button onClick={handleExportData} className="w-full py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center gap-2 transition-all group">
                             <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors"><Download className="w-5 h-5"/></div> Backup Database (JSON)
                         </button>
                     </div>

                     {/* Danger Zone */}
                     <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2rem] border-2 border-red-100 dark:border-red-900/50">
                         <h3 className="text-xl font-black text-red-600 dark:text-red-400 flex items-center gap-3 mb-4"><AlertTriangle className="w-6 h-6"/> Danger Zone</h3>
                         <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-6 leading-relaxed bg-red-100/50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800/50">
                             WARNING: This action will permanently delete all posts, clients, templates, and invoices. This action cannot be undone. Please ensure you have a backup before proceeding.
                         </p>
                         <button onClick={handleClearData} disabled={isProcessing} className="w-full py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl hover:shadow-red-500/20 transition-all">
                            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Trash2 className="w-5 h-5"/>} Wipe Database
                         </button>
                     </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};
