
import React from 'react';
import { Post, Platform } from '../types';
import { X, Calendar, AlertCircle, CheckCircle2, ArrowRight, Instagram, Linkedin, Twitter, Facebook, Video, Briefcase } from 'lucide-react';

interface DailyBriefingProps {
  posts: Post[];
  onClose: () => void;
}

const SwaveLogo = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M75 35L55 23.45V31.15L68.3 38.85L45 52.3V44.6L25 56.15V67.7L45 79.25V71.55L31.7 63.85L55 50.4V58.1L75 46.55V35Z" fill="white" fillOpacity="0.9" />
  </svg>
);

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

  const publishingToday = posts.filter(p => p.status === 'Scheduled' && p.date.split(' ')[0] === todayStr);
  const inReview = posts.filter(p => p.status === 'In Review');
  const drafts = posts.filter(p => p.status === 'Draft');

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-orange-100 dark:border-gray-700 animate-in slide-in-from-bottom-8 duration-300">
        
        <div className="bg-gradient-to-r from-swave-orange to-swave-purple p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <SwaveLogo className="w-32 h-32 transform translate-x-8 -translate-y-8" />
            </div>
            <h2 className="text-2xl font-bold relative z-10 flex items-center gap-2">
                Good Morning Swave Social! <span className="text-2xl">👋</span>
            </h2>
            <p className="text-orange-100 mt-1 relative z-10 font-medium">{dateDisplay}</p>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
                            <div key={post.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-sm">
                                        <PlatformIcon platform={post.platform} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{post.client}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{post.caption.substring(0, 40)}...</p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold bg-white dark:bg-gray-800 text-swave-orange px-2 py-1 rounded">
                                    {post.date.split(' ')[1] || 'All Day'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Action Required
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-bold text-swave-orange dark:text-orange-400 mb-1">{inReview.length}</span>
                        <span className="text-xs font-medium text-orange-800 dark:text-orange-300">Posts In Review</span>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-bold text-swave-purple dark:text-purple-300 mb-1">{drafts.length}</span>
                        <span className="text-xs font-medium text-purple-800 dark:text-purple-300">Active Drafts</span>
                    </div>
                </div>
            </div>

        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-swave-orange text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
            >
                Let's get to work <ArrowRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};
