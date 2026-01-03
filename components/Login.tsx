
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { SwaveLogo } from './Logo';
import { Lock, ChevronRight, Loader2, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = await db.authenticate(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Default admin is admin@swave.agency / admin123');
      }
    } catch (err) {
      setError('System error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4 transition-colors relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-swave-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-swave-purple/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 relative z-10 border border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-br from-swave-purple via-swave-purple to-swave-orange p-10 text-center transition-colors relative overflow-hidden">
           <div className="bg-white p-4 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 z-10 relative shadow-2xl transform hover:scale-105 transition-transform">
            <SwaveLogo className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-bold text-white relative z-10 tracking-tight">Swave Social</h2>
          <p className="text-white/80 mt-2 relative z-10 font-semibold uppercase tracking-[0.2em] text-[10px]">Unified Workspace Access</p>
          
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
                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-swave-purple focus:border-swave-purple transition-all outline-none"
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
                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-swave-orange focus:border-swave-orange transition-all outline-none"
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
                Protected by Swave Guard&trade; 2.0 Security
            </p>
        </div>
      </div>
    </div>
  );
};
