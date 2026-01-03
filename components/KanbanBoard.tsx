
import React, { useState } from 'react';
import { Post, PostStatus, STATUS_FLOW, User } from '../types';
import { PostCard } from './PostCard';
import { MoreHorizontal } from 'lucide-react';

interface KanbanBoardProps {
  posts: any[];
  user: User;
  onPostClick: (post: any) => void;
  onStatusChange: (ids: string[], status: PostStatus, feedback?: string) => void;
  onDelete: (ids: string[]) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ posts, user, onPostClick, onStatusChange, onDelete }) => {
  const [draggedPostIds, setDraggedPostIds] = useState<string[] | null>(null);

  const handleDragStart = (e: React.DragEvent, post: any) => {
    setDraggedPostIds(post.ids);
    e.dataTransfer.setData('postIds', JSON.stringify(post.ids));
    e.dataTransfer.setData('currentStatus', post.status);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PostStatus) => {
    e.preventDefault();
    const idsJson = e.dataTransfer.getData('postIds');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    if (!idsJson) return;

    const ids = JSON.parse(idsJson);

    // --- Client Workflow Restrictions ---
    // Fix: Check if role starts with 'client' instead of checking equality to 'client' string which doesn't exist in UserRole type
    if (user.role.startsWith('client')) {
        if (targetStatus === 'Scheduled' || targetStatus === 'Published') {
            alert("Only your agency can schedule or publish posts.");
            setDraggedPostIds(null);
            return;
        }
        if (targetStatus === 'Draft') {
             alert("You cannot move posts back to Draft. Please request changes instead.");
             setDraggedPostIds(null);
             return;
        }
        if (targetStatus === 'In Review' && currentStatus === 'Approved') {
            const feedback = prompt("Please describe the changes needed to move this back to review:");
            if (!feedback || feedback.trim() === "") {
                setDraggedPostIds(null);
                return; 
            }
            onStatusChange(ids, targetStatus, feedback);
            setDraggedPostIds(null);
            return;
        }
    }

    onStatusChange(ids, targetStatus);
    setDraggedPostIds(null);
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'Draft': return 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30';
      case 'In Review': return 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10';
      case 'Approved': return 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10';
      case 'Scheduled': return 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/10';
      case 'Published': return 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/10';
      default: return 'border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="flex overflow-x-auto pb-4 gap-3 md:gap-4 h-[calc(100vh-180px)] short:h-[calc(100vh-100px)] min-w-full snap-x snap-mandatory px-4 md:px-0 no-scrollbar">
      {STATUS_FLOW.map((status) => {
        const columnPosts = posts.filter(p => p.status === status);
        
        return (
          <div 
            key={status}
            className={`flex-shrink-0 w-[85vw] md:w-80 flex flex-col rounded-xl border ${getStatusColor(status)} transition-colors snap-center`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="p-3 short:p-2 font-semibold text-sm flex justify-between items-center text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 rounded-t-xl border-b border-gray-100 dark:border-gray-700 backdrop-blur-sm sticky top-0 z-10">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                    status === 'Draft' ? 'bg-gray-400' :
                    status === 'In Review' ? 'bg-amber-400' :
                    status === 'Approved' ? 'bg-green-500' :
                    status === 'Scheduled' ? 'bg-blue-500' : 'bg-indigo-600'
                }`} />
                {status}
              </span>
              <span className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs border border-gray-100 dark:border-gray-600 shadow-sm">
                {columnPosts.length}
              </span>
            </div>

            <div className="flex-grow overflow-y-auto p-2 space-y-3 scrollbar-thin">
               {columnPosts.map(post => (
                 <div
                    key={post.ids[0]}
                    draggable
                    onDragStart={(e) => handleDragStart(e, post)}
                    className="cursor-pointer active:scale-[0.98] transition-transform touch-manipulation animate-slide-in relative group"
                    onClick={() => onPostClick(post)}
                 >
                    <div className="pointer-events-none">
                        <PostCard 
                            post={post} 
                            user={user} 
                            compact 
                            onStatusChange={onStatusChange} 
                        />
                    </div>
                 </div>
               ))}
               {columnPosts.length === 0 && (
                   <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-lg flex items-center justify-center text-gray-400 text-xs italic mx-1 my-2">
                       Drop here
                   </div>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
