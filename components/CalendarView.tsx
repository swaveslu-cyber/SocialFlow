
import React, { useState, useEffect } from 'react';
import { Post, PostStatus } from '../types';
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Instagram, Linkedin, Facebook, Video, X 
} from 'lucide-react';

interface CalendarViewProps {
  posts: any[];
  onPostClick: (post: any) => void;
  onToggleFocus?: (focused: boolean) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ posts, onPostClick, onToggleFocus }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFocused, setIsFocused] = useState(false);

  // Manage body overflow when focused to prevent double scrolling
  useEffect(() => {
      if (isFocused) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = '';
      }
      return () => { document.body.style.overflow = ''; };
  }, [isFocused]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Standard Mon-Sun grid logic (Mon=0, Sun=6 for visual grid)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Ensure reasonable grid size defaults
  const totalSlots = startOffset + daysInMonth;
  const totalRows = Math.ceil(totalSlots / 7) || 5; 
  const displayRows = totalRows < 5 ? 5 : totalRows;

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const toggleFocus = () => {
      const newState = !isFocused;
      setIsFocused(newState);
      if (onToggleFocus) onToggleFocus(newState);
  };

  const getDayPosts = (day: number) => {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    
    return posts.filter(p => {
        if (!p || !p.date) return false;
        try {
            const postDate = p.date.split(' ')[0];
            return postDate === dateStr;
        } catch (e) {
            return false;
        }
    });
  };

  const PlatformIcon = ({ platform, className }: { platform: string, className?: string }) => {
    const cn = className || "w-3 h-3 text-white";
    switch (platform) {
        case 'Instagram': return <Instagram className={cn} />;
        case 'LinkedIn': return <Linkedin className={cn} />;
        case 'X': return <X className={cn} />;
        case 'Twitter': return <X className={cn} />; // Legacy
        case 'Facebook': return <Facebook className={cn} />;
        case 'TikTok': return <Video className={cn} />;
        default: return null;
    }
  };

  // Minimalist solid colors without borders for cleaner look at small size
  const getEventStyle = (status: PostStatus) => {
     switch(status) {
         case 'Approved': return 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-none'; 
         case 'Scheduled': return 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-200 dark:shadow-none'; 
         case 'Published': return 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-200 dark:shadow-none'; 
         case 'In Review': return 'bg-amber-500 text-white hover:bg-amber-400 shadow-sm shadow-amber-200 dark:shadow-none'; 
         case 'Draft': return 'bg-gray-500 text-white hover:bg-gray-400'; 
         case 'Trashed': return 'bg-red-500 text-white opacity-60 decoration-line-through';
         default: return 'bg-gray-500 text-white';
     }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in flex flex-col h-full transition-all duration-300 ${isFocused ? 'fixed inset-0 z-[100] rounded-none border-0' : ''}`}>
        {/* Header - Compact */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 z-20 shadow-sm">
             <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                <div className="flex items-center gap-4 min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none truncate">
                        {monthNames[currentDate.getMonth()]} 
                        <span className="text-gray-400 font-medium ml-2">{currentDate.getFullYear()}</span>
                    </h2>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:block shrink-0">
                        Monthly View
                    </div>
                </div>
             </div>
             <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                    <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all"><ChevronLeft className="w-4 h-4"/></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all">Today</button>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all"><ChevronRight className="w-4 h-4"/></button>
                </div>
                {onToggleFocus && (
                    <button onClick={toggleFocus} className="p-2 bg-swave-orange/10 text-swave-orange hover:bg-swave-orange hover:text-white rounded-xl transition-all" title={isFocused ? "Exit Full Screen" : "Full Screen"}>
                        {isFocused ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                )}
             </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0 z-10">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="py-3 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                    {d}
                </div>
            ))}
        </div>

        {/* Calendar Grid - Flex Grow + h-0 forces it to fit container without parent scrollbar */}
        <div className="flex-grow grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-200 dark:bg-gray-800 gap-px h-0 min-h-0"
             style={{ gridTemplateRows: `repeat(${displayRows}, minmax(0, 1fr))` }}
        >
            {/* Empty cells for previous month padding */}
            {[...Array(startOffset)].map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-50/30 dark:bg-gray-900/90" />
            ))}

            {/* Actual Days */}
            {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dayPosts = getDayPosts(day);
                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                
                return (
                    <div key={day} className={`bg-white dark:bg-gray-900 flex flex-col relative transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 min-h-0 group overflow-hidden`}>
                        {/* Day Number Header - No absolute positioning to avoid overlap on scroll */}
                        <div className="flex justify-end p-2 shrink-0 z-10">
                            <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-swave-purple text-white shadow-md scale-110' : 'text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
                                {day}
                            </span>
                        </div>

                        {/* Events List - Internal Scroll if needed */}
                        <div className="flex-grow flex flex-col gap-1.5 overflow-y-auto custom-scrollbar px-2 pb-2">
                            {dayPosts.map(post => (
                                <div 
                                    key={post.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPostClick(post);
                                    }}
                                    className={`
                                        w-full px-2.5 py-2 rounded-lg cursor-pointer transition-all hover:brightness-110 hover:translate-x-0.5
                                        flex items-center gap-2 overflow-hidden shrink-0 shadow-sm
                                        ${getEventStyle(post.status)}
                                    `}
                                    title={`${post.client}: ${post.caption}`}
                                >
                                    <PlatformIcon platform={post.platform} className="w-3.5 h-3.5 flex-shrink-0 opacity-95" />
                                    
                                    {/* Text */}
                                    <span className="text-[10px] font-bold uppercase tracking-wide truncate leading-none text-white/95 flex-grow">
                                        {post.client}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            
            {/* Fill remaining cells */}
            {[...Array(42 - startOffset - daysInMonth)].map((_, i) => (
                 <div key={`end-empty-${i}`} className="bg-gray-50/30 dark:bg-gray-900/90" />
            ))}
        </div>
    </div>
  );
};
