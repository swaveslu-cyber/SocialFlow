
import React, { useState } from 'react';
import { Post } from '../types';
import { ChevronLeft, ChevronRight, Instagram, Linkedin, Twitter, Facebook, Video } from 'lucide-react';

interface CalendarViewProps {
  posts: any[];
  onPostClick: (post: any) => void;
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
        const postDate = p.date.split(' ')[0];
        return postDate === dateStr;
    });
  };

  const getStatusStyles = (status: string) => {
     switch(status) {
         case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
         case 'Scheduled': return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
         case 'In Review': return 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
         case 'Published': return 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
         default: return 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
     }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
             <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {monthNames[currentDate.getMonth()]} 
                    <span className="text-gray-400 font-medium ml-2">{currentDate.getFullYear()}</span>
                </h2>
             </div>
             <div className="flex gap-2">
                <button onClick={prevMonth} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 transition-colors border border-gray-100 dark:border-gray-600"><ChevronLeft className="w-5 h-5"/></button>
                <button onClick={nextMonth} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 transition-colors border border-gray-100 dark:border-gray-600"><ChevronRight className="w-5 h-5"/></button>
             </div>
        </div>

        <div className="flex-grow overflow-auto no-scrollbar relative bg-white dark:bg-gray-900">
            <div className="min-w-[800px] h-full flex flex-col">
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 dark:bg-gray-700 gap-px border-b border-gray-200 dark:border-gray-700 flex-grow">
                    {[...Array(firstDayOfMonth)].map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white dark:bg-gray-900 min-h-[150px] p-2" />
                    ))}

                    {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const dayPosts = getDayPosts(day);
                        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                        
                        return (
                            <div key={day} className={`bg-white dark:bg-gray-900 min-h-[150px] p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors flex flex-col gap-2 group relative`}>
                                <div className="flex justify-end">
                                    <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-swave-orange text-white shadow-lg scale-110' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                        {day}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
                                    {dayPosts.map(post => (
                                        <div 
                                            key={post.ids[0]}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPostClick(post);
                                            }}
                                            className={`group/card flex flex-col gap-1 p-2.5 rounded-xl border text-[11px] leading-tight cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md ${getStatusStyles(post.status)}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-black truncate opacity-90">{post.client}</span>
                                                <div className="flex gap-1 opacity-70">
                                                    {post.platforms.map((p: string) => (
                                                      <React.Fragment key={p}>
                                                        <PlatformIcon platform={p} />
                                                      </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="font-medium opacity-75 truncate">
                                                {post.status}
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
