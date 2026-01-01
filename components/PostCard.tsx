
import React, { useState } from 'react';
import { Post, PostStatus, UserRole } from '../types';
import { 
  Calendar, Instagram, Linkedin, Twitter, Facebook, Video, 
  Trash2, Send, CheckCircle, XCircle, MessageSquare, 
  Building2, PlayCircle, History, Clock, Copy, ArrowRight, Edit2, Check, Loader2
} from 'lucide-react';
import { db } from '../services/db';

interface PostCardProps {
  post: Post;
  role: UserRole;
  compact?: boolean;
  onDelete?: (id: string) => void;
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
  const styles = {
    'Draft': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'In Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Approved': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'Scheduled': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Published': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-300 ease-in-out ${styles[status]}`}>
      {status}
    </span>
  );
};

export const PostCard: React.FC<PostCardProps> = ({ post, role, compact, onDelete, onStatusChange, onEdit, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'history'>('content');
  const [newComment, setNewComment] = useState('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      setIsSubmittingComment(true);
      try {
        await db.addComment(post.id, {
            author: role === 'agency' ? 'Agency' : post.client,
            role: role,
            text: newComment,
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

  const handleClientRequestChanges = () => {
      const feedback = prompt("Please describe what changes are needed:");
      if (feedback && feedback.trim() !== "") {
          onStatusChange?.(post.id, 'In Review', feedback);
      }
  };

  const copyToClipboard = () => {
    const text = `${post.caption}\n\n[Media URL]: ${post.mediaUrl}`;
    navigator.clipboard.writeText(text);
    alert('Post content copied to clipboard!');
  };

  const renderContent = () => (
    <div className="flex flex-col gap-3 h-full">
       <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
          <Calendar className="w-3 h-3" />
          <span>{post.date}</span>
        </div>

        {post.mediaUrl && (
          <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative group shrink-0 border border-gray-100 dark:border-gray-700">
            {post.mediaType === 'video' ? (
                <video 
                    src={post.mediaUrl} 
                    controls 
                    className="w-full h-full object-contain bg-black" 
                    playsInline
                    preload="metadata"
                />
            ) : (
                <div 
                    onClick={() => setShowLightbox(true)}
                    className="w-full h-full cursor-zoom-in relative"
                >
                    <img 
                      src={post.mediaUrl} 
                      alt="Visual" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    </div>
                </div>
            )}
            {post.mediaType === 'video' && (
                <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full pointer-events-none z-10">
                    <Video className="w-3 h-3" />
                </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-medium overflow-y-auto max-h-40 scrollbar-thin">
          {post.caption}
        </div>
    </div>
  );

  const renderComments = () => (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto space-y-3 pr-1 max-h-60 scrollbar-thin">
        {post.comments.length === 0 ? (
          <p className="text-gray-400 text-xs italic text-center py-4">No comments yet.</p>
        ) : (
          post.comments.map(c => (
             <div key={c.id} className={`flex flex-col ${c.role === role ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-2 text-xs ${c.role === 'agency' ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'}`}>
                  <span className="font-bold block mb-0.5 text-[10px] uppercase opacity-75">{c.author}</span>
                  {c.text}
                </div>
                <span className="text-[10px] text-gray-300 dark:text-gray-500 mt-0.5">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             </div>
          ))
        )}
      </div>
      <form onSubmit={handleAddComment} className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex gap-2">
         <input 
           value={newComment}
           onChange={(e) => setNewComment(e.target.value)}
           placeholder="Type a comment..."
           className="flex-grow text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2.5 focus:ring-1 focus:ring-indigo-500 outline-none"
         />
         <button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="bg-gray-900 dark:bg-gray-700 text-white rounded-md p-2.5 disabled:opacity-50 min-w-[36px] flex items-center justify-center">
            {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
         </button>
      </form>
    </div>
  );

  const renderHistory = () => (
    <div className="flex-grow overflow-y-auto max-h-60 scrollbar-thin">
      <ul className="space-y-4 relative ml-2 border-l border-gray-100 dark:border-gray-700 pl-4 py-2">
        {post.history.map((h) => (
          <li key={h.id} className="relative">
             <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800"></div>
             <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{h.action}</p>
             <p className="text-[10px] text-gray-400">by {h.by} • {new Date(h.timestamp).toLocaleString()}</p>
             {h.details && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 italic">"{h.details}"</p>}
          </li>
        ))}
        {post.versions.length > 0 && (
           <li className="pt-2 border-t border-gray-50 dark:border-gray-700 mt-2">
             <p className="text-xs font-bold text-gray-400 uppercase">Version History</p>
             <p className="text-[10px] text-gray-400">{post.versions.length} previous versions saved.</p>
           </li>
        )}
      </ul>
    </div>
  );

  return (
    <>
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-all hover:shadow-md ${compact ? '' : 'h-full'} relative`}>
        
        {/* Header */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-900/30">
            <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 shadow-sm">
                <Building2 className="w-3 h-3" />
                {post.client}
            </div>
            <div className="flex items-center gap-2">
                <PlatformIcon platform={post.platform} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{post.platform}</span>
            </div>
            </div>
            <StatusBadge status={post.status} />
        </div>

        {/* COMPACT VIEW ONE-CLICK ACTIONS */}
        {compact && role === 'client' && post.status === 'In Review' && (
             <div className="absolute top-10 right-2 z-10">
                 <button 
                     onClick={(e) => {
                         e.stopPropagation();
                         onStatusChange?.(post.id, 'Approved');
                     }}
                     className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-lg border-2 border-white dark:border-gray-800 pointer-events-auto transform hover:scale-110 transition-transform"
                     title="Quick Approve"
                 >
                     <Check className="w-4 h-4" />
                 </button>
             </div>
        )}

        {/* Tabs (Only in expanded view) */}
        {!compact && (
            <div className="flex border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === 'content' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>Preview</button>
            <button onClick={() => setActiveTab('comments')} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                Comments <span className="bg-gray-100 dark:bg-gray-700 px-1.5 rounded-full text-[9px]">{post.comments.length}</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                History <span className="bg-gray-100 dark:bg-gray-700 px-1.5 rounded-full text-[9px]">{post.history.length}</span>
            </button>
            </div>
        )}

        {/* Main Body */}
        <div className="p-4 flex-grow bg-white dark:bg-gray-800 min-h-[200px]">
            {activeTab === 'content' ? renderContent() : (activeTab === 'comments' ? renderComments() : renderHistory())}
        </div>

        {/* Actions Footer (Full View) */}
        {!compact && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 flex flex-col gap-3">
            {/* Action Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-2">
                
                {/* Agency Workflow Controls */}
                {role === 'agency' && (
                    <div className="flex gap-2 flex-wrap">
                    {post.status === 'Draft' && (
                        <button onClick={() => onStatusChange?.(post.id, 'In Review')} className="text-xs bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 flex items-center gap-1 shadow-sm">
                            Submit for Review <ArrowRight className="w-3 h-3"/>
                        </button>
                    )}
                    {post.status === 'Approved' && (
                        <button onClick={() => onStatusChange?.(post.id, 'Scheduled')} className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center gap-1 shadow-sm">
                            Mark Scheduled
                        </button>
                    )}
                    {post.status === 'Scheduled' && (
                        <button onClick={() => onStatusChange?.(post.id, 'Published')} className="text-xs bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700 flex items-center gap-1 shadow-sm">
                            Mark Published
                        </button>
                    )}
                    </div>
                )}

                {/* Client Workflow Controls */}
                {role === 'client' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                    {post.status === 'In Review' && (
                        <button onClick={() => onStatusChange?.(post.id, 'Approved')} className="flex-1 sm:flex-none text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-1 shadow-sm">
                            <CheckCircle className="w-3 h-3"/> Approve
                        </button>
                    )}
                    
                    {/* Allow requesting changes on both In Review and Approved posts */}
                    {(post.status === 'In Review' || post.status === 'Approved') && (
                         <button 
                            onClick={post.status === 'In Review' ? () => setActiveTab('comments') : handleClientRequestChanges} 
                            className="flex-1 sm:flex-none text-xs bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 px-3 py-2 rounded hover:bg-amber-200 dark:hover:bg-amber-900/60 flex items-center justify-center gap-1 shadow-sm"
                        >
                            <MessageSquare className="w-3 h-3"/> Request Changes
                        </button>
                    )}
                    </div>
                )}

                <div className="flex gap-1 ml-auto">
                    <button onClick={copyToClipboard} title="Copy Content" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <Copy className="w-4 h-4"/>
                    </button>
                    {role === 'agency' && (
                    <>
                        <button onClick={() => onEdit?.(post)} title="Edit" className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors">
                        <Edit2 className="w-4 h-4"/>
                        </button>
                        <button onClick={() => onDelete?.(post.id)} title="Delete" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                        <Trash2 className="w-4 h-4"/>
                        </button>
                    </>
                    )}
                </div>
            </div>
            </div>
        )}
        </div>

        {/* Lightbox Modal */}
        {showLightbox && (
            <div 
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowLightbox(false);
                }}
            >
                <button 
                    onClick={() => setShowLightbox(false)} 
                    className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                    <XCircle className="w-8 h-8" />
                </button>
                <img 
                    src={post.mediaUrl} 
                    alt="Full View" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()} 
                    referrerPolicy="no-referrer"
                />
            </div>
        )}
    </>
  );
};
