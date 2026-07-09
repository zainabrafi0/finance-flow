'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../../store/hooks';
import { RecurringService, RecurringTransaction } from '../../../services/recurring.service';
import { WalletService } from '../../../services/wallet.service';
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  X, 
  Calendar,
  Zap,
  Coffee,
  Briefcase,
  Home,
  Car,
  Film,
  HelpCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

const getCategoryUI = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'groceries':
    case 'food & dining': return { icon: Coffee, bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400' };
    case 'utilities': return { icon: Zap, bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-600 dark:text-yellow-400' };
    case 'housing': return { icon: Home, bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400' };
    case 'transportation': return { icon: Car, bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' };
    case 'entertainment': return { icon: Film, bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400' };
    case 'income':
    case 'salary': return { icon: Briefcase, bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-600 dark:text-teal-400' };
    default: return { icon: HelpCircle, bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400' };
  }
};

const formatCurrency = (amount: number, currency = 'PKR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export default function RecurringPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    walletId: '',
    type: 'expense',
    amount: '',
    category: 'Utilities',
    description: '',
    frequency: 'monthly',
    nextRunDate: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recurringData, walletData] = await Promise.all([
        RecurringService.getAll(),
        WalletService.getAll(),
      ]);
      setItems(recurringData);
      setWallets(walletData);
      if (walletData.length > 0 && !form.walletId) {
        setForm((prev) => ({ ...prev, walletId: walletData[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load recurring data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await RecurringService.update(id, { isActive: !currentStatus });
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isActive: !currentStatus } : item))
      );
      toast.success('Status updated successfully!');
    } catch (err) {
      toast.error('Failed to toggle status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring transaction template?')) return;
    try {
      await RecurringService.delete(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success('Template deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete item.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.walletId || !form.amount || !form.description || !form.nextRunDate) {
      toast.error('Please fill in all fields.');
      return;
    }
    setIsSaving(true);
    try {
      await RecurringService.create({
        walletId: form.walletId,
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        frequency: form.frequency,
        nextRunDate: new Date(form.nextRunDate).toISOString(),
      });
      setShowAddForm(false);
      setForm((prev) => ({
        ...prev,
        amount: '',
        description: '',
        nextRunDate: '',
      }));
      toast.success('Recurring transaction template created!');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create recurring transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  const getWalletDetails = (walletRef: any) => {
    if (typeof walletRef === 'object' && walletRef) return walletRef;
    return wallets.find((w) => w._id === walletRef) || { name: 'Wallet', currency: 'PKR' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-slate-800 dark:text-slate-100">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="text-cyan-600 animate-spin-slow" size={24} /> Recurring Transactions
          </h1>
          <p className="text-sm text-slate-500 font-medium dark:text-slate-400">
            Automate monthly bills, regular subscriptions, or payroll events.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30 transition-all text-sm"
        >
          <Plus size={16} /> Add Schedule
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-slate-500">Loading schedules...</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm space-y-3">
          <RefreshCw className="mx-auto text-slate-300 dark:text-slate-700" size={48} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No schedules configured</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto dark:text-slate-400">
            Set up recurring monthly subscriptions or salary inputs to automate transaction creation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const wallet = getWalletDetails(item.walletId);
            const ui = getCategoryUI(item.category);
            const Icon = ui.icon;
            
            return (
              <div 
                key={item._id} 
                className={`bg-white dark:bg-slate-900 border ${
                  item.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-slate-100 dark:border-slate-900 opacity-60'
                } rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${ui.bg} flex items-center justify-center ${ui.text}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1">{item.description}</h4>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(item._id, item.isActive)}
                      className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                      title="Delete schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frequency</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md uppercase">
                      {item.frequency}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</p>
                    <p className={`font-extrabold text-base ${
                      item.type === 'income' ? 'text-teal-600' : 'text-slate-800 dark:text-white'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, wallet.currency || 'PKR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-2 border-t border-slate-50 dark:border-slate-800/40">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Next Due: {new Date(item.nextRunDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw size={20} className="text-cyan-600" /> Schedule Transaction
              </h2>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Debit/Credit Wallet</label>
                <select
                  required
                  value={form.walletId}
                  onChange={(e) => setForm({ ...form, walletId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-cyan-500 dark:text-white"
                >
                  <option value="" disabled>Select Source Wallet</option>
                  {wallets.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({formatCurrency(w.balance, w.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Flow Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-cyan-500 dark:text-white"
                  >
                    <option value="expense">Expense (Debit)</option>
                    <option value="income">Income (Credit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-cyan-500 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Amount</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="1500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-cyan-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-cyan-500 dark:text-white"
                  >
                    <option value="Utilities">Utilities</option>
                    <option value="Housing">Housing</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Income">Salary / Income</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Next Run Date</label>
                <input
                  required
                  type="date"
                  value={form.nextRunDate}
                  onChange={(e) => setForm({ ...form, nextRunDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-cyan-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Description</label>
                <input
                  required
                  type="text"
                  placeholder="Netflix Subscription, Salary, Electricity Bill"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-cyan-500 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all text-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving Schedule...' : 'Create Schedule'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
