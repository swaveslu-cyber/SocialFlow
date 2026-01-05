
import React, { useState, useMemo } from 'react';
import { Post, Invoice, User, ClientProfile, PERMISSIONS, PLATFORMS, Platform } from '../types';
import { 
  BarChart3, TrendingUp, Users, Calendar, Filter, 
  Download, PieChart, CheckCircle, Clock, AlertCircle, 
  ArrowUpRight, DollarSign, Layers, Printer
} from 'lucide-react';

interface ReportsModuleProps {
  posts: Post[];
  invoices: Invoice[];
  users: User[];
  clients: string[];
  currentUser: User;
}

const StatCard = ({ label, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group print:border-gray-200 print:shadow-none print:break-inside-avoid">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
      <Icon className="w-16 h-16" />
    </div>
    <div className="relative z-10">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 print:text-gray-600">{label}</p>
      <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1 print:text-black">{value}</h3>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 print:text-gray-600">
        {subtext}
      </p>
    </div>
  </div>
);

const ProgressBar = ({ label, value, total, color }: { label: string, value: number, total: number, color: string }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-4 print:break-inside-avoid">
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-gray-700 dark:text-gray-300 print:text-black">{label}</span>
        <span className="text-gray-500 print:text-gray-600">{value} ({percentage}%)</span>
      </div>
      <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden print:bg-gray-200">
        <div className={`h-full rounded-full transition-all duration-500 ${color} print:print-color-adjust-exact`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

export const ReportsModule: React.FC<ReportsModuleProps> = ({ posts, invoices, users, clients, currentUser }) => {
  const [timeRange, setTimeRange] = useState<'30_days' | 'this_month' | 'this_year' | 'all_time'>('30_days');
  const [selectedClient, setSelectedClient] = useState<string>(currentUser.clientId || 'All');
  const [selectedUser, setSelectedUser] = useState<string>('All');

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Epoch for 'all_time'

    if (timeRange === '30_days') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
    } else if (timeRange === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Filter Posts
    const filteredPosts = posts.filter(p => {
      const postDate = new Date(p.date); // or use p.createdAt for creation stats
      const matchesDate = postDate >= startDate;
      const matchesClient = selectedClient === 'All' ? true : p.client === selectedClient;
      
      // Determine user attribution (rough approximation via history or implicit ownership)
      // For this demo, we can match if the user commented or is the author in history
      const matchesUser = selectedUser === 'All' ? true : p.history.some(h => h.by === selectedUser);

      return matchesDate && matchesClient && matchesUser;
    });

    // Filter Invoices (Only applies if viewing All or Specific Client)
    const filteredInvoices = invoices.filter(i => {
      const invDate = new Date(i.issueDate);
      const matchesDate = invDate >= startDate;
      const matchesClient = selectedClient === 'All' ? true : i.clientName === selectedClient;
      return matchesDate && matchesClient;
    });

    return { filteredPosts, filteredInvoices };
  }, [posts, invoices, timeRange, selectedClient, selectedUser]);

  const { filteredPosts, filteredInvoices } = filteredData;

  // --- CALCS ---
  const totalPosts = filteredPosts.length;
  const publishedCount = filteredPosts.filter(p => p.status === 'Published').length;
  const scheduledCount = filteredPosts.filter(p => p.status === 'Scheduled').length;
  const inReviewCount = filteredPosts.filter(p => p.status === 'In Review').length;
  const draftCount = filteredPosts.filter(p => p.status === 'Draft').length;

  const totalRevenue = filteredInvoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + i.grandTotal, 0);
  
  const pipelineValue = filteredInvoices
    .filter(i => i.status === 'Sent' || i.status === 'Draft')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const platformStats = PLATFORMS.map(p => ({
    name: p,
    count: filteredPosts.filter(post => post.platform === p).length,
    color: p === 'Instagram' ? 'bg-pink-500' : p === 'LinkedIn' ? 'bg-blue-700' : p === 'Twitter' ? 'bg-blue-400' : p === 'Facebook' ? 'bg-blue-600' : 'bg-black'
  })).sort((a, b) => b.count - a.count);

  const campaignStats = useMemo(() => {
    const campaigns: Record<string, { total: number, published: number }> = {};
    filteredPosts.forEach(p => {
      const c = p.campaign || 'Unassigned';
      if (!campaigns[c]) campaigns[c] = { total: 0, published: 0 };
      campaigns[c].total++;
      if (p.status === 'Published') campaigns[c].published++;
    });
    return Object.entries(campaigns)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5); // Top 5
  }, [filteredPosts]);

  return (
    <div className="p-6 md:p-8 pb-20 overflow-y-auto h-full animate-in fade-in print:p-0 print:overflow-visible">
      {/* PRINT STYLES */}
      <style>{`
        @media print {
          @page { margin: 10mm; size: landscape; }
          body { background: white !important; }
          
          /* Hide Sidebar, Header, and Filter Controls */
          aside, header, nav, .no-print { display: none !important; }
          
          /* Override layout constraints to allow full page scrolling */
          #root, main { 
            height: auto !important; 
            overflow: visible !important; 
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Ensure Card backgrounds are white and have borders for clarity */
          .bg-white, .dark .bg-gray-800 { 
            background-color: white !important; 
            color: black !important; 
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }
          
          /* Fix text colors for print */
          .text-white, .dark .text-white { color: black !important; }
          .text-gray-500, .dark .text-gray-400 { color: #555 !important; }
          .text-gray-900 { color: black !important; }
          
          /* Force background colors (for charts/progress bars) */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 print:mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white print:text-3xl">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 print:text-gray-600">Performance metrics across content, team, and finance.</p>
        </div>

        <div className="flex flex-wrap gap-3 no-print">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>

          <div className="flex flex-wrap gap-3 p-1.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="p-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-swave-purple outline-none"
            >
                <option value="30_days">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="all_time">All Time</option>
            </select>

            {!currentUser.clientId && (
                <select 
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="p-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-swave-purple outline-none"
                >
                <option value="All">All Clients</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            )}

            {PERMISSIONS.canManageTeam(currentUser.role) && (
                <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="p-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-swave-purple outline-none"
                >
                <option value="All">All Team</option>
                {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
            )}
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 print:grid-cols-4 print:gap-4">
        <StatCard 
          label="Total Content Produced" 
          value={totalPosts} 
          subtext={`${publishedCount} Published / ${scheduledCount} Scheduled`}
          icon={Layers}
          colorClass="text-swave-purple"
        />
        <StatCard 
          label="Production Velocity" 
          value={`${Math.round(totalPosts / 4)}/wk`} 
          subtext="Avg. posts per week"
          icon={TrendingUp}
          colorClass="text-swave-orange"
        />
        <StatCard 
          label="Approval Bottleneck" 
          value={inReviewCount} 
          subtext="Posts currently awaiting approval"
          icon={AlertCircle}
          colorClass="text-amber-500"
        />
        {PERMISSIONS.canViewFinance(currentUser.role) ? (
          <StatCard 
            label="Revenue (Paid)" 
            value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalRevenue)} 
            subtext={`+ ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(pipelineValue)} in pipeline`}
            icon={DollarSign}
            colorClass="text-emerald-500"
          />
        ) : (
          <StatCard 
            label="Campaigns Active" 
            value={campaignStats.length} 
            subtext="Unique campaigns in this period"
            icon={CheckCircle}
            colorClass="text-emerald-500"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-2">
        
        {/* PLATFORM DISTRIBUTION */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm lg:col-span-2 print:break-inside-avoid">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 print:text-black">
                <BarChart3 className="w-5 h-5 text-gray-400 print:text-black" /> Platform Mix
            </h3>
            <div className="space-y-6">
                {platformStats.map(stat => (
                    <div key={stat.name} className="group">
                         <div className="flex items-center gap-4 mb-2">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${stat.color} print:shadow-none`}>
                                 <span className="font-bold text-xs">{stat.name[0]}</span>
                             </div>
                             <div className="flex-1">
                                 <div className="flex justify-between text-sm font-bold mb-1">
                                     <span className="text-gray-900 dark:text-white print:text-black">{stat.name}</span>
                                     <span className="text-gray-500 print:text-gray-600">{stat.count} posts</span>
                                 </div>
                                 <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden print:bg-gray-200">
                                     <div 
                                        className={`h-full ${stat.color} opacity-80 group-hover:opacity-100 transition-all duration-500 print:opacity-100 print:print-color-adjust-exact`} 
                                        style={{ width: `${totalPosts > 0 ? (stat.count / totalPosts) * 100 : 0}%` }}
                                     ></div>
                                 </div>
                             </div>
                         </div>
                    </div>
                ))}
            </div>
        </div>

        {/* WORKFLOW STATUS & CAMPAIGNS */}
        <div className="space-y-6">
             {/* Status Breakdown */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm print:break-inside-avoid">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 print:text-black">
                    <PieChart className="w-5 h-5 text-gray-400 print:text-black" /> Workflow Status
                </h3>
                <ProgressBar label="Drafting" value={draftCount} total={totalPosts} color="bg-gray-400" />
                <ProgressBar label="In Review" value={inReviewCount} total={totalPosts} color="bg-amber-500" />
                <ProgressBar label="Scheduled" value={scheduledCount} total={totalPosts} color="bg-blue-500" />
                <ProgressBar label="Published" value={publishedCount} total={totalPosts} color="bg-indigo-600" />
             </div>

             {/* Top Campaigns */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm print:break-inside-avoid">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 print:text-black">
                    <ArrowUpRight className="w-5 h-5 text-gray-400 print:text-black" /> Top Campaigns
                </h3>
                <div className="space-y-3">
                    {campaignStats.length === 0 ? <p className="text-sm text-gray-400 italic">No campaign data available.</p> : campaignStats.map(([name, stats]) => (
                        <div key={name} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 print:bg-gray-50 print:border-gray-200">
                             <div>
                                 <p className="font-bold text-xs text-gray-900 dark:text-white print:text-black">{name}</p>
                                 <p className="text-[10px] text-gray-500">{stats.published} / {stats.total} Published</p>
                             </div>
                             <div className="text-xs font-black text-swave-purple">{Math.round((stats.published/stats.total)*100)}%</div>
                        </div>
                    ))}
                </div>
             </div>
        </div>

      </div>
    </div>
  );
};
