
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { db } from '../services/db';
import { Lock, Briefcase, Users, ChevronRight, KeyRound, Loader2, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';

interface LoginProps {
  clients: string[];
  onLogin: (role: UserRole, clientName?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ clients, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'agency' | 'client'>('agency');
  const [password, setPassword] = useState('');
  
  // Client state
  const [selectedClient, setSelectedClient] = useState(clients[0] || '');
  const [clientAccessCode, setClientAccessCode] = useState('');
  
  // Reset State
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
    
    if (!selectedClient) {
        setError("Please select a valid client.");
        return;
    }
    if (!clientAccessCode) {
        setError("Please enter your Access Code.");
        return;
    }

    setIsLoading(true);
    try {
      const isValid = await db.verifyClientLogin(selectedClient, clientAccessCode);
      if (isValid) {
          onLogin('client', selectedClient);
      } else {
          setError("Invalid Access Code for this client.");
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
          // We pass the "answer" as the key
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-indigo-600 dark:bg-indigo-700 p-8 text-center transition-colors relative overflow-hidden">
           <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm z-10 relative">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white relative z-10">SocialFlow</h2>
          <p className="text-indigo-100 mt-2 relative z-10">{isResetting ? 'Recover Access' : 'Workspace Access'}</p>
          
          {/* Decorative background circle */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-12 -left-12 w-24 h-24 bg-indigo-500/50 rounded-full blur-xl"></div>
        </div>

        {isResetting ? (
             <div className="p-8">
                 <button onClick={() => setIsResetting(false)} className="mb-6 flex items-center text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors">
                     <ArrowLeft className="w-4 h-4 mr-1"/> Back to Login
                 </button>
                 
                 <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800/50">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase mb-1 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3"/> Security Question
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                            {securityQuestion}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Answer</label>
                        <input
                            type="password"
                            className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Enter the answer..."
                            value={recoveryAnswer}
                            onChange={(e) => { setRecoveryAnswer(e.target.value); setError(''); }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <input
                            type="password"
                            className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Set new password"
                            value={newResetPassword}
                            onChange={(e) => { setNewResetPassword(e.target.value); setError(''); }}
                        />
                    </div>
                    
                    {error && (
                        <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800 animate-in fade-in">
                        {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !recoveryAnswer || !newResetPassword}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <>Reset Password <RefreshCw className="w-4 h-4" /></>}
                    </button>
                 </form>
             </div>
        ) : (
            <>
                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => { setActiveTab('agency'); setError(''); }}
                    className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${
                    activeTab === 'agency' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    <Briefcase className="w-4 h-4" />
                    Agency Login
                    {activeTab === 'agency' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 mx-8 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => { setActiveTab('client'); setError(''); }}
                    className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${
                    activeTab === 'client' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Client Portal
                    {activeTab === 'client' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 mx-8 rounded-t-full"></div>}
                </button>
                </div>

                {/* Form Body */}
                <div className="p-8">
                {activeTab === 'agency' ? (
                    <form onSubmit={handleAgencyLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agency Password</label>
                        <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                        />
                        </div>
                        <div className="flex justify-end mt-2">
                             <button type="button" onClick={() => setIsResetting(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Forgot Password?</button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800 animate-in fade-in">
                        {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-70 shadow-md hover:shadow-lg transform active:scale-[0.99]"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <>Access Dashboard <ChevronRight className="w-4 h-4" /></>}
                    </button>
                    </form>
                ) : (
                    <form onSubmit={handleClientLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Organization</label>
                        <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        >
                        {clients.length === 0 ? <option>No Clients Configured</option> : clients.map(client => (
                            <option key={client} value={client}>{client}</option>
                        ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Code</label>
                        <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder="e.g. 1234"
                            value={clientAccessCode}
                            onChange={(e) => {
                                setClientAccessCode(e.target.value);
                                setError('');
                            }}
                        />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Ask your agency manager for your code.</p>
                    </div>
                    
                    {error && (
                        <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800 animate-in fade-in">
                        {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={clients.length === 0 || isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-[0.99]"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <>Enter Portal <ChevronRight className="w-4 h-4" /></>}
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
