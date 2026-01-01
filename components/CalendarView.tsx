
import React, { useState } from 'react';
import { Post } from '../types';
import { ChevronLeft, ChevronRight, Instagram, Linkedin, Twitter, Facebook, Video } from 'lucide-react';

interface CalendarViewProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'Instagram': return <Instagram className="w-3 h-3 flex-shrink-0" />;
    case 'LinkedIn': return <Linkedin className="w-3 h-3 flex-shrink-0" />;
    case 'Twitter': return <Twitter className="w-3 h-3 flex-shrink-0" />;
    case 'Facebook': return <Facebook className="w-3 h-3 flex-shrink-0" />;
    case 'TikTok': return <Video className="w-3 h-3 flex-shrink-0" />;
    default: return null;
  }
};

export const CalendarView: React.FC<CalendarViewProps> = ({ posts, onPostClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayPosts = (day: number) => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${currentDate.getFullYear()}-${month}-${dayStr}`;
    
    return posts.filter(p => {
        // Compare only the YYYY-MM-DD part, ignoring time if present
        const postDate = p.date.split(' ')[0];
        return postDate === dateStr;
    });
  };

  const getStatusStyles = (status: string) => {
     switch(status) {
         case 'Approved': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800';
         case 'Rejected': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800';
         case 'Pending Approval': return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800';
         default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
     }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {monthNames[currentDate.getMonth()]} 
                <span className="text-gray-400 font-normal">{currentDate.getFullYear()}</span>
             </h2>
             <div className="flex gap-1">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"><ChevronRight className="w-5 h-5"/></button>
             </div>
        </div>

        {/* Scrollable Container for Grid */}
        <div className="flex-grow overflow-auto no-scrollbar relative">
            <div className="min-w-[700px] h-full flex flex-col">
                {/* Grid Header */}
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 dark:bg-gray-700 gap-px border-b border-gray-200 dark:border-gray-700 flex-grow">
                    {/* Padding for previous month */}
                    {[...Array(firstDayOfMonth)].map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white/50 dark:bg-gray-800/50 min-h-[100px] p-2" />
                    ))}

                    {/* Days */}
                    {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const dayPosts = getDayPosts(day);
                        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                        
                        return (
                            <div key={day} className={`bg-white dark:bg-gray-800 min-h-[100px] p-2 hover:bg-gray-50/80 dark:hover:bg-gray-750 transition-colors flex flex-col gap-1`}>
                                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
                                    {day}
                                </div>
                                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600">
                                    {dayPosts.map(post => (
                                        <div 
                                            key={post.id}
                                            onClick={(e) => {
                                            e.stopPropagation();
                                            onPostClick(post);
                                            }}
                                            title={`${post.client} - ${post.platform}\n${post.caption}`}
                                            className={`group flex items-center gap-1.5 p-1.5 rounded border text-[10px] leading-tight cursor-pointer transition-shadow shadow-sm hover:shadow-md ${getStatusStyles(post.status)}`}
                                        >
                                            <PlatformIcon platform={post.platform} />
                                            <div className="flex flex-col overflow-hidden w-full">
                                                <span className="font-bold truncate opacity-90">{post.client}</span>
                                                <span className="truncate opacity-75 font-medium">{post.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};
