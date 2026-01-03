
import React from 'react';
import { BrandKit } from '../types';
import { Palette, X, Link as LinkIcon, Volume2, Users, FileText, Globe, CheckCircle } from 'lucide-react';

interface BrandCardProps {
  kit: BrandKit;
  onClose: () => void;
  onEdit: () => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({ kit, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"><X className="w-6 h-6"/></button>
        
        {/* Left Side: Visual Identity */}
        <div className="w-full md:w-1/3 bg-gray-950 text-white p-8 flex flex-col relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ background: `linear-gradient(135deg, ${kit.visual_identity.colors.primary}, ${kit.visual_identity.colors.secondary})` }}></div>
            
            <div className="relative z-10 flex-grow">
                <div className="mb-8">
                    {kit.visual_identity.logo_dark ? (
                        <img src={kit.visual_identity.logo_dark} alt="Logo" className="w-32 h-auto object-contain mb-4" />
                    ) : (
                        <h2 className="text-3xl font-black tracking-tighter uppercase mb-4">{kit.company_details.name}</h2>
                    )}
                    <a href={kit.company_details.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <Globe className="w-4 h-4" /> {new URL(kit.company_details.website).hostname}
                    </a>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Color Palette</h4>
                        <div className="flex flex-col gap-3">
                            {[
                                { l: 'Primary', c: kit.visual_identity.colors.primary },
                                { l: 'Secondary', c: kit.visual_identity.colors.secondary },
                                { l: 'Accent', c: kit.visual_identity.colors.accent }
                            ].map((col) => (
                                <div key={col.l} className="flex items-center gap-3 group cursor-pointer" onClick={() => navigator.clipboard.writeText(col.c)}>
                                    <div className="w-10 h-10 rounded-xl shadow-lg border border-white/10" style={{ backgroundColor: col.c }}></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-300">{col.l}</p>
                                        <p className="text-xs font-mono text-gray-500 group-hover:text-white transition-colors">{col.c}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Typography</h4>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-lg font-medium leading-none">{kit.visual_identity.font_names}</p>
                            <p className="text-xs text-gray-500 mt-2">Aa Bb Cc 123</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 pt-6 mt-auto border-t border-white/10">
                <button onClick={onEdit} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Edit Brand Kit</button>
            </div>
        </div>

        {/* Right Side: Strategy & Voice */}
        <div className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-xl mx-auto space-y-8">
                
                {/* Header */}
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Brand Bible</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{kit.company_details.one_liner}</p>
                </div>

                {/* Voice Matrix */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white mb-6">
                        <Volume2 className="w-4 h-4 text-swave-purple" /> Voice Matrix
                    </h4>
                    <div className="space-y-5">
                        {[
                            { l: 'Formal', r: 'Casual', v: kit.brand_voice.formal_casual },
                            { l: 'Exclusive', r: 'Inclusive', v: kit.brand_voice.exclusive_inclusive },
                            { l: 'Informative', r: 'Entertaining', v: kit.brand_voice.informative_entertaining },
                            { l: 'Soft', r: 'Bold', v: kit.brand_voice.soft_bold },
                        ].map((metric) => (
                            <div key={metric.l} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span>{metric.l}</span>
                                    <span>{metric.r}</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                    <div 
                                        className="absolute top-0 bottom-0 w-4 h-4 bg-gradient-to-r from-swave-purple to-swave-orange rounded-full shadow-md transform -translate-x-1/2 -translate-y-1" 
                                        style={{ left: `${(metric.v / 10) * 100}%`, top: '50%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {kit.brand_voice.restricted_words.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Do Not Say</p>
                            <div className="flex flex-wrap gap-2">
                                {kit.brand_voice.restricted_words.map(w => (
                                    <span key={w} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg strike-through decoration-red-500/50">{w}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white mb-4">
                            <Users className="w-4 h-4 text-swave-orange" /> The Avatar
                        </h4>
                        <ul className="space-y-3">
                            <li className="text-xs"><span className="font-bold text-gray-500 block mb-0.5">Age</span> {kit.target_audience.age_brackets.join(', ')}</li>
                            <li className="text-xs"><span className="font-bold text-gray-500 block mb-0.5">Gender</span> {kit.target_audience.gender_focus}</li>
                            <li className="text-xs"><span className="font-bold text-gray-500 block mb-0.5">Location</span> {kit.target_audience.geo_focus}</li>
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
                        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white mb-4">
                            <FileText className="w-4 h-4 text-blue-500" /> Psychology
                        </h4>
                        <div className="space-y-4 flex-grow">
                            <div>
                                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Pain Point</span>
                                <p className="text-xs mt-1 text-gray-700 dark:text-gray-300 italic">"{kit.target_audience.pain_point}"</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Motivation</span>
                                <p className="text-xs mt-1 text-gray-700 dark:text-gray-300 italic">"{kit.target_audience.motivation}"</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platforms */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                     <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white mb-4">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Platform Access
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {['Meta', 'LinkedIn', 'TikTok', 'Google'].map(p => {
                            const isInvited = kit.access_status[`${p.toLowerCase()}_invited` as keyof typeof kit.access_status];
                            return (
                                <div key={p} className={`flex items-center gap-2 p-3 rounded-xl border ${isInvited ? 'border-emerald-100 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-800' : 'border-gray-100 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 opacity-50'}`}>
                                    <div className={`w-2 h-2 rounded-full ${isInvited ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{p}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
