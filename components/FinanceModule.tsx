
import React, { useState, useEffect } from 'react';
import { Invoice, ServiceItem, ClientProfile, InvoiceItem } from '../types';
import { db } from '../services/db';
import { SwaveLogo } from './Logo';
import { Plus, ArrowLeft, Download, Eye, Edit2, Trash2, Save, Printer, Copy, CheckCircle, AlertCircle, Calendar, DollarSign, List, Briefcase, FileText, X } from 'lucide-react';

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export const FinanceModule: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor' | 'preview' | 'services'>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice Editor State
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice>>({});
  
  // Service Catalog State
  const [newService, setNewService] = useState({ name: '', rate: '', description: '' });
  const [isSavingService, setIsSavingService] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
        const [invs, svcs, clis] = await Promise.all([
        db.getInvoices(),
        db.getServices(),
        db.getClients()
        ]);
        setInvoices(invs);
        setServices(svcs);
        setClients(clis);
    } catch (e) {
        console.error("Failed to load finance data", e);
    } finally {
        if (!silent) setLoading(false);
    }
  };

  const createNewInvoice = () => {
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.createdAt > new Date(year, 0, 1).getTime()).length + 1;
    const invoiceNumber = `INV-${year}-${count.toString().padStart(3, '0')}`;
    
    setEditingInvoice({
      invoiceNumber,
      status: 'Draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [],
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      discountValue: 0,
      grandTotal: 0,
      currency: 'USD'
    });
    setView('editor');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(JSON.parse(JSON.stringify(invoice)));
    setView('editor');
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
      const year = new Date().getFullYear();
      const count = invoices.length + 1; // Simplistic counter
      const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(3, '0')}`;
      
      setEditingInvoice({
          ...invoice,
          id: undefined, // Clear ID to create new
          invoiceNumber,
          status: 'Draft',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
      setView('editor');
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await db.deleteInvoice(id);
      loadData(true);
    }
  };

  const calculateTotals = (invoice: Partial<Invoice>) => {
      const items = invoice.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const discount = invoice.discountValue || 0;
      const taxableAmount = Math.max(0, subtotal - discount);
      const taxRate = invoice.taxRate || 0;
      const taxAmount = taxableAmount * (taxRate / 100);
      const grandTotal = taxableAmount + taxAmount;
      
      return { subtotal, taxAmount, grandTotal };
  };

  const saveInvoice = async () => {
      if (!editingInvoice.clientName) {
          alert("Please select a client.");
          return;
      }
      
      const { subtotal, taxAmount, grandTotal } = calculateTotals(editingInvoice);
      const finalInvoice = {
          ...editingInvoice,
          id: editingInvoice.id || crypto.randomUUID(),
          subtotal,
          taxAmount,
          grandTotal,
          updatedAt: Date.now(),
          createdAt: editingInvoice.createdAt || Date.now()
      } as Invoice;

      await db.saveInvoice(finalInvoice);
      await loadData(true);
      setView('dashboard');
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
      const newItems = [...(editingInvoice.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
      
      const totals = calculateTotals({ ...editingInvoice, items: newItems });
      setEditingInvoice({ ...editingInvoice, items: newItems, ...totals });
  };

  const addItem = () => {
      const newItems = [...(editingInvoice.items || []), { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }];
      setEditingInvoice({ ...editingInvoice, items: newItems });
  };

  const removeItem = (index: number) => {
      const newItems = [...(editingInvoice.items || [])];
      newItems.splice(index, 1);
      const totals = calculateTotals({ ...editingInvoice, items: newItems });
      setEditingInvoice({ ...editingInvoice, items: newItems, ...totals });
  };

  const handleClientChange = (clientName: string) => {
      const client = clients.find(c => c.name === clientName);
      if (client) {
          setEditingInvoice({
              ...editingInvoice,
              clientName: client.name,
              clientCompany: client.name, // Assuming name is company name based on app usage
              clientAddress: client.billingAddress || '',
              clientTaxId: client.taxId || '',
              currency: client.currency || 'USD'
          });
      }
  };

  // --- Services Management ---
  const handleAddService = async () => {
      if(!newService.name || !newService.rate) return;
      
      setIsSavingService(true);
      try {
          const rate = parseFloat(newService.rate);
          if (isNaN(rate)) {
              alert("Please enter a valid rate.");
              return;
          }

          await db.saveService({ 
              id: crypto.randomUUID(),
              name: newService.name,
              defaultRate: rate,
              description: newService.description 
          });
          
          setNewService({ name: '', rate: '', description: '' });
          await loadData(true);
      } catch (err) {
          console.error("Error saving service:", err);
          alert("Failed to save service.");
      } finally {
          setIsSavingService(false);
      }
  };

  // --- RENDERERS ---

  const renderDashboard = () => {
      const currentYear = new Date().getFullYear();
      const revenueYTD = invoices
        .filter(i => i.status === 'Paid' && new Date(i.issueDate).getFullYear() === currentYear)
        .reduce((sum, i) => sum + i.grandTotal, 0);
      
      const outstanding = invoices
        .filter(i => (i.status === 'Sent' || i.status === 'Draft'))
        .reduce((sum, i) => sum + i.grandTotal, 0);

      const overdue = invoices
        .filter(i => i.status !== 'Paid' && i.status !== 'Void' && new Date(i.dueDate) < new Date())
        .reduce((sum, i) => sum + i.grandTotal, 0);

      return (
          <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">Finance & Invoicing</h1>
                  <div className="flex gap-3">
                      <button onClick={() => setView('services')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                          <Briefcase className="w-4 h-4" /> Service Catalog
                      </button>
                      <button onClick={createNewInvoice} className="flex items-center gap-2 px-4 py-2 bg-swave-orange text-white rounded-xl shadow-lg hover:bg-orange-600 font-bold text-sm">
                          <Plus className="w-4 h-4" /> New Invoice
                      </button>
                  </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Revenue YTD</p>
                      <p className="text-3xl font-black text-emerald-500">{formatCurrency(revenueYTD)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Outstanding</p>
                      <p className="text-3xl font-black text-blue-500">{formatCurrency(outstanding)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Overdue</p>
                      <p className="text-3xl font-black text-red-500">{formatCurrency(overdue)}</p>
                  </div>
              </div>

              {/* Invoices List */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                          <tr>
                              <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Number</th>
                              <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Client</th>
                              <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Date</th>
                              <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Due</th>
                              <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Amount</th>
                              <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Status</th>
                              <th className="px-6 py-4 text-right font-bold text-gray-500 dark:text-gray-400">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {invoices.length === 0 ? (
                              <tr>
                                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No invoices found. Create one to get started.</td>
                              </tr>
                          ) : invoices.map(inv => {
                              const isOverdue = inv.status !== 'Paid' && inv.status !== 'Void' && new Date(inv.dueDate) < new Date();
                              return (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-gray-600 dark:text-gray-300">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{inv.clientName}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{inv.issueDate}</td>
                                    <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {inv.dueDate} {isOverdue && <AlertCircle className="w-3 h-3 inline ml-1"/>}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{formatCurrency(inv.grandTotal, inv.currency)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                                            ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                                              inv.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                              inv.status === 'Draft' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => { setEditingInvoice(inv); setView('preview'); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-500"><Eye className="w-4 h-4"/></button>
                                            <button onClick={() => handleEditInvoice(inv)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-blue-500"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                              );
                          })}
                      </tbody>
                    </table>
                  </div>
              </div>
          </div>
      );
  };

  const renderEditor = () => {
      const { subtotal, taxAmount, grandTotal } = calculateTotals(editingInvoice);
      
      return (
          <div className="space-y-6 animate-in slide-in-from-right-4 w-full max-w-[95vw] mx-auto">
              <div className="flex items-center justify-between">
                  <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                      <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                  </button>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{editingInvoice.id ? 'Edit Invoice' : 'New Invoice'}</h2>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 space-y-8">
                  {/* Header Info */}
                  <div className="flex flex-col md:flex-row justify-between gap-8 border-b border-gray-100 dark:border-gray-700 pb-8">
                      <div className="space-y-4 flex-1">
                           <div>
                               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client</label>
                               <select 
                                  value={editingInvoice.clientName || ''}
                                  onChange={e => handleClientChange(e.target.value)}
                                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-swave-orange outline-none"
                               >
                                   <option value="">Select Client...</option>
                                   {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                               </select>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billing Address</label>
                                   <textarea 
                                       value={editingInvoice.clientAddress || ''}
                                       onChange={e => setEditingInvoice({...editingInvoice, clientAddress: e.target.value})}
                                       className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                       rows={3}
                                   />
                               </div>
                               <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tax ID</label>
                                    <input 
                                       value={editingInvoice.clientTaxId || ''}
                                       onChange={e => setEditingInvoice({...editingInvoice, clientTaxId: e.target.value})}
                                       className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                    />
                               </div>
                           </div>
                      </div>

                      <div className="space-y-4 w-full md:w-64">
                           <div>
                               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invoice #</label>
                               <input 
                                   value={editingInvoice.invoiceNumber || ''}
                                   onChange={e => setEditingInvoice({...editingInvoice, invoiceNumber: e.target.value})}
                                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-mono font-bold"
                               />
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                               <div>
                                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Issued</label>
                                   <input 
                                       type="date"
                                       value={editingInvoice.issueDate || ''}
                                       onChange={e => setEditingInvoice({...editingInvoice, issueDate: e.target.value})}
                                       className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Due</label>
                                   <input 
                                       type="date"
                                       value={editingInvoice.dueDate || ''}
                                       onChange={e => setEditingInvoice({...editingInvoice, dueDate: e.target.value})}
                                       className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Currency</label>
                               <select
                                  value={editingInvoice.currency || 'USD'}
                                  onChange={e => setEditingInvoice({...editingInvoice, currency: e.target.value as any})}
                                  className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                               >
                                   <option value="USD">USD ($)</option>
                                   <option value="EUR">EUR (€)</option>
                                   <option value="GBP">GBP (£)</option>
                                   <option value="XCD">XCD ($)</option>
                               </select>
                           </div>
                      </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                      <table className="w-full">
                          <thead>
                              <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 uppercase tracking-wider text-left">
                                  <th className="py-2 w-1/2">Description</th>
                                  <th className="py-2 w-24">Qty/Hrs</th>
                                  <th className="py-2 w-32">Price</th>
                                  <th className="py-2 w-32 text-right">Total</th>
                                  <th className="py-2 w-10"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                              {(editingInvoice.items || []).map((item, index) => (
                                  <tr key={item.id}>
                                      <td className="py-2 pr-4 relative group">
                                          <input 
                                              value={item.description}
                                              onChange={e => updateItem(index, 'description', e.target.value)}
                                              placeholder="Service description..."
                                              className="w-full p-2 bg-transparent border-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 text-gray-800 dark:text-gray-200 font-medium"
                                          />
                                          {/* Quick Service Selector */}
                                          <div className="absolute top-10 left-0 z-10 hidden group-focus-within:block bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-lg w-64 max-h-48 overflow-y-auto">
                                              {services.map(s => (
                                                  <button 
                                                      key={s.id}
                                                      onMouseDown={() => {
                                                          const newItems = [...(editingInvoice.items || [])];
                                                          newItems[index] = { ...newItems[index], description: s.name, unitPrice: s.defaultRate };
                                                          newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
                                                          const totals = calculateTotals({ ...editingInvoice, items: newItems });
                                                          setEditingInvoice({ ...editingInvoice, items: newItems, ...totals });
                                                      }}
                                                      className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                                                  >
                                                      <span className="font-bold">{s.name}</span> - {formatCurrency(s.defaultRate)}
                                                  </button>
                                              ))}
                                          </div>
                                      </td>
                                      <td className="py-2 pr-4">
                                          <input 
                                              type="number"
                                              value={item.quantity}
                                              onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                              className="w-full p-2 bg-gray-50 dark:bg-gray-900 rounded text-center"
                                          />
                                      </td>
                                      <td className="py-2 pr-4">
                                          <input 
                                              type="number"
                                              value={item.unitPrice}
                                              onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                              className="w-full p-2 bg-gray-50 dark:bg-gray-900 rounded text-right"
                                          />
                                      </td>
                                      <td className="py-2 text-right font-bold text-gray-800 dark:text-gray-200">
                                          {formatCurrency(item.total, editingInvoice.currency)}
                                      </td>
                                      <td className="py-2 text-center">
                                          <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      <button onClick={addItem} className="text-sm font-bold text-swave-orange hover:text-orange-600 flex items-center gap-1">
                          <Plus className="w-4 h-4"/> Add Line Item
                      </button>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex flex-col md:flex-row justify-between gap-8 border-t border-gray-100 dark:border-gray-700 pt-8">
                      <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes / Payment Info</label>
                          <textarea 
                              value={editingInvoice.notes || ''}
                              onChange={e => setEditingInvoice({...editingInvoice, notes: e.target.value})}
                              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm h-32"
                              placeholder="Thank you for your business. Please pay via wire transfer..."
                          />
                      </div>
                      <div className="w-64 space-y-3">
                          <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Subtotal</span>
                              <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(subtotal, editingInvoice.currency)}</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                              <span className="text-gray-500">Discount Amount</span>
                              <input 
                                  type="number"
                                  value={editingInvoice.discountValue}
                                  onChange={e => setEditingInvoice({...editingInvoice, discountValue: parseFloat(e.target.value) || 0})}
                                  className="w-20 p-1 text-right bg-gray-50 dark:bg-gray-900 border rounded text-xs"
                              />
                          </div>
                          <div className="flex justify-between text-sm items-center">
                              <span className="text-gray-500">Tax Rate (%)</span>
                              <input 
                                  type="number"
                                  value={editingInvoice.taxRate}
                                  onChange={e => setEditingInvoice({...editingInvoice, taxRate: parseFloat(e.target.value) || 0})}
                                  className="w-20 p-1 text-right bg-gray-50 dark:bg-gray-900 border rounded text-xs"
                              />
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Tax Amount</span>
                              <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(taxAmount, editingInvoice.currency)}</span>
                          </div>
                          <div className="flex justify-between text-lg pt-3 border-t border-gray-100 dark:border-gray-700">
                              <span className="font-black text-gray-900 dark:text-white">Total</span>
                              <span className="font-black text-swave-orange">{formatCurrency(grandTotal, editingInvoice.currency)}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mr-auto">
                          <label className="text-sm text-gray-500 font-bold">Status:</label>
                          <select 
                             value={editingInvoice.status}
                             onChange={e => setEditingInvoice({...editingInvoice, status: e.target.value as any})}
                             className="p-2 rounded bg-gray-100 dark:bg-gray-900 font-medium text-sm"
                          >
                              <option value="Draft">Draft</option>
                              <option value="Sent">Sent</option>
                              <option value="Paid">Paid</option>
                              <option value="Void">Void</option>
                          </select>
                      </div>
                      <button onClick={saveInvoice} className="px-6 py-3 bg-swave-orange text-white rounded-xl shadow-lg hover:bg-orange-600 font-bold flex items-center gap-2">
                          <Save className="w-5 h-5"/> Save Invoice
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const renderPreview = () => {
      // Paper-like styling
      const { subtotal, taxAmount, grandTotal } = calculateTotals(editingInvoice);
      const isOverdue = editingInvoice.status !== 'Paid' && editingInvoice.status !== 'Void' && editingInvoice.dueDate && new Date(editingInvoice.dueDate) < new Date();

      return (
          <div className="flex flex-col h-full animate-in fade-in">
             <div className="flex justify-between items-center mb-6">
                <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <div className="flex gap-3">
                    <button onClick={() => handleEditInvoice(editingInvoice as Invoice)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"><Edit2 className="w-4 h-4"/> Edit</button>
                    <button onClick={() => handleDuplicateInvoice(editingInvoice as Invoice)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"><Copy className="w-4 h-4"/> Duplicate</button>
                    <button onClick={() => window.print()} className="px-4 py-2 bg-gray-900 text-white rounded-lg flex items-center gap-2 hover:bg-black text-sm font-medium"><Printer className="w-4 h-4"/> Print / PDF</button>
                </div>
             </div>

             <div className="bg-white text-gray-900 w-full max-w-[210mm] mx-auto p-12 shadow-2xl min-h-[297mm] print:shadow-none print:w-full print:max-w-none">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10">
                                <SwaveLogo />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900">SWAVE SOCIAL</span>
                        </div>
                        <p className="text-sm text-gray-500 whitespace-pre-line">
                            123 Agency Lane, Suite 400<br/>
                            New York, NY 10012<br/>
                            billing@swave.agency
                        </p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-light text-gray-900 mb-2">INVOICE</h1>
                        <p className="text-gray-500 font-mono text-sm">#{editingInvoice.invoiceNumber}</p>
                        {isOverdue && <span className="text-red-600 font-bold border border-red-600 px-2 py-1 text-xs rounded mt-2 inline-block">OVERDUE</span>}
                        {editingInvoice.status === 'Paid' && <span className="text-emerald-600 font-bold border border-emerald-600 px-2 py-1 text-xs rounded mt-2 inline-block">PAID</span>}
                    </div>
                </div>

                {/* Client & Dates */}
                <div className="flex justify-between mb-12">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                        <p className="font-bold text-lg">{editingInvoice.clientCompany || editingInvoice.clientName}</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{editingInvoice.clientAddress}</p>
                        {editingInvoice.clientTaxId && <p className="text-xs text-gray-500 mt-2">Tax ID: {editingInvoice.clientTaxId}</p>}
                    </div>
                    <div className="text-right space-y-1">
                         <div className="flex justify-between w-48">
                             <span className="text-gray-500 text-sm">Issue Date:</span>
                             <span className="font-medium">{editingInvoice.issueDate}</span>
                         </div>
                         <div className="flex justify-between w-48">
                             <span className="text-gray-500 text-sm">Due Date:</span>
                             <span className="font-medium">{editingInvoice.dueDate}</span>
                         </div>
                    </div>
                </div>

                {/* Line Items */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-900 text-sm font-bold uppercase tracking-wider">
                            <th className="py-3 text-left">Description</th>
                            <th className="py-3 text-right">Qty</th>
                            <th className="py-3 text-right">Price</th>
                            <th className="py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {(editingInvoice.items || []).map(item => (
                            <tr key={item.id}>
                                <td className="py-4 font-medium">{item.description}</td>
                                <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                                <td className="py-4 text-right text-gray-600">{formatCurrency(item.unitPrice, editingInvoice.currency)}</td>
                                <td className="py-4 text-right font-bold">{formatCurrency(item.total, editingInvoice.currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">{formatCurrency(subtotal, editingInvoice.currency)}</span>
                        </div>
                        {editingInvoice.discountValue > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Discount</span>
                                <span>-{formatCurrency(editingInvoice.discountValue, editingInvoice.currency)}</span>
                            </div>
                        )}
                        {editingInvoice.taxAmount > 0 && (
                             <div className="flex justify-between text-sm text-gray-600">
                                <span>Tax ({editingInvoice.taxRate}%)</span>
                                <span>{formatCurrency(taxAmount, editingInvoice.currency)}</span>
                             </div>
                        )}
                        <div className="flex justify-between text-xl font-bold border-t-2 border-gray-900 pt-2 mt-2">
                            <span>Total</span>
                            <span>{formatCurrency(grandTotal, editingInvoice.currency)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {editingInvoice.notes && (
                    <div className="border-t border-gray-200 pt-8">
                        <h4 className="font-bold text-sm mb-2">Notes & Payment Instructions</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{editingInvoice.notes}</p>
                    </div>
                )}
             </div>
          </div>
      );
  };

  const renderServices = () => (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
           <div className="flex items-center justify-between">
                <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Service Catalog</h2>
           </div>

           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6 flex gap-2">
                    <input 
                        placeholder="Service Name (e.g. Social Media Management)"
                        className="flex-grow p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-swave-orange"
                        value={newService.name}
                        onChange={e => setNewService({...newService, name: e.target.value})}
                    />
                    <input 
                        type="number"
                        placeholder="Default Rate"
                        className="w-32 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-swave-orange"
                        value={newService.rate}
                        onChange={e => setNewService({...newService, rate: e.target.value})}
                    />
                    <button 
                        onClick={handleAddService} 
                        disabled={!newService.name || !newService.rate || isSavingService} 
                        className="px-6 bg-swave-purple text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                        {isSavingService ? "Saving..." : "Add Service"}
                    </button>
                </div>

                <div className="space-y-2">
                    {services.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750">
                             <div>
                                 <h4 className="font-bold text-gray-800 dark:text-white">{s.name}</h4>
                                 <p className="text-sm text-gray-500">{s.description || 'Standard Rate'}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                 <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{formatCurrency(s.defaultRate)}</span>
                                 <button onClick={async () => {
                                     if(confirm('Delete service?')) {
                                         await db.deleteService(s.id);
                                         loadData(true);
                                     }
                                 }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                             </div>
                        </div>
                    ))}
                    {services.length === 0 && <p className="text-center text-gray-400 py-8">No services defined.</p>}
                </div>
           </div>
      </div>
  );

  if (loading) return <div className="p-12 text-center text-gray-400">Loading Finance Data...</div>;

  return (
    <div className="p-6 md:p-12 pb-40 h-full overflow-y-auto no-scrollbar">
      {view === 'dashboard' && renderDashboard()}
      {view === 'editor' && renderEditor()}
      {view === 'preview' && renderPreview()}
      {view === 'services' && renderServices()}
    </div>
  );
};
