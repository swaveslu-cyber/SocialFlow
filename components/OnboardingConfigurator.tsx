
import React, { useState } from 'react';
import { BrandKit, OnboardingConfig } from '../types';
import { db } from '../services/db';
import { Save, X, RotateCcw, Loader2 } from 'lucide-react';

interface OnboardingConfiguratorProps {
  clientName: string;
  existingKit: BrandKit | null;
  onClose: () => void;
  onSave: () => void;
}

export const OnboardingConfigurator: React.FC<OnboardingConfiguratorProps> = ({ clientName, existingKit, onClose, onSave }) => {
  const [config, setConfig] = useState<OnboardingConfig>(existingKit?.custom_questions || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        // Construct a partial kit to save just the config if the kit doesn't exist fully yet
        const kitToSave: BrandKit = existingKit || {
            client_name: clientName,
            company_details: { name: clientName, website: '', industry: 'SaaS', one_liner: '' },
            brand_voice: { formal_casual: 5, exclusive_inclusive: 5, informative_entertaining: 5, soft_bold: 5, restricted_words: [] },
            visual_identity: { colors: { primary: '#000000', secondary: '#ffffff', accent: '#3b82f6' }, font_names: '', aesthetic_links: [] },
            target_audience: { age_brackets: [], gender_focus: 'All', geo_focus: '', pain_point: '', motivation: 'To save time' },
            access_status: { meta_invited: false, linkedin_invited: false, tiktok_invited: false, google_invited: false }
        };

        kitToSave.custom_questions = config;
        
        await db.saveBrandKit(kitToSave);
        onSave();
        onClose();
    } catch (e) {
        console.error(e);
        alert("Failed to save configuration.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleReset = () => {
      if(confirm("Reset all custom questions to default?")) {
          setConfig({});
      }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Configure Onboarding</h3>
                    <p className="text-xs text-gray-500">Customize question wording for {clientName}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500"><X className="w-5 h-5"/></button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-8">
                
                {/* Step 1 Overrides */}
                <div>
                    <h4 className="text-xs font-bold text-swave-purple uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Step 1: Core Identity</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">"One-Liner" Question Label</label>
                            <input 
                                value={config.one_liner_label || ''} 
                                onChange={e => setConfig({...config, one_liner_label: e.target.value})}
                                placeholder="Default: The One-Liner"
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">"One-Liner" Placeholder Hint</label>
                            <textarea 
                                value={config.one_liner_placeholder || ''} 
                                onChange={e => setConfig({...config, one_liner_placeholder: e.target.value})}
                                placeholder="Default: Describe exactly what you sell and to whom..."
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-20"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Voice Slider 1 (Left)</label>
                                <input 
                                    value={config.voice_slider_1_left || ''} 
                                    onChange={e => setConfig({...config, voice_slider_1_left: e.target.value})}
                                    placeholder="Default: Formal"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Voice Slider 1 (Right)</label>
                                <input 
                                    value={config.voice_slider_1_right || ''} 
                                    onChange={e => setConfig({...config, voice_slider_1_right: e.target.value})}
                                    placeholder="Default: Casual"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Step 3 Overrides */}
                <div>
                    <h4 className="text-xs font-bold text-swave-orange uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Step 3: Target Avatar</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">"Pain Point" Question Label</label>
                            <input 
                                value={config.pain_point_label || ''} 
                                onChange={e => setConfig({...config, pain_point_label: e.target.value})}
                                placeholder="Default: Pain Point"
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">"Pain Point" Placeholder Hint</label>
                            <textarea 
                                value={config.pain_point_placeholder || ''} 
                                onChange={e => setConfig({...config, pain_point_placeholder: e.target.value})}
                                placeholder="Default: What keeps them up at night?"
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">"Motivation" Question Label</label>
                            <input 
                                value={config.motivation_label || ''} 
                                onChange={e => setConfig({...config, motivation_label: e.target.value})}
                                placeholder="Default: Motivation"
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <button onClick={handleReset} className="text-gray-400 hover:text-red-500 text-xs font-bold flex items-center gap-1 transition-colors">
                    <RotateCcw className="w-3 h-3"/> Reset Defaults
                </button>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        Save Config
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
