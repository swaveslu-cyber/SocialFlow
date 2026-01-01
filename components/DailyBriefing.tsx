
import React from 'react';
import { Post, Platform } from '../types';
import { X, Calendar, AlertCircle, CheckCircle2, ArrowRight, Instagram, Linkedin, Twitter, Facebook, Video, Briefcase } from 'lucide-react';

interface DailyBriefingProps {
  posts: Post[];
  onClose: () => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'Instagram': return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
    case 'LinkedIn': return <Linkedin className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />;
    case 'Twitter': return <Twitter className="w-3.5 h-3.5 text-blue-400" />;
    case 'Facebook': return <Facebook className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />;
    case 'TikTok': return <Video className="w-3.5 h-3.5 text-black dark:text-white" />;
    default: return null;
  }
};

export const DailyBriefing: React.FC<DailyBriefingProps> = ({ posts, onClose }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const dateDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // 1. Posts Scheduled for Today (Comparing Date Part Only)
  const publishingToday = posts.filter(p => p.status === 'Scheduled' && p.date.split(' ')[0] === todayStr);

  // 2. Action Items (In Review needs approval/edits, Drafts need work)
  const inReview = posts.filter(p => p.status === 'In Review');
  const drafts = posts.filter(p => p.status === 'Draft');

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-indigo-100 dark:border-gray-700 animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Briefcase className="w-32 h-32 transform translate-x-8 -translate-y-8" />
            </div>
            <h2 className="text-2xl font-bold relative z-10 flex items-center gap-2">
                Good Morning! <span className="text-2xl">👋</span>
            </h2>
            <p className="text-indigo-100 mt-1 relative z-10 font-medium">{dateDisplay}</p>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* Section 1: Publishing Today */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Publishing Today
                </h3>
                
                {publishingToday.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500">Nothing scheduled for today.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {publishingToday.map(post => (
                            <div key={post.id} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-sm">
                                        <PlatformIcon platform={post.platform} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{post.client}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{post.caption.substring(0, 40)}...</p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold bg-white dark:bg-gray-800 text-indigo-600 px-2 py-1 rounded">
                                    {post.date.split(' ')[1] || 'All Day'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section 2: Needs Attention */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Action Required
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">{inReview.length}</span>
                        <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Posts In Review</span>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-1">{drafts.length}</span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Drafts</span>
                    </div>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
            >
                Let's get to work <ArrowRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};
