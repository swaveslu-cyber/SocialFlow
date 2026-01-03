
import React, { useState } from 'react';
import { BrandKit } from '../types';
import { db } from '../services/db';
import { storage } from '../services/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowRight, Check, ChevronLeft, UploadCloud, X, Loader2 } from 'lucide-react';

interface OnboardingWizardProps {
  clientName: string;
  existingKit?: BrandKit;
  onComplete: () => void;
  onCancel: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ clientName, existingKit, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load Config
  const customQ = existingKit?.custom_questions || {};

  const [formData, setFormData] = useState<BrandKit>(existingKit || {
    client_name: clientName,
    company_details: { name: clientName, website: '', industry: 'SaaS', one_liner: '' },
    brand_voice: { formal_casual: 5, exclusive_inclusive: 5, informative_entertaining: 5, soft_bold: 5, restricted_words: [] },
    visual_identity: { colors: { primary: '#000000', secondary: '#ffffff', accent: '#3b82f6' }, font_names: '', aesthetic_links: [] },
    target_audience: { age_brackets: [], gender_focus: 'All', geo_focus: '', pain_point: '', motivation: 'To save time' },
    access_status: { meta_invited: false, linkedin_invited: false, tiktok_invited: false, google_invited: false }
  });

  const [tempWord, setTempWord] = useState('');

  const handleFileUpload = async (file: File, type: 'logo_light' | 'logo_dark') => {
      try {
          const storageRef = ref(storage, `brand_assets/${clientName}_${type}_${Date.now()}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          setFormData(prev => ({
              ...prev,
              visual_identity: { ...prev.visual_identity, [type]: url }
          }));
      } catch (e) {
          alert("Upload failed. Please try again.");
      }
  };

  const handleSave = async () => {
      setIsSaving(true);
      try {
          // Preserve custom questions if they exist in state or props
          const finalData = { ...formData, custom_questions: customQ };
          await db.saveBrandKit(finalData);
          
          // Sync key details to the Client Profile table for consistency
          // This ensures correlation between Onboarding responses and the Client Info page
          if (formData.company_details.website) {
              await db.updateClient(clientName, { 
                  // We only pass the fields we want to update.
                  // The updated db.ts logic handles partial updates.
                  website: formData.company_details.website
              });
          }

          onComplete();
      } catch (e) {
          console.error(e);
          alert("Failed to save Brand Kit.");
      } finally {
          setIsSaving(false);
      }
  };

  // --- Step Components ---

  const renderStep1 = () => (
      <div className="space-y-6 animate-in slide-in-from-right-8">
          <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Company Website</label>
              <input value={formData.company_details.website} onChange={e => setFormData({...formData, company_details: {...formData.company_details, website: e.target.value}})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" placeholder="https://..." />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{customQ.one_liner_label || 'The "One-Liner"'}</label>
              <textarea 
                value={formData.company_details.one_liner} 
                onChange={e => setFormData({...formData, company_details: {...formData.company_details, one_liner: e.target.value}})} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" 
                placeholder={customQ.one_liner_placeholder || "Describe exactly what you sell and to whom, in one sentence."} 
                rows={3} 
              />
          </div>
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Voice Parameters</h4>
              {[
                  { k: 'formal_casual', l: customQ.voice_slider_1_left || 'Formal', r: customQ.voice_slider_1_right || 'Casual' },
                  { k: 'exclusive_inclusive', l: customQ.voice_slider_2_left || 'Exclusive', r: customQ.voice_slider_2_right || 'Inclusive' },
                  { k: 'informative_entertaining', l: 'Informative', r: 'Entertaining' },
                  { k: 'soft_bold', l: 'Soft-Spoken', r: 'Bold/Loud' },
              ].map((s) => (
                  <div key={s.k} className="mb-4">
                      <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                          <span>{s.l}</span>
                          <span>{s.r}</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={(formData.brand_voice as any)[s.k]} 
                        onChange={e => setFormData({...formData, brand_voice: {...formData.brand_voice, [s.k]: parseInt(e.target.value)}})}
                        className="w-full accent-swave-purple h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
              ))}
          </div>

          <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Forbidden Words (Press Enter)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                  {formData.brand_voice.restricted_words.map(w => (
                      <span key={w} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1">
                          {w} <button onClick={() => setFormData({...formData, brand_voice: {...formData.brand_voice, restricted_words: formData.brand_voice.restricted_words.filter(rw => rw !== w)}})}><X className="w-3 h-3"/></button>
                      </span>
                  ))}
              </div>
              <input 
                value={tempWord}
                onChange={e => setTempWord(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && tempWord.trim()) {
                        e.preventDefault();
                        setFormData({...formData, brand_voice: {...formData.brand_voice, restricted_words: [...formData.brand_voice.restricted_words, tempWord.trim()]}});
                        setTempWord('');
                    }
                }}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" placeholder="Type word and press Enter..." 
              />
          </div>
      </div>
  );

  const renderStep2 = () => (
      <div className="space-y-8 animate-in slide-in-from-right-8">
          <div className="grid grid-cols-3 gap-4">
              {['primary', 'secondary', 'accent'].map(c => (
                  <div key={c}>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 capitalize">{c} Color</label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                          <input type="color" value={(formData.visual_identity.colors as any)[c]} onChange={e => setFormData({...formData, visual_identity: {...formData.visual_identity, colors: {...formData.visual_identity.colors, [c]: e.target.value}}})} className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"/>
                          <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{(formData.visual_identity.colors as any)[c]}</span>
                      </div>
                  </div>
              ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
              {['logo_light', 'logo_dark'].map((type) => (
                  <div key={type} className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative">
                      {(formData.visual_identity as any)[type] ? (
                          <div className="relative w-full h-24">
                              <img src={(formData.visual_identity as any)[type]} className="w-full h-full object-contain" alt="Logo" />
                              <button onClick={() => setFormData({...formData, visual_identity: {...formData.visual_identity, [type]: undefined}})} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3"/></button>
                          </div>
                      ) : (
                          <>
                              <UploadCloud className="w-8 h-8 text-gray-300 mb-2"/>
                              <p className="text-xs font-bold text-gray-500 uppercase">{type.replace('_', ' ')}</p>
                              <input type="file" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], type as any)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/png,image/svg+xml" />
                          </>
                      )}
                  </div>
              ))}
          </div>

          <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Brand Fonts</label>
              <input value={formData.visual_identity.font_names} onChange={e => setFormData({...formData, visual_identity: {...formData.visual_identity, font_names: e.target.value}})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" placeholder="e.g. Roboto, Montserrat (Google Fonts)" />
          </div>
      </div>
  );

  const renderStep3 = () => (
      <div className="space-y-6 animate-in slide-in-from-right-8">
          <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Age Groups</label>
              <div className="flex flex-wrap gap-2">
                  {['18-24', '25-34', '35-44', '45-54', '55+'].map(age => (
                      <button 
                        key={age}
                        onClick={() => {
                            const current = formData.target_audience.age_brackets;
                            const next = current.includes(age) ? current.filter(a => a !== age) : [...current, age];
                            setFormData({...formData, target_audience: {...formData.target_audience, age_brackets: next}});
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${formData.target_audience.age_brackets.includes(age) ? 'bg-swave-purple text-white border-swave-purple' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
                      >
                          {age}
                      </button>
                  ))}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{customQ.pain_point_label || "Pain Point"}</label>
                  <textarea 
                    value={formData.target_audience.pain_point} 
                    onChange={e => setFormData({...formData, target_audience: {...formData.target_audience, pain_point: e.target.value}})} 
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm" 
                    rows={4} 
                    placeholder={customQ.pain_point_placeholder || "What keeps them up at night?"} 
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{customQ.motivation_label || "Motivation"}</label>
                  <select value={formData.target_audience.motivation} onChange={e => setFormData({...formData, target_audience: {...formData.target_audience, motivation: e.target.value}})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
                      <option>To save time</option>
                      <option>To save money</option>
                      <option>To gain status</option>
                      <option>To feel secure</option>
                      <option>To be entertained</option>
                  </select>
              </div>
          </div>
      </div>
  );

  const renderStep4 = () => (
      <div className="space-y-8 animate-in slide-in-from-right-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
              Please check off the platforms where you have granted <strong>Admin</strong> access to our agency email.
          </div>
          <div className="space-y-3">
              {['Meta', 'LinkedIn', 'TikTok', 'Google'].map(p => {
                  const key = `${p.toLowerCase()}_invited` as keyof typeof formData.access_status;
                  return (
                      <label key={p} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={!!formData.access_status[key]} 
                            onChange={e => setFormData({...formData, access_status: {...formData.access_status, [key]: e.target.checked}})}
                            className="w-5 h-5 rounded border-gray-300 text-swave-purple focus:ring-swave-purple"
                          />
                          <span className="font-bold text-gray-900 dark:text-white">{p} Business Manager</span>
                      </label>
                  );
              })}
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Direct Credentials (Encrypted)</label>
              <textarea 
                value={formData.access_status.manual_credentials} 
                onChange={e => setFormData({...formData, access_status: {...formData.access_status, manual_credentials: e.target.value}})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono" 
                rows={3} 
                placeholder="Platform: Username / Password..." 
              />
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[120] bg-white dark:bg-gray-950 flex flex-col animate-in fade-in duration-300">
        {/* Header */}
        <div className="h-20 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 bg-white dark:bg-gray-950 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"><X className="w-6 h-6"/></button>
                <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Onboarding: <span className="text-swave-purple">{clientName}</span></h2>
            </div>
            <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-colors ${step >= i ? 'bg-swave-purple' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto py-8">
                <h3 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">
                    {step === 1 && "The Core Identity"}
                    {step === 2 && "Visual Assets"}
                    {step === 3 && "The Target Avatar"}
                    {step === 4 && "Operational Access"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">
                    {step === 1 && "Establish the basic facts and the voice of the brand."}
                    {step === 2 && "Centralize logos, colors, and typography."}
                    {step === 3 && "Define who we are talking to."}
                    {step === 4 && "Hand over the keys so we can start building."}
                </p>

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </div>
        </div>

        {/* Footer */}
        <div className="h-24 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 bg-white dark:bg-gray-950 sticky bottom-0 z-20">
            <button 
                onClick={() => step > 1 && setStep(step - 1)}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
            >
                <ChevronLeft className="w-5 h-5"/> Back
            </button>
            <button 
                onClick={() => step < 4 ? setStep(step + 1) : handleSave()}
                disabled={isSaving}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
            >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin"/> : (step === 4 ? "Complete Setup" : "Continue")}
                {!isSaving && step < 4 && <ArrowRight className="w-6 h-6"/>}
                {!isSaving && step === 4 && <Check className="w-6 h-6"/>}
            </button>
        </div>
    </div>
  );
};
