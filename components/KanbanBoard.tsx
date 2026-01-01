
import React, { useState } from 'react';
import { Post, PostStatus, STATUS_FLOW, UserRole } from '../types';
import { PostCard } from './PostCard';
import { MoreHorizontal } from 'lucide-react';

interface KanbanBoardProps {
  posts: Post[];
  role: UserRole;
  onPostClick: (post: Post) => void;
  onStatusChange: (id: string, status: PostStatus, feedback?: string) => void;
  onDelete: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ posts, role, onPostClick, onStatusChange, onDelete }) => {
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    setDraggedPostId(postId);
    e.dataTransfer.setData('postId', postId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PostStatus) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('postId');
    if (!postId) return;

    const post = posts.find(p => p.id === postId);
    if (!post) {
        setDraggedPostId(null);
        return;
    }

    // --- Client Workflow Restrictions ---
    if (role === 'client') {
        // 1. Prevent moving to Scheduled, Published or Draft
        if (targetStatus === 'Scheduled' || targetStatus === 'Published') {
            alert("Only your agency can schedule or publish posts.");
            setDraggedPostId(null);
            return;
        }
        if (targetStatus === 'Draft') {
             alert("You cannot move posts back to Draft. Please request changes instead.");
             setDraggedPostId(null);
             return;
        }

        // 2. Enforce "No change to post = no change in status"
        // If moving FROM Approved TO In Review (Rejection), require feedback
        if (targetStatus === 'In Review' && post.status === 'Approved') {
            const feedback = prompt("Please describe the changes needed to move this back to review:");
            if (!feedback || feedback.trim() === "") {
                // User cancelled or entered nothing - abort status change
                setDraggedPostId(null);
                return; 
            }
            // Proceed with status change AND feedback
            onStatusChange(postId, targetStatus, feedback);
            setDraggedPostId(null);
            return;
        }
    }

    onStatusChange(postId, targetStatus);
    setDraggedPostId(null);
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
    <div className="flex overflow-x-auto pb-4 gap-3 md:gap-4 h-[calc(100vh-180px)] min-w-full snap-x snap-mandatory px-4 md:px-0 no-scrollbar">
      {STATUS_FLOW.map((status) => {
        const columnPosts = posts.filter(p => p.status === status);
        
        return (
          <div 
            key={status}
            className={`flex-shrink-0 w-[85vw] md:w-80 flex flex-col rounded-xl border ${getStatusColor(status)} transition-colors snap-center`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className="p-3 font-semibold text-sm flex justify-between items-center text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 rounded-t-xl border-b border-gray-100 dark:border-gray-700 backdrop-blur-sm sticky top-0 z-10">
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

            {/* Drop Zone / List */}
            <div className="flex-grow overflow-y-auto p-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
               {columnPosts.map(post => (
                 <div
                    key={post.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, post.id)}
                    className="cursor-pointer active:scale-[0.98] transition-transform touch-manipulation animate-slide-in relative group"
                    onClick={() => onPostClick(post)}
                 >
                    <div className="pointer-events-none">
                        <PostCard 
                            post={post} 
                            role={role} 
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
