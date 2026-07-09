'use client';

import { Suspense, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { TransactionService } from '../../../services/transaction.service';
import { WalletService } from '../../../services/wallet.service';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { 
  fetchTransactions, 
  updateTransaction, 
  deleteTransaction, 
  setFilters, 
  setCurrentPage as setReduxPage 
} from '../../../store/transactionSlice';
import { 
  Search, 
  Calendar, 
  Wallet, 
  Download, 
  ShoppingCart, 
  Briefcase, 
  Zap, 
  Home, 
  Car, 
  Coffee,
  Pencil, 
  Trash2,
  Film
} from 'lucide-react';

// Map categories to their respective icons and colors
const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'groceries': return { icon: ShoppingCart, bg: 'bg-blue-50', text: 'text-blue-600' };
    case 'income': return { icon: Briefcase, bg: 'bg-emerald-50', text: 'text-emerald-600' };
    case 'utilities': return { icon: Zap, bg: 'bg-yellow-50', text: 'text-yellow-600' };
    case 'housing': return { icon: Home, bg: 'bg-purple-50', text: 'text-purple-600' };
    case 'transportation': return { icon: Car, bg: 'bg-slate-100', text: 'text-slate-600' };
    case 'entertainment': return { icon: Film, bg: 'bg-pink-50', text: 'text-pink-600' };
    default: return { icon: Coffee, bg: 'bg-slate-100', text: 'text-slate-500' };
  }
};

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const transactions = useAppSelector((state) => state.transactions.items);
  const isLoading = useAppSelector((state) => state.transactions.isLoading);

  const [wallets, setWallets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [walletFilter, setWalletFilter] = useState(searchParams.get('walletId') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ password: '', category: '', description: '' });
  const [deletingTx, setDeletingTx] = useState<any | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    dispatch(setFilters({
      walletId: walletFilter,
      category: categoryFilter,
      search: searchTerm,
      startDate,
      endDate,
    }));
  }, [walletFilter, categoryFilter, searchTerm, startDate, endDate, dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchTransactions());
    }, 250);
    return () => clearTimeout(timer);
  }, [walletFilter, categoryFilter, searchTerm, startDate, endDate, dispatch]);

  useEffect(() => {
    WalletService.getAll()
      .then(setWallets)
      .catch((error) => console.error('Failed to fetch wallets', error));
  }, []);

  const totalTransactions = transactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);
  const filteredTransactions = transactions; // Maintain for export logic
  const categories = Array.from(new Set(transactions.map((tx) => tx.category).filter(Boolean)));

  const formatCurrency = (amount: number, currency = 'PKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount || 0);
  };

  const getWalletName = (walletRef: any) => {
    if (typeof walletRef === 'object' && walletRef?.name) return walletRef.name;
    return wallets.find((wallet) => wallet._id === walletRef)?.name || 'Wallet';
  };

  const getWalletCurrency = (tx: any) => {
    if (typeof tx.walletId === 'object' && tx.walletId?.currency) return tx.walletId.currency;
    return wallets.find((wallet) => wallet._id === tx.walletId)?.currency || 'PKR';
  };

  const handleExportCsv = () => {
    const rows = filteredTransactions.map((tx) => ({
      type: tx.type,
      name: tx.description || tx.note || '',
      category: tx.category || '',
      date: new Date(tx.transactionDate || tx.createdAt || '').toLocaleDateString(),
      wallet: getWalletName(tx.walletId),
      amount: tx.amount,
    }));
    const csv = [
      ['Type', 'Transaction Name', 'Category', 'Date', 'Wallet', 'Amount'],
      ...rows.map((row) => [row.type, row.name, row.category, row.date, row.wallet, row.amount]),
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'financeflow-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const openEditModal = (tx: any) => {
    setEditingTx(tx);
    setEditForm({
      password: '',
      category: tx.category || '',
      description: tx.description || tx.note || '',
    });
  };

  const applyDatePreset = (preset: 'week' | 'month' | 'lastMonth' | 'all') => {
    const now = new Date();
    const toInputDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    if (preset === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      setStartDate(toInputDate(start));
      setEndDate(toInputDate(now));
      return;
    }

    if (preset === 'month') {
      setStartDate(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
      setEndDate(toInputDate(now));
      return;
    }

    const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    setStartDate(toInputDate(firstLastMonth));
    setEndDate(toInputDate(endLastMonth));
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    setIsMutating(true);
    try {
      await dispatch(updateTransaction({ transactionId: editingTx._id, data: editForm })).unwrap();
      toast.success('Transaction updated successfully!');
      setEditingTx(null);
    } catch (error: any) {
      toast.error(error || 'Failed to edit transaction.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingTx) return;
    setIsMutating(true);
    try {
      await dispatch(deleteTransaction({ transactionId: deletingTx._id, password: deletePassword })).unwrap();
      toast.success('Transaction deleted successfully!');
      setDeletingTx(null);
      setDeletePassword('');
    } catch (error: any) {
      toast.error(error || 'Failed to delete transaction.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Transactions History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Search, filter, edit, or download CSV logs.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Toolbar Row */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          
          <div className="flex flex-wrap gap-3 items-center w-full">
            <div className="relative flex-1 min-w-[240px] md:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 outline-none bg-transparent"
              />
              <span className="text-slate-350 dark:text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 outline-none bg-transparent"
              />
            </div>
 
            <div className="flex flex-wrap items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
              <button type="button" onClick={() => applyDatePreset('week')} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-750">Last Week</button>
              <button type="button" onClick={() => applyDatePreset('month')} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-750">This Month</button>
              <button type="button" onClick={() => applyDatePreset('lastMonth')} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-750">Last Month</button>
              <button type="button" onClick={() => applyDatePreset('all')} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-750">All</button>
            </div>
            
            <div className="relative">
              <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="" className="dark:bg-slate-900">All Wallets</option>
                {wallets.map((wallet) => (
                  <option key={wallet._id} value={wallet._id} className="dark:bg-slate-900">{wallet.name}</option>
                ))}
                <option value="others" className="dark:bg-slate-900">Others</option>
              </select>
            </div>
 
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="" className="dark:bg-slate-900">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category} className="dark:bg-slate-900">{category}</option>
              ))}
              <option value="others" className="dark:bg-slate-900">Others</option>
            </select>

            <button onClick={handleExportCsv} className="ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors w-full sm:w-auto">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="p-4 pl-6 w-16">Type</th>
                <th className="p-4">Transaction Name</th>
                <th className="p-4">Date</th>
                <th className="p-4">Wallet</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 pr-6 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading transactions...</td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No transactions found. Add one to get started!</td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const { icon: Icon, bg, text } = getCategoryIcon(tx.category);
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${text}`}>
                          <Icon size={18} />
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-white">{tx.description || tx.note || 'Wallet transfer'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{tx.category}</p>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(tx.transactionDate || tx.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 text-[10px] font-bold rounded-md">
                          {getWalletName(tx.walletId)}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-extrabold ${isIncome ? 'text-emerald-600' : isExpense ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                        {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(Math.abs(tx.amount), getWalletCurrency(tx))}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(tx)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit category or description"><Pencil size={16} /></button>
                          <button onClick={() => { setDeletingTx(tx); setDeletePassword(''); }} disabled={isMutating} className="text-slate-400 hover:text-red-600 transition-colors" title="Delete transaction"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalTransactions > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="text-slate-800 dark:text-white font-bold">{totalTransactions > 0 ? startIndex + 1 : 0}</span> to <span className="text-slate-800 dark:text-white font-bold">{Math.min(endIndex, totalTransactions)}</span> of <span className="text-slate-800 dark:text-white font-bold">{totalTransactions}</span> entries
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-xs ${
                    page === currentPage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {editingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleEditTransaction} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Transaction</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Password required. Only category and description can be changed.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Description</label>
              <input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
              >
                <option value="Income">Income</option>
                <option value="Groceries">Groceries</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Utilities">Utilities</option>
                <option value="Housing">Housing</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Transfer">Internal Transfer</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Confirm Password</label>
              <input
                required
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditingTx(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isMutating} className="flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isMutating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deletingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleDeleteTransaction} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Delete Transaction</h2>
              <p className="text-sm font-medium text-slate-500">
                Enter your password to delete this transaction and reverse its wallet balance impact.
              </p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
              <p className="text-sm font-bold text-red-900">{deletingTx.description || deletingTx.note || 'Wallet transfer'}</p>
              <p className="text-xs font-medium text-red-700 mt-1">{deletingTx.category || 'Uncategorized'} • {formatCurrency(Math.abs(deletingTx.amount), getWalletCurrency(deletingTx))}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Confirm Password</label>
              <input
                required
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setDeletingTx(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isMutating} className="flex-1 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                {isMutating ? 'Deleting...' : 'Delete & Reverse'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">Loading transactions...</div>}>
      <TransactionsPageContent />
    </Suspense>
  );
}
