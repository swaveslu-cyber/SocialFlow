
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { db } from '../services/db';
import { SwaveLogo } from './Logo';
import { Lock, Briefcase, Users, ChevronRight, KeyRound, Loader2, RefreshCw, ArrowLeft, HelpCircle, Building2 } from 'lucide-react';

interface LoginProps {
  clients: string[];
  onLogin: (role: UserRole, clientName?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ clients, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'agency' | 'client'>('agency');
  const [password, setPassword] = useState('');
  
  const [selectedClient, setSelectedClient] = useState('');
  const [clientAccessCode, setClientAccessCode] = useState('');
  
  const [isResetting, setIsResetting] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('Loading question...');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isResetting) {
        const loadQ = async () => {
            const q = await db.getRecoveryQuestion();
            setSecurityQuestion(q);
        };
        loadQ();
    }
  }, [isResetting]);

  const handleAgencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const isValid = await db.verifyAgencyPassword(password);
      if (isValid) {
        onLogin('agency');
      } else {
        setError('Incorrect Password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedClient.trim()) {
        setError("Please enter your Organization Name.");
        return;
    }
    if (!clientAccessCode) {
        setError("Please enter your Access Code.");
        return;
    }

    setIsLoading(true);
    try {
      const isValid = await db.verifyClientLogin(selectedClient.trim(), clientAccessCode);
      if (isValid) {
          onLogin('client', selectedClient.trim());
      } else {
          setError("Invalid Organization or Access Code.");
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      try {
          const success = await db.resetAgencyPassword(recoveryAnswer, newResetPassword);
          if (success) {
              alert("Password reset successfully. Please login with your new password.");
              setIsResetting(false);
              setPassword('');
              setRecoveryAnswer('');
              setNewResetPassword('');
          } else {
              setError("Incorrect Answer.");
          }
      } catch (err) {
          setError("Reset failed. Please try again.");
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
          <p className="text-white/80 mt-2 relative z-10 font-semibold uppercase tracking-[0.2em] text-[10px]">Online Growth Agency</p>
          
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-12 -left-12 w-24 h-24 bg-orange-500/20 rounded-full blur-xl"></div>
        </div>

        {isResetting ? (
             <div className="p-8">
                 <button onClick={() => setIsResetting(false)} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-swave-orange dark:text-gray-400 dark:hover:text-orange-300 transition-colors">
                     <ArrowLeft className="w-4 h-4 mr-1"/> Back to Login
                 </button>
                 
                 <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
                        <p className="text-xs font-bold text-swave-orange dark:text-orange-300 uppercase mb-1 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3"/> Security Question
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                            {securityQuestion}
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Answer</label>
                        <input
                            type="password"
                            className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-swave-orange focus:border-swave-orange transition-all outline-none"
                            placeholder="Enter answer..."
                            value={recoveryAnswer}
                            onChange={(e) => { setRecoveryAnswer(e.target.value); setError(''); }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                        <input
                            type="password"
                            className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-swave-orange focus:border-swave-orange transition-all outline-none"
                            placeholder="Set new password"
                            value={newResetPassword}
                            onChange={(e) => { setNewResetPassword(e.target.value); setError(''); }}
                        />
                    </div>
                    
                    {error && (
                        <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800 animate-in fade-in">
                        {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !recoveryAnswer || !newResetPassword}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-swave-purple to-swave-orange text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Reset Password <RefreshCw className="w-5 h-5" /></>}
                    </button>
                 </form>
             </div>
        ) : (
            <>
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => { setActiveTab('agency'); setError(''); }}
                    className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
                    activeTab === 'agency' ? 'text-swave-orange dark:text-orange-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    <Briefcase className="w-4 h-4" />
                    Agency Login
                    {activeTab === 'agency' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-swave-orange rounded-full shadow-sm"></div>}
                </button>
                <button
                    onClick={() => { setActiveTab('client'); setError(''); }}
                    className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
                    activeTab === 'client' ? 'text-swave-purple dark:text-purple-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Client Portal
                    {activeTab === 'client' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-swave-purple rounded-full shadow-sm"></div>}
                </button>
                </div>

                <div className="p-8">
                {activeTab === 'agency' ? (
                    <form onSubmit={handleAgencyLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Agency Password</label>
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
                        <div className="flex justify-end mt-2">
                             <button type="button" onClick={() => setIsResetting(true)} className="text-xs font-semibold text-swave-orange dark:text-orange-400 hover:underline">Forgot Password?</button>
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
                        className="w-full flex items-center justify-center gap-2 bg-swave-orange hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg hover:shadow-xl transform active:scale-[0.97]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Access Dashboard <ChevronRight className="w-5 h-5" /></>}
                    </button>
                    </form>
                ) : (
                    <form onSubmit={handleClientLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Organization Name</label>
                        <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Building2 className="h-4 w-4 text-gray-400 group-focus-within:text-swave-purple transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-swave-purple focus:border-swave-purple transition-all outline-none"
                            placeholder="Your Company Name"
                            value={selectedClient}
                            onChange={(e) => {
                                setSelectedClient(e.target.value);
                                setError('');
                            }}
                        />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Access Code</label>
                        <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <KeyRound className="h-4 w-4 text-gray-400 group-focus-within:text-swave-purple transition-colors" />
                        </div>
                        <input
                            type="password"
                            className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-swave-purple focus:border-swave-purple transition-all outline-none"
                            placeholder="4-digit code"
                            value={clientAccessCode}
                            onChange={(e) => {
                                setClientAccessCode(e.target.value);
                                setError('');
                            }}
                        />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Contact your agency manager for access.</p>
                    </div>
                    
                    {error && (
                        <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800 animate-in fade-in">
                        {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-swave-purple hover:bg-purple-700 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform active:scale-[0.97]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Enter Portal <ChevronRight className="w-5 h-5" /></>}
                    </button>
                    </form>
                )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};
