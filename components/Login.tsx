
import React, { useState, useEffect } from 'react';
import { User, AppConfig } from '../types';
import { db } from '../services/db';
import { SwaveLogo } from './Logo';
import { Lock, ChevronRight, Loader2, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  branding?: AppConfig;
}

export const Login: React.FC<LoginProps> = ({ onLogin, branding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localBranding, setLocalBranding] = useState<AppConfig>({ agencyName: 'SWAVE', primaryColor: '#8E3EBB', secondaryColor: '#F27A21' });

  // Load branding independently if not passed (e.g. first load)
  useEffect(() => {
      if (branding) {
          setLocalBranding(branding);
      } else {
          db.getAppConfig().then(setLocalBranding);
      }
  }, [branding]);

  // Apply colors to root for login screen styling
  useEffect(() => {
      document.documentElement.style.setProperty('--color-primary', localBranding.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', localBranding.secondaryColor);
  }, [localBranding]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = await db.authenticate(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError('System error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#050508] p-4 transition-colors relative overflow-hidden">
      {/* Decorative background gradients matching website */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#8E3EBB]/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-50 animate-pulse duration-[10000ms]"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#F27A21]/15 rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-40 animate-pulse duration-[7000ms]"></div>

      {/* Logo Pattern Overlay (Updated to Colored Hexagons) */}
      <div className="absolute inset-0 pointer-events-none z-0">
          <svg className="w-full h-full opacity-30 dark:opacity-40" width="100%" height="100%">
              <defs>
                  <pattern id="hex-pattern" x="0" y="0" width="600" height="600" patternUnits="userSpaceOnUse">
                      {/* Large Purple - Top/Left */}
                      <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" fill="#8E3EBB" opacity="0.6" transform="translate(50, 0) scale(4)"/>
                      {/* Large Orange - Bottom/Center overlap */}
                      <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" fill="#F27A21" opacity="0.6" transform="translate(250, 200) scale(3.5)"/>
                      {/* Purple Outline - Top Right */}
                      <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" stroke="#8E3EBB" strokeWidth="3" fill="none" opacity="0.7" transform="translate(400, 50) scale(3)"/>
                  </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#hex-pattern)" />
          </svg>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-[#09090b] rounded-3xl shadow-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 relative z-10 border border-gray-100 dark:border-white/10">
        <div className="bg-gradient-to-br from-[#8E3EBB] via-[#8E3EBB] to-[#F27A21] p-10 text-center transition-colors relative overflow-hidden">
           <div className="bg-white p-4 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 z-10 relative shadow-2xl transform hover:scale-105 transition-transform overflow-hidden">
            <SwaveLogo className="w-16 h-16" customLogoUrl={localBranding.logoUrl} />
          </div>
          <h2 className="text-3xl font-bold text-white relative z-10 tracking-tight">{localBranding.agencyName}</h2>
          <p className="text-white/80 mt-2 relative z-10 font-semibold uppercase tracking-[0.2em] text-[10px]">Social Growth Agency</p>
          
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-12 -left-12 w-24 h-24 bg-orange-500/20 rounded-full blur-xl"></div>
        </div>

        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-swave-purple transition-colors" />
                </div>
                <input
                    type="email"
                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:ring-2 focus:ring-swave-purple focus:border-swave-purple transition-all outline-none placeholder-gray-500 dark:placeholder-gray-500"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                    }}
                />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-swave-orange transition-colors" />
                </div>
                <input
                    type="password"
                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:ring-2 focus:ring-swave-orange focus:border-swave-orange transition-all outline-none placeholder-gray-500 dark:placeholder-gray-500"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                />
                </div>
            </div>

            {error && (
                <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800 animate-in fade-in">
                {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg hover:shadow-xl transform active:scale-[0.97]"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Sign In <ChevronRight className="w-5 h-5" /></>}
            </button>
            </form>
            
            <p className="mt-8 text-center text-[10px] text-gray-400 font-medium">
                Protected by {localBranding.agencyName} Guard&trade; 2.0 Security
            </p>
        </div>
      </div>
    </div>
  );
};
