
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { X, Printer, Loader2, BookOpen } from 'lucide-react';
import { SwaveLogo } from './Logo';

interface ServiceGuideProps {
  onClose: () => void;
}

export const ServiceGuide: React.FC<ServiceGuideProps> = ({ onClose }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      const content = await db.getRateCard();
      setHtmlContent(content || "<div class='text-center p-8 text-gray-500'>Service Guide content is not yet configured. Please contact the agency.</div>");
      setLoading(false);
    };
    loadContent();
  }, []);

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-1.5 border border-gray-100 dark:border-gray-700">
                    <SwaveLogo />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Service Guide</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Plans & Policies</p>
                 </div>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => window.print()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors" title="Print">
                    <Printer className="w-5 h-5" />
                 </button>
                 <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors">
                    <X className="w-6 h-6" />
                 </button>
             </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 md:p-12 bg-white dark:bg-gray-900 custom-prose-wrapper">
             {loading ? (
                 <div className="flex h-full items-center justify-center">
                     <Loader2 className="w-10 h-10 animate-spin text-swave-purple" />
                 </div>
             ) : (
                 <div 
                    className="prose dark:prose-invert max-w-none prose-headings:font-black prose-a:text-swave-purple"
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                 />
             )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-center text-xs text-gray-400 font-medium">
             Current as of {new Date().getFullYear()} • Confidential Client Document
        </div>

      </div>
    </div>
  );
};
