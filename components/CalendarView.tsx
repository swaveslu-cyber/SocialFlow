
import React, { useState } from 'react';
import { Post } from '../types';
import { ChevronLeft, ChevronRight, Instagram, Linkedin, Twitter, Facebook, Video, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  posts: any[];
  onPostClick: (post: any) => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'Instagram': return <Instagram className="w-3 h-3" />;
    case 'LinkedIn': return <Linkedin className="w-3 h-3" />;
    case 'Twitter': return <Twitter className="w-3 h-3" />;
    case 'Facebook': return <Facebook className="w-3 h-3" />;
    case 'TikTok': return <Video className="w-3 h-3" />;
    default: return null;
  }
};

export const CalendarView: React.FC<CalendarViewProps> = ({ posts, onPostClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Calculate exact number of rows needed (5 or 6) to distribute height evenly
  const totalSlots = firstDayOfMonth + daysInMonth;
  const totalRows = Math.ceil(totalSlots / 7);

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
        const postDate = p.date.split(' ')[0];
        return postDate === dateStr;
    });
  };

  const getStatusStyles = (status: string) => {
     switch(status) {
         case 'Approved': return 'bg-emerald-50/80 border-l-[3px] border-emerald-500 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-500';
         case 'Scheduled': return 'bg-blue-50/80 border-l-[3px] border-blue-500 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-500';
         case 'In Review': return 'bg-amber-50/80 border-l-[3px] border-amber-500 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-500';
         case 'Published': return 'bg-indigo-50/80 border-l-[3px] border-indigo-500 text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-100 dark:border-indigo-500';
         default: return 'bg-gray-50 border-l-[3px] border-gray-400 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-500';
     }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
             <div className="flex items-center gap-4">
                <div className="bg-swave-orange/10 p-3 rounded-2xl text-swave-orange hidden sm:block">
                    <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                        {monthNames[currentDate.getMonth()]} 
                        <span className="text-gray-400 font-medium ml-2">{currentDate.getFullYear()}</span>
                    </h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Content Schedule</p>
                </div>
             </div>
             <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <button onClick={prevMonth} className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all shadow-sm hover:shadow-md"><ChevronLeft className="w-5 h-5"/></button>
                <div className="w-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                <button onClick={nextMonth} className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all shadow-sm hover:shadow-md"><ChevronRight className="w-5 h-5"/></button>
             </div>
        </div>

        {/* Grid Container */}
        <div className="flex-grow flex flex-col min-h-0 relative bg-white dark:bg-gray-900">
            <div className="h-full flex flex-col min-w-[800px] lg:min-w-0">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days Grid - Uses dynamic rows to fill height exactly */}
                <div 
                    className="grid grid-cols-7 bg-gray-100 dark:bg-gray-800 gap-px border-b border-gray-100 dark:border-gray-800 flex-grow"
                    style={{ gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))` }}
                >
                    {/* Empty cells for previous month */}
                    {[...Array(firstDayOfMonth)].map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-50/30 dark:bg-gray-900/50" />
                    ))}

                    {/* Actual Days */}
                    {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const dayPosts = getDayPosts(day);
                        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                        
                        return (
                            <div key={day} className={`bg-white dark:bg-gray-900 p-2 transition-colors flex flex-col group relative hover:bg-gray-50/50 dark:hover:bg-gray-800/30 overflow-hidden`}>
                                {/* Date Number */}
                                <div className="flex justify-between items-start mb-1 shrink-0">
                                     <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-2xl transition-all ${isToday ? 'bg-swave-orange text-white shadow-lg scale-105' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>
                                        {day}
                                    </span>
                                    {dayPosts.length > 0 && (
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider group-hover:text-swave-purple transition-colors mt-1">
                                            {dayPosts.length}
                                        </span>
                                    )}
                                </div>

                                {/* Posts List - Scrollbar Hidden */}
                                <div className="flex flex-col gap-1 overflow-y-auto flex-1 no-scrollbar pr-0.5">
                                    {dayPosts.map(post => (
                                        <div 
                                            key={post.ids[0]}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPostClick(post);
                                            }}
                                            className={`
                                                relative p-1.5 rounded-lg cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md 
                                                text-[11px] flex flex-col gap-0.5 shrink-0
                                                ${getStatusStyles(post.status)}
                                            `}
                                        >
                                            <div className="flex justify-between items-start gap-1">
                                                <span className="font-bold truncate leading-tight">{post.client}</span>
                                                <div className="flex -space-x-1 shrink-0 opacity-80 scale-90 origin-top-right">
                                                    {post.platforms.map((p: string, idx: number) => (
                                                      <div key={`${p}-${idx}`} className="bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm">
                                                          <PlatformIcon platform={p} />
                                                      </div>
                                                    ))}
                                                </div>
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
