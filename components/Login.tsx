
import React, { useState } from 'react';
import { UserRole } from '../types';
import { db } from '../services/db';
import { Lock, Briefcase, Users, ChevronRight, KeyRound, Loader2 } from 'lucide-react';

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
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="bg-indigo-600 dark:bg-indigo-700 p-8 text-center transition-colors">
           <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">SocialFlow</h2>
          <p className="text-indigo-100 mt-2">Workspace Access</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => { setActiveTab('agency'); setError(''); }}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'agency' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Agency Login
          </button>
          <button
             onClick={() => { setActiveTab('client'); setError(''); }}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'client' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Client Portal
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
              </div>

              {error && (
                <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-70"
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
                <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={clients.length === 0 || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <>Enter Portal <ChevronRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
