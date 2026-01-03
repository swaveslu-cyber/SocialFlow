
import React, { useState } from 'react';
import { Post, PostStatus, User, PERMISSIONS } from '../types';
import { 
  Calendar, Instagram, Linkedin, Twitter, Facebook, Video, 
  Trash2, Send, CheckCircle, XCircle, MessageSquare, 
  Building2, History, Copy, ArrowRight, Edit2, Check, Loader2, RotateCcw, MoreHorizontal, Eye, Lock, Globe, Flag
} from 'lucide-react';
import { db } from '../services/db';

interface PostCardProps {
  post: Post & { ids: string[], platforms: string[] };
  user: User; // Replaces role
  compact?: boolean;
  onDelete?: (ids: string[]) => void;
  onRestore?: (ids: string[]) => void;
  onStatusChange?: (ids: string[], status: PostStatus, feedback?: string) => void;
  onEdit?: (post: any) => void;
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
    'In Review': 'bg-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-none',
    'Approved': 'bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-none',
    'Scheduled': 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-none',
    'Published': 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none',
    'Trashed': 'bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-none',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${styles[status] || styles['Draft']}`}>
      {status}
    </span>
  );
};

export const PostCard: React.FC<PostCardProps> = ({ post, user, compact, onDelete, onRestore, onStatusChange, onEdit, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'content' | 'comments' | 'history'>('content');
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const ids = post.ids || [post.id];
  const platforms = post.platforms || [post.platform];

  // RBAC: Hide internal comments from client viewers/admins
  const visibleComments = (post.comments || []).filter(c => {
      if (c.isInternal) {
          return PERMISSIONS.isInternal(user.role);
      }
      return true;
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      setIsSubmittingComment(true);
      try {
        await Promise.all(ids.map(id => db.addComment(id, {
            author: user.name,
            role: user.role,
            text: newComment,
            isInternal: PERMISSIONS.isInternal(user.role) ? isInternal : false
        })));
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
                <span className="bg-swave-purple/10 text-swave-purple text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-swave-purple/20 flex items-center gap-1">
                   <Flag className="w-2.5 h-2.5" /> {post.campaign}
                </span>
            )}
            {platforms.length > 1 && (
                <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-gray-200 flex items-center gap-1">
                   SYNC ({platforms.length})
                </span>
            )}
        </div>
        
        {post.mediaUrl && (
          <div className="aspect-video w-full bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden relative group shrink-0 border border-gray-100 dark:border-gray-800 shadow-sm">
            {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} controls className="w-full h-full object-contain bg-black" playsInline preload="metadata" />
            ) : (
                <div onClick={() => setShowLightbox(true)} className="w-full h-full cursor-zoom-in relative">
                    <img src={post.mediaUrl} alt="Visual" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-medium leading-relaxed overflow-y-auto max-h-32 short:max-h-20 scrollbar-thin px-1">
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
      <div className="flex-grow overflow-y-auto space-y-4 pr-1 max-h-[250px] short:max-h-[150px] scrollbar-thin min-h-[140px] pb-4 px-1">
        {visibleComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600 space-y-3 py-10 opacity-60">
              <MessageSquare className="w-12 h-12 stroke-[1.5]"/>
              <p className="text-xs italic font-bold">No visible feedback yet.</p>
          </div>
        ) : (
          visibleComments.map(c => (
             <div key={c.id} className={`flex flex-col ${c.author === user.name ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm relative ${c.isInternal ? 'bg-indigo-900 text-indigo-100 border border-indigo-700' : (c.role.includes('agency') ? 'bg-swave-purple text-white' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100')}`}>
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
              placeholder={PERMISSIONS.isInternal(user.role) && isInternal ? "Internal brainstorming only..." : "Post a comment..."}
              className="flex-grow text-xs border-none bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-swave-orange outline-none transition-all shadow-inner font-medium"
            />
            {PERMISSIONS.isInternal(user.role) && (
                <button type="button" onClick={() => setIsInternal(!isInternal)} className={`p-2 rounded-xl transition-colors ${isInternal ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                    <Lock className="w-4 h-4"/>
                </button>
            )}
            <button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="bg-gradient-to-br from-swave-purple to-swave-orange text-white rounded-xl w-14 h-14 short:w-10 short:h-10 disabled:opacity-50 flex items-center justify-center shadow-lg hover:scale-105 transition-all active:scale-95 shrink-0">
               {isSubmittingComment ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 short:w-4 short:h-4 ml-0.5" />}
            </button>
         </div>
      </form>
    </div>
  );

  const renderHistory = () => (
    <div className="flex-grow overflow-y-auto max-h-80 short:max-h-40 scrollbar-thin min-h-[200px] animate-in fade-in slide-in-from-right-2 duration-300">
      <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Audit Journal</h4>
      <ul className="space-y-6 relative ml-2 border-l-2 border-gray-100 dark:border-gray-700 pl-6 py-2">
        {(post.history || []).map((h) => (
          <li key={h.id} className="relative">
             <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-gray-800 border-2 border-swave-purple shadow-sm"></div>
             <p className="text-sm font-black text-gray-800 dark:text-gray-200">{h.action}</p>
             <div className="flex flex-col mt-1.5">
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{h.by}</span>
                 <span className="text-[9px] text-gray-400 font-medium">{new Date(h.timestamp).toLocaleString()}</span>
             </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
        <div className={`bg-white dark:bg-gray-800 rounded-3xl short:rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden flex flex-col transition-all duration-300 ${compact ? '' : 'min-h-[280px] md:h-full'} relative group`}>
        <div className="p-5 pb-3 short:p-3 flex justify-between items-center bg-white dark:bg-gray-800 z-10 relative">
            <div className="flex items-center gap-3">
                <div className="flex flex-wrap gap-1 max-w-[80px]">
                    {platforms.map(p => (
                        <div key={p} className="w-7 h-7 short:w-6 short:h-6 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-sm">
                            <PlatformIcon platform={p} />
                        </div>
                    ))}
                </div>
                <div>
                    <h3 className="text-sm short:text-xs font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{post.client}</h3>
                </div>
            </div>
            <StatusBadge status={post.status} />
        </div>
        <div className="px-5 pb-4 short:px-3 flex-grow bg-white dark:bg-gray-800">
            {viewMode === 'content' && renderContent()}
            {viewMode === 'comments' && renderComments()}
            {viewMode === 'history' && renderHistory()}
        </div>
        {!compact && (
            <div className={`p-2 mx-2 mb-2 short:mx-2 short:mb-2 bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl flex items-center justify-between gap-2 relative transition-all ${viewMode !== 'content' ? 'opacity-0 h-0 p-0 m-0 overflow-hidden' : 'opacity-100'}`}>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setViewMode('content')} className={`p-2.5 short:p-2 rounded-xl transition-all ${viewMode === 'content' ? 'bg-white dark:bg-gray-700 text-swave-orange shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}><Eye className="w-4 h-4 short:w-3.5 short:h-3.5" /></button>
                    <button onClick={() => setViewMode('comments')} className={`p-2.5 short:p-2 rounded-xl transition-all relative ${viewMode === 'comments' ? 'bg-white dark:bg-gray-700 text-swave-purple shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MessageSquare className="w-4 h-4 short:w-3.5 short:h-3.5" />
                        {visibleComments.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-swave-orange rounded-full border-2 border-gray-50 dark:border-gray-900"></span>}
                    </button>
                </div>
                {/* COMPACT FOOTER ACTIONS TO PREVENT OVERLAP */}
                <div className="flex items-center justify-end gap-1 flex-grow min-w-0">
                    <div className="flex items-center gap-1">
                        {post.status === 'Trashed' ? (
                            <button onClick={() => onRestore?.(ids)} className="text-[10px] bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-2 py-2 rounded-xl hover:scale-105 font-black flex items-center gap-1 transition-all active:scale-95"><RotateCcw className="w-3.5 h-3.5"/> Restore</button>
                        ) : (
                            <>
                                {/* RBAC BUTTON LOGIC - Compact Layout */}
                                {PERMISSIONS.isInternal(user.role) && post.status === 'Draft' && (
                                    <button onClick={() => onStatusChange?.(ids, 'In Review')} className="bg-gradient-to-r from-swave-purple to-swave-orange text-white px-2 py-2 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-lg hover:scale-[1.03] transition-all active:scale-95 whitespace-nowrap">Review <ArrowRight className="w-3 h-3"/></button>
                                )}
                                {PERMISSIONS.canApprove(user.role) && post.status === 'In Review' && (
                                    <button onClick={() => onStatusChange?.(ids, 'Approved')} className="bg-emerald-500 text-white px-2 py-2 rounded-xl text-[10px] font-black shadow-lg hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"><Check className="w-3 h-3"/> Approve</button>
                                )}
                                {PERMISSIONS.canPublish(user.role) && post.status === 'Approved' && (
                                    <button onClick={() => onStatusChange?.(ids, 'Scheduled')} className="bg-blue-600 text-white px-2 py-2 rounded-xl text-[10px] font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap">Schedule</button>
                                )}
                            </>
                        )}
                    </div>
                    <div className="relative shrink-0">
                        <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`p-2 rounded-xl transition-all ${showMoreMenu ? 'bg-gray-200 dark:bg-gray-700 text-gray-800' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><MoreHorizontal className="w-4 h-4" /></button>
                        {showMoreMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)}></div>
                                <div className="absolute bottom-full right-0 mb-4 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={() => { setViewMode('history'); setShowMoreMenu(false); }} className="w-full text-left px-5 py-3.5 text-xs font-black text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700"><History className="w-3.5 h-3.5 text-swave-purple"/> Audit Trail</button>
                                    <button onClick={copyToClipboard} className="w-full text-left px-5 py-3.5 text-xs font-black text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700"><Copy className="w-3.5 h-3.5 text-swave-orange"/> Copy Copy</button>
                                    {PERMISSIONS.canEdit(user.role) && (
                                        <button onClick={() => { onEdit?.(post); setShowMoreMenu(false); }} className="w-full text-left px-5 py-3.5 text-xs font-black text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700"><Edit2 className="w-3.5 h-3.5 text-blue-500"/> Edit Post</button>
                                    )}
                                    {PERMISSIONS.canDelete(user.role) && (
                                        <button onClick={() => { onDelete?.(ids); setShowMoreMenu(false); }} className="w-full text-left px-5 py-3.5 text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"><Trash2 className="w-3.5 h-3.5"/> Delete</button>
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
