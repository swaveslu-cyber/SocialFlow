import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { X, Printer, Loader2, BookOpen } from 'lucide-react';
import { AppConfig } from '../types';

interface ServiceGuideProps {
  onClose: () => void;
  branding: AppConfig;
}

export const ServiceGuide: React.FC<ServiceGuideProps> = ({ onClose, branding }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const html = await db.getRateCard();
        setContent(html);
      } catch (e) {
        console.error("Failed to load service guide", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-swave-purple/10 rounded-xl">
                    <BookOpen className="w-6 h-6 text-swave-purple" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{branding.agencyName} Services</h2>
                    <p className="text-sm text-gray-500">Official Rate Card & Offerings</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="Print Guide">
                    <Printer className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 md:p-12 bg-white dark:bg-gray-900 custom-scrollbar">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-swave-orange" />
                    <p className="font-bold text-sm uppercase tracking-widest">Loading Guide...</p>
                </div>
            ) : (
                <div className="prose dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-gray-600 dark:prose-p:text-gray-300">
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center text-xs text-gray-400 font-medium shrink-0">
            &copy; {new Date().getFullYear()} {branding.agencyName}. All rights reserved. Confidential.
        </div>
      </div>
    </div>
  );
};