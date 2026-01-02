
import React, { useState } from 'react';
import { Post, PostStatus, UserRole } from '../types';
import { 
  Calendar, Instagram, Linkedin, Twitter, Facebook, Video, 
  Trash2, Send, CheckCircle, XCircle, MessageSquare, 
  Building2, History, Copy, ArrowRight, Edit2, Check, Loader2, RotateCcw, MoreHorizontal, Eye, Lock, Globe, Flag
} from 'lucide-react';
import { db } from '../services/db';

interface PostCardProps {
  post: Post;
  role: UserRole;
  compact?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onStatusChange?: (id: string, status: PostStatus, feedback?: string) => void;
  onEdit?: (post: Post) => void;
  onUpdate?: () => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'Instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
    case 'LinkedIn': return <Linkedin className="w-4 h-4 text-blue-700 dark:text-blue-400" />;
    case 'Twitter': return <Twitter className="w-4 h-4 text-blue-400" />;
    case 'Facebook': return <Facebook className="w-4 h-4 text-blue-600 dark:text-blue-500" />;
    case 'TikTok': return <Video className="w-4 h-4 text-black dark:text-white" />;
    default: return null;
  }
};

const StatusBadge = ({ status }: { status: PostStatus }) => {
  const styles: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'In Review': 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none',
    'Approved': 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none',
    'Scheduled': 'bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none',
    'Published': 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none',
    'Trashed': 'bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-none',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${styles[status] || styles['Draft']}`}>
      {status}
    </span>
  );
};

export const PostCard: React.FC<PostCardProps> = ({ post, role, compact, onDelete, onRestore, onStatusChange, onEdit, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'content' | 'comments' | 'history'>('content');
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Enterprise Filter: Clients never see internal comments
  const visibleComments = post.comments.filter(c => role === 'agency' || !c.isInternal);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      setIsSubmittingComment(true);
      try {
        await db.addComment(post.id, {
            author: role === 'agency' ? 'Agency' : post.client,
            role: role,
            text: newComment,
            isInternal: role === 'agency' ? isInternal : false
        });
        setNewComment('');
        onUpdate?.();
      } catch (error) {
        console.error("Failed to add comment", error);
      } finally {
        setIsSubmittingComment(false);
      }
    }
  };

  const copyToClipboard = () => {
    const text = `${post.caption}\n\n[Media URL]: ${post.mediaUrl}`;
    navigator.clipboard.writeText(text);
    alert('Content copied!');
    setShowMoreMenu(false);
  };

  const renderContent = () => (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-wrap gap-2">
            {post.campaign && (
                <span className="bg-swave-purple/10 text-swave-purple text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-swave-purple/20 flex items-center gap-1">
                   <Flag className="w-2.5 h-2.5" /> {post.campaign}
                </span>
            )}
        </div>
        
        {post.mediaUrl && (
          <div className="aspect-video w-full bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden relative group shrink-0 border border-gray-100 dark:border-gray-800 shadow-inner">
            {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} controls className="w-full h-full object-contain bg-black" playsInline preload="metadata" />
            ) : (
                <div onClick={() => setShowLightbox(true)} className="w-full h-full cursor-zoom-in relative">
                    <img src={post.mediaUrl} alt="Visual" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-medium leading-relaxed overflow-y-auto max-h-40 scrollbar-thin px-1">
          {post.caption}
        </div>
        
        <div className="flex items-center text-[11px] font-bold text-gray-400 dark:text-gray-500 gap-2 mt-auto pt-2 uppercase tracking-wide">
          <Calendar className="w-3.5 h-3.5" />
          <span>Launch: {post.date}</span>
        </div>
    </div>
  );

  const renderComments = () => (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300 overflow-hidden">
      <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Collaboration Hub</h4>
      <div className="flex-grow overflow-y-auto space-y-4 pr-1 max-h-[300px] scrollbar-thin min-h-[140px] pb-4 px-1">
        {visibleComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600 space-y-3 py-10 opacity-60">
              <MessageSquare className="w-12 h-12 stroke-[1.5]"/>
              <p className="text-xs italic font-bold">No visible feedback yet.</p>
          </div>
        ) : (
          visibleComments.map(c => (
             <div key={c.id} className={`flex flex-col ${c.role === role ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-[1.25rem] px-4 py-3 text-xs leading-relaxed shadow-sm relative ${c.isInternal ? 'bg-indigo-900 text-indigo-100 border border-indigo-700' : (c.role === 'agency' ? 'bg-swave-purple text-white' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100')}`}>
                  <span className={`font-black block mb-1 text-[9px] uppercase tracking-wider opacity-60 flex items-center gap-1`}>
                    {c.author} {c.isInternal && <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded-full text-[7px] flex items-center gap-0.5"><Lock className="w-2 h-2"/> PRIVATE</span>}
                  </span>
                  {c.text}
                </div>
                <span className="text-[9px] text-gray-400 mt-1.5 px-2 font-bold uppercase tracking-widest">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             </div>
          ))
        )}
      </div>
      <form onSubmit={handleAddComment} className="mt-2 flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0 z-20">
         <div className="flex gap-2">
            <input 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isInternal ? "Internal brainstorming only..." : "Post a comment..."}
              className="flex-grow text-xs border-none bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-[1.25rem] px-5 py-4 focus:ring-2 focus:ring-swave-orange outline-none transition-all shadow-inner font-medium"
            />
            <button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="bg-gradient-to-br from-swave-purple to-swave-orange text-white rounded-2xl w-14 h-14 disabled:opacity-50 flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95 shrink-0">
               {isSubmittingComment ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-0.5" />}
            </button>
         </div>
         {role === 'agency' && (
             <div className="flex items-center justify-between px-2">
                 <button 
                    type="button" 
                    onClick={() => setIsInternal(!isInternal)}
                    className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${isInternal ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}
                >
                    {isInternal ? <><Lock className="w-3 h-3"/> Internal Note</> : <><Globe className="w-3 h-3"/> Visible to Client</>}
                 </button>
                 <span className="text-[9px] text-gray-300 font-bold">Press enter to send</span>
             </div>
         )}
      </form>
    </div>
  );

  const renderHistory = () => (
    <div className="flex-grow overflow-y-auto max-h-80 scrollbar-thin min-h-[200px] animate-in fade-in slide-in-from-right-2 duration-300">
      <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Audit Journal</h4>
      <ul className="space-y-6 relative ml-2 border-l-2 border-gray-100 dark:border-gray-700 pl-6 py-2">
        {post.history.map((h) => (
          <li key={h.id} className="relative">
             <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-gray-800 border-2 border-swave-purple shadow-sm"></div>
             <p className="text-sm font-black text-gray-800 dark:text-gray-200">{h.action}</p>
             <div className="flex items-center gap-2 mt-1.5">
                 <span className="text-[10px] bg-swave-purple/10 text-swave-purple font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{h.by}</span>
                 <span className="text-[10px] text-gray-400 font-bold">{new Date(h.timestamp).toLocaleString()}</span>
             </div>
             {h.details && (
                 <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl italic border-l-4 border-swave-purple/40 leading-relaxed font-medium">
                    {h.details}
                 </div>
             )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
        <div className={`bg-white dark:bg-gray-800 rounded-[3rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700/50 overflow-hidden flex flex-col transition-all hover:shadow-2xl ${compact ? '' : 'min-h-[300px] md:h-full'} relative group`}>
        <div className="p-6 pb-4 flex justify-between items-center bg-white dark:bg-gray-800 z-10 relative">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-gray-100 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                    <PlatformIcon platform={post.platform} />
                </div>
                <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{post.client}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">{post.platform}</span>
                    </div>
                </div>
            </div>
            <StatusBadge status={post.status} />
        </div>
        <div className="px-6 pb-4 flex-grow bg-white dark:bg-gray-800">
            {viewMode === 'content' && renderContent()}
            {viewMode === 'comments' && renderComments()}
            {viewMode === 'history' && renderHistory()}
        </div>
        {!compact && (
            <div className={`p-4 mx-6 mb-6 bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-md rounded-[2rem] flex items-center justify-between gap-3 relative transition-all ${viewMode !== 'content' ? 'opacity-0 h-0 p-0 m-0 overflow-hidden' : 'opacity-100'}`}>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setViewMode('content')} className={`p-3 rounded-2xl transition-all ${viewMode === 'content' ? 'bg-white dark:bg-gray-700 text-swave-orange shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}><Eye className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('comments')} className={`p-3 rounded-2xl transition-all relative ${viewMode === 'comments' ? 'bg-white dark:bg-gray-700 text-swave-purple shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MessageSquare className="w-5 h-5" />
                        {visibleComments.length > 0 && <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-swave-orange rounded-full border-2 border-gray-50 dark:border-gray-900"></span>}
                    </button>
                </div>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                <div className="flex items-center justify-end gap-2.5 flex-grow min-w-0">
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                        {post.status === 'Trashed' ? (
                            <button onClick={() => onRestore?.(post.id)} className="text-[11px] bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-3 rounded-2xl hover:scale-105 font-black flex items-center gap-2 transition-all active:scale-95"><RotateCcw className="w-4 h-4"/> Restore</button>
                        ) : (
                            <>
                                {role === 'agency' && (
                                    <>
                                        {post.status === 'Draft' && (
                                            <button onClick={() => onStatusChange?.(post.id, 'In Review')} className="bg-gradient-to-r from-swave-purple to-swave-orange text-white px-6 py-3 rounded-2xl text-[11px] font-black flex items-center gap-2 shadow-xl shadow-orange-100 dark:shadow-none hover:scale-[1.03] transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest">Review <ArrowRight className="w-4 h-4"/></button>
                                        )}
                                        {post.status === 'Approved' && (
                                            <button onClick={() => onStatusChange?.(post.id, 'Scheduled')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest">Schedule</button>
                                        )}
                                    </>
                                )}
                                {role === 'client' && post.status === 'In Review' && (
                                    <button onClick={() => onStatusChange?.(post.id, 'Approved')} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-[11px] font-black shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap uppercase tracking-widest"><Check className="w-4 h-4"/> Approve</button>
                                )}
                            </>
                        )}
                    </div>
                    <div className="relative shrink-0">
                        <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`p-3 rounded-2xl transition-all ${showMoreMenu ? 'bg-gray-200 dark:bg-gray-700 text-gray-800' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><MoreHorizontal className="w-5 h-5" /></button>
                        {showMoreMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)}></div>
                                <div className="absolute bottom-full right-0 mb-4 w-56 bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={() => { setViewMode('history'); setShowMoreMenu(false); }} className="w-full text-left px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700"><History className="w-4 h-4 text-swave-purple"/> Audit Trail</button>
                                    <button onClick={copyToClipboard} className="w-full text-left px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700"><Copy className="w-4 h-4 text-swave-orange"/> Copy Copy</button>
                                    {role === 'agency' && (
                                        <>
                                            <button onClick={() => { onEdit?.(post); setShowMoreMenu(false); }} className="w-full text-left px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700"><Edit2 className="w-4 h-4 text-blue-500"/> Edit Post</button>
                                            <button onClick={() => { onDelete?.(post.id); setShowMoreMenu(false); }} className="w-full text-left px-6 py-4 text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"><Trash2 className="w-4 h-4"/> Delete</button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}
        </div>
        {showLightbox && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowLightbox(false)}>
                <img src={post.mediaUrl} alt="Full View" className="max-w-full max-h-[90vh] object-contain rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95" />
            </div>
        )}
    </>
  );
};
