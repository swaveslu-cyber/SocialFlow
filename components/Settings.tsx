
import React, { useState } from 'react';
import { db } from '../services/db';
import { Template, Snippet, Platform, PLATFORMS, ClientProfile } from '../types';
import { Trash2, Plus, Save, X, Building2, FileText, Hash, KeyRound, Copy, ShieldCheck, ArrowLeft, Mail, Phone, Globe, Instagram, Linkedin, Twitter, Facebook, Video, Edit3, UserCircle, StickyNote, Download, Upload } from 'lucide-react';

interface SettingsProps {
  clients: string[]; 
  templates: Template[];
  snippets: Snippet[];
  onUpdate: () => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ clients: clientNames, templates, snippets, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'templates' | 'snippets' | 'security'>('clients');

  // Client State
  const [newClientName, setNewClientName] = useState('');
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [originalClientName, setOriginalClientName] = useState('');
  
  // Note: clients prop contains just names. To edit, we fetch full profiles when clicking edit, 
  // or we could fetch all at once. For simplicity, we fetch all via db.getClients in parent, but here we might just have names.
  // Actually, let's fetch profiles on mount or when needed.
  // For this refactor, let's just use the prop data, but we need full profiles for the list.
  // The parent passes just names, so we need to fetch full profiles here to show the list properly.
  
  const [fullProfiles, setFullProfiles] = useState<ClientProfile[]>([]);
  
  React.useEffect(() => {
      const loadProfiles = async () => {
          const profiles = await db.getClients();
          setFullProfiles(profiles);
      };
      loadProfiles();
  }, [clientNames]); // Reload when names change

  // Template State
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);

  // Snippet State
  const [editingSnippet, setEditingSnippet] = useState<Partial<Snippet> | null>(null);

  // Security State
  const [newAgencyPass, setNewAgencyPass] = useState('');

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
      } catch (err: any) {
          alert(err.message);
      }
  };

  const handleEditClick = (client: ClientProfile) => {
      setEditingClient(JSON.parse(JSON.stringify(client)));
      setOriginalClientName(client.name);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate && editingTemplate.name && editingTemplate.captionSkeleton) {
       await db.saveTemplate(editingTemplate as Template);
       setEditingTemplate(null);
       onUpdate();
    }
  };

  const handleSaveSnippet = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingSnippet && editingSnippet.label && editingSnippet.content) {
          await db.saveSnippet(editingSnippet as Snippet);
          setEditingSnippet(null);
          onUpdate();
      }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newAgencyPass.length < 4) {
          alert("Password too short");
          return;
      }
      await db.updateAgencyPassword(newAgencyPass);
      setNewAgencyPass('');
      alert("Agency password updated successfully!");
  }

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert(`Copied: ${text}`);
  }

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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in max-w-4xl mx-auto flex flex-col h-full md:h-auto">
      <div className="border-b border-gray-200 dark:border-gray-700 flex items-center bg-gray-50/50 dark:bg-gray-900/20">
         <button 
            onClick={onClose}
            className="p-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-r border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            title="Back to Dashboard"
         >
            <ArrowLeft className="w-5 h-5" />
         </button>
         
         <div className="flex overflow-x-auto no-scrollbar flex-grow">
            <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'clients' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
            <Building2 className="w-4 h-4" /> Clients
            </button>
            <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'templates' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
            <FileText className="w-4 h-4" /> Templates
            </button>
            <button
            onClick={() => setActiveTab('snippets')}
            className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'snippets' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
            <Hash className="w-4 h-4" /> Snippets
            </button>
            <button
            onClick={() => setActiveTab('security')}
            className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
            <ShieldCheck className="w-4 h-4" /> Security
            </button>
        </div>
      </div>

      <div className="p-4 md:p-6 overflow-y-auto">
        {/* --- CLIENTS TAB --- */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {!editingClient ? (
                <>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 text-sm text-indigo-800 dark:text-indigo-300">
                    <p className="font-bold mb-1">How Client Login Works:</p>
                    When you add a client, an <strong>Access Code</strong> is automatically generated. Send this code to your client. They will need to select their organization name and enter the code to access the portal.
                    </div>
                    
                    <form onSubmit={handleAddClient} className="flex gap-2">
                    <input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="New Client Name"
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    <button type="submit" disabled={!newClientName.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">Add</button>
                    </form>

                    <div className="grid grid-cols-1 gap-3">
                    {fullProfiles.map(client => (
                        <div key={client.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600 group gap-3">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-500 shadow-sm font-bold text-gray-600 dark:text-gray-200 shrink-0">
                                {client.name.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-100">{client.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <KeyRound className="w-3 h-3" /> 
                                    <span>Code: <span className="font-mono bg-white dark:bg-gray-600 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-500 select-all font-semibold text-gray-700 dark:text-gray-300">{client.accessCode}</span></span>
                                    <button onClick={() => copyToClipboard(client.accessCode)} className="text-indigo-600 dark:text-indigo-400 hover:underline">Copy</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end sm:justify-start">
                            <button 
                                onClick={() => handleEditClick(client)}
                                className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                                title="Edit Client Details"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={async () => {
                                if(confirm(`Remove ${client.name}? They will lose access immediately.`)) {
                                    await db.removeClient(client.name);
                                    onUpdate();
                                }
                                }}
                                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                                title="Remove Client"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                </>
            ) : (
                <form onSubmit={handleUpdateClient} className="border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 md:p-6 bg-indigo-50/30 dark:bg-indigo-900/10 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-indigo-600" /> 
                            <span className="truncate max-w-[150px] sm:max-w-none">Editing {originalClientName}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="text-xs bg-white dark:bg-gray-700 px-3 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <KeyRound className="w-3 h-3"/> {editingClient.accessCode}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Contact Information</h4>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name</label>
                                <input 
                                    required
                                    value={editingClient.name} 
                                    onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Changing the name will update all existing posts.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Mail className="w-3 h-3"/> Email Address</label>
                                <input 
                                    type="email"
                                    value={editingClient.email || ''} 
                                    onChange={e => setEditingClient({...editingClient, email: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="contact@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Phone Number</label>
                                <input 
                                    type="tel"
                                    value={editingClient.phone || ''} 
                                    onChange={e => setEditingClient({...editingClient, phone: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Globe className="w-3 h-3"/> Website</label>
                                <input 
                                    type="url"
                                    value={editingClient.website || ''} 
                                    onChange={e => setEditingClient({...editingClient, website: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://company.com"
                                />
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Social Accounts</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Instagram className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input 
                                        placeholder="Instagram Profile URL"
                                        value={editingClient.socialAccounts?.instagram || ''}
                                        onChange={e => setEditingClient({...editingClient, socialAccounts: {...editingClient.socialAccounts, instagram: e.target.value}})}
                                        className="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Linkedin className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input 
                                        placeholder="LinkedIn Page URL"
                                        value={editingClient.socialAccounts?.linkedin || ''}
                                        onChange={e => setEditingClient({...editingClient, socialAccounts: {...editingClient.socialAccounts, linkedin: e.target.value}})}
                                        className="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Twitter className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input 
                                        placeholder="Twitter/X Profile URL"
                                        value={editingClient.socialAccounts?.twitter || ''}
                                        onChange={e => setEditingClient({...editingClient, socialAccounts: {...editingClient.socialAccounts, twitter: e.target.value}})}
                                        className="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Facebook className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input 
                                        placeholder="Facebook Page URL"
                                        value={editingClient.socialAccounts?.facebook || ''}
                                        onChange={e => setEditingClient({...editingClient, socialAccounts: {...editingClient.socialAccounts, facebook: e.target.value}})}
                                        className="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Video className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input 
                                        placeholder="TikTok Profile URL"
                                        value={editingClient.socialAccounts?.tiktok || ''}
                                        onChange={e => setEditingClient({...editingClient, socialAccounts: {...editingClient.socialAccounts, tiktok: e.target.value}})}
                                        className="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="pt-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><StickyNote className="w-3 h-3"/> Internal Notes</label>
                        <textarea 
                            value={editingClient.notes || ''}
                            onChange={e => setEditingClient({...editingClient, notes: e.target.value})}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="Add essential info for the team (e.g. Brand voice guidelines, preferred posting times, key contacts...)"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 p-2 -mx-2 sm:mx-0 sm:p-0 sm:relative sm:bg-transparent">
                        <button type="button" onClick={() => setEditingClient(null)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium"><Save className="w-4 h-4"/> Save Profile</button>
                    </div>
                </form>
            )}
          </div>
        )}

        {/* --- TEMPLATES TAB --- */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {!editingTemplate ? (
               <>
                 <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create templates for recurring content types.</p>
                    <button 
                        onClick={() => setEditingTemplate({ platform: 'Instagram', tags: [] })}
                        className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        <Plus className="w-3 h-3" /> New Template
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors bg-gray-50/50 dark:bg-gray-750">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{t.name}</h4>
                                    <span className="text-xs px-2 py-0.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-gray-500 dark:text-gray-300">{t.platform}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setEditingTemplate(t)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
                                    <button onClick={() => { if(confirm('Delete template?')) { db.deleteTemplate(t.id); onUpdate(); }}} className="text-xs text-red-500 hover:underline ml-2">Delete</button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic border-l-2 border-gray-300 dark:border-gray-600 pl-2 mb-2">{t.captionSkeleton}</p>
                            <div className="flex gap-1 flex-wrap">
                                {t.tags.map(tag => <span key={tag} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded">{tag}</span>)}
                            </div>
                        </div>
                    ))}
                 </div>
               </>
            ) : (
                <form onSubmit={handleSaveTemplate} className="border border-indigo-100 dark:border-indigo-900 rounded-xl p-6 bg-indigo-50/30 dark:bg-indigo-900/10 space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                            <input 
                                required
                                value={editingTemplate.name || ''} 
                                onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                            <select
                                value={editingTemplate.platform}
                                onChange={e => setEditingTemplate({...editingTemplate, platform: e.target.value as Platform})}
                                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Caption Structure</label>
                         <textarea 
                             required
                             value={editingTemplate.captionSkeleton || ''}
                             onChange={e => setEditingTemplate({...editingTemplate, captionSkeleton: e.target.value})}
                             className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Default Tags (comma separated)</label>
                         <input 
                             value={editingTemplate.tags?.join(', ') || ''}
                             onChange={e => setEditingTemplate({...editingTemplate, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                             className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                             placeholder="#tag1, #tag2"
                         />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium"><Save className="w-4 h-4"/> Save Template</button>
                    </div>
                </form>
            )}
          </div>
        )}

        {/* --- SNIPPETS TAB --- */}
        {activeTab === 'snippets' && (
             <div className="space-y-6">
             {!editingSnippet ? (
                <>
                  <div className="flex justify-between items-center">
                     <p className="text-sm text-gray-500 dark:text-gray-400">Snippets are reusable blocks of text.</p>
                     <button 
                         onClick={() => setEditingSnippet({ })}
                         className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium"
                     >
                         <Plus className="w-3 h-3" /> New Snippet
                     </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                     {snippets.map(s => (
                         <div key={s.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors bg-white dark:bg-gray-750">
                             <div className="flex-grow">
                                 <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">{s.label}</h4>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">{s.content}</p>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => setEditingSnippet(s)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
                                 <button onClick={() => { if(confirm('Delete snippet?')) { db.deleteSnippet(s.id); onUpdate(); }}} className="text-xs text-red-500 hover:underline">Delete</button>
                             </div>
                         </div>
                     ))}
                  </div>
                </>
             ) : (
                 <form onSubmit={handleSaveSnippet} className="border border-indigo-100 dark:border-indigo-900 rounded-xl p-6 bg-indigo-50/30 dark:bg-indigo-900/10 space-y-4">
                     <h3 className="font-bold text-lg text-gray-800 dark:text-white">{editingSnippet.id ? 'Edit Snippet' : 'New Snippet'}</h3>
                     <div>
                         <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Label (for button)</label>
                         <input 
                             required
                             value={editingSnippet.label || ''} 
                             onChange={e => setEditingSnippet({...editingSnippet, label: e.target.value})}
                             className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         />
                     </div>
                     <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                          <textarea 
                              required
                              value={editingSnippet.content || ''}
                              onChange={e => setEditingSnippet({...editingSnippet, content: e.target.value})}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                     </div>
                     <div className="flex justify-end gap-2">
                         <button type="button" onClick={() => setEditingSnippet(null)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                         <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium"><Save className="w-4 h-4"/> Save Snippet</button>
                     </div>
                 </form>
             )}
           </div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
            <div className="space-y-6 max-w-md">
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-bold mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Security & Data</p>
                    Your data is now stored securely in the Cloud. The Export feature below creates a JSON snapshot of your database.
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50/30 dark:bg-gray-750 space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">Data Management</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                            onClick={handleExportData}
                            className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <Download className="w-4 h-4" /> Export Data
                        </button>
                    </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50/30 dark:bg-gray-750 space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">Update Agency Password</h3>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <input 
                            type="password"
                            required
                            minLength={4}
                            value={newAgencyPass} 
                            onChange={e => setNewAgencyPass(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Update Password</button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};
