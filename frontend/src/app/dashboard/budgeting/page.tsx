'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { BudgetService } from '../../../services/budget.service';
import { setBudgetData } from '../../../store/budgetSlice';
import { addNotification } from '../../../store/notificationSlice';
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Home, 
  Coffee, 
  Car, 
  Film, 
  ShoppingBag,
  Edit3,
  Zap,
  HelpCircle,
  Trash2
} from 'lucide-react';

// Dynamic icon mapper for categories
const getCategoryUI = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'housing': return { icon: Home, bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-600' };
    case 'food & dining': 
    case 'groceries': return { icon: Coffee, bg: 'bg-red-50', text: 'text-red-500', bar: 'bg-red-500' };
    case 'transportation': return { icon: Car, bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' };
    case 'entertainment': return { icon: Film, bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500' };
    case 'shopping': return { icon: ShoppingBag, bg: 'bg-pink-50', text: 'text-pink-600', bar: 'bg-pink-500' };
    case 'utilities': return { icon: Zap, bg: 'bg-yellow-50', text: 'text-yellow-600', bar: 'bg-yellow-500' };
    default: return { icon: HelpCircle, bg: 'bg-slate-100', text: 'text-slate-600', bar: 'bg-slate-500' };
  }
};

const formatPkr = (amount: number) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount);

export default function BudgetingPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { overview, categories } = useAppSelector((state) => state.budgets);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: 'Groceries', limit: '' });
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const monthString = String(currentDate.getMonth() + 1).padStart(2, '0');
  const yearNumber = currentDate.getFullYear();
  const monthDisplay = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchBudgets = async () => {
      setIsLoading(true);
      try {
        const data = await BudgetService.getProgress(monthString, yearNumber);
        dispatch(setBudgetData(data));
      } catch (error) {
        console.error('Failed to fetch budgets', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBudgets();
  }, [monthString, yearNumber, dispatch, isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const refreshBudgets = async () => {
    const data = await BudgetService.getProgress(monthString, yearNumber);
    dispatch(setBudgetData(data));
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBudget(true);
    try {
      await BudgetService.createOrUpdate({
        category: newBudget.category,
        limit: Number(newBudget.limit),
        month: monthString,
        year: yearNumber,
      });
      dispatch(addNotification({
        kind: 'budget',
        title: 'Budget created',
        message: `${newBudget.category} budget created with a limit of ${Number(newBudget.limit).toLocaleString()} for ${monthDisplay}.`,
      }));
      setNewBudget({ category: 'Groceries', limit: '' });
      setShowBudgetForm(false);
      await refreshBudgets();
    } catch (error) {
      console.error('Failed to save budget', error);
      alert('Failed to save budget.');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await BudgetService.delete(id);
      dispatch(addNotification({
        kind: 'budget',
        title: 'Budget deleted',
        message: 'The budget has been successfully deleted.',
      }));
      await refreshBudgets();
    } catch (error) {
      console.error('Failed to delete budget', error);
      alert('Failed to delete budget.');
    }
  };

  // Find categories that are over 90% utilized for the alerts section
  const criticalBudgets = categories.filter(c => c.utilizationPercentage >= 90);
  const visibleCategories = categories.filter((cat) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || cat.category.toLowerCase().includes(query);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Budget Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Track and manage your monthly spending limits.</p>
        </div>
        
        {/* Dynamic Month Selector */}
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <button onClick={handlePrevMonth} className="px-3 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 border-x border-slate-200 dark:border-slate-800 min-w-[140px] text-center">
            {monthDisplay}
          </span>
          <button onClick={handleNextMonth} className="px-3 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12 text-slate-500 animate-pulse font-medium">Syncing budget data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Live Total Budget Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <AlertTriangle className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-slate-50 dark:text-slate-800/10 opacity-50" strokeWidth={1} />
              
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 relative z-10">Total Monthly Budget</h2>
              <div className="flex items-baseline gap-2 mb-8 relative z-10">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {formatPkr(overview.totalSpent)}
                </span>
                <span className="text-sm font-bold text-slate-400">
                  / {formatPkr(overview.totalBudget)}
                </span>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-3 relative z-10">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${overview.totalUtilization > 100 ? 'bg-red-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(overview.totalUtilization, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 relative z-10">
                <span>{overview.totalUtilization.toFixed(1)}% Utilized</span>
                <span>{formatPkr(Math.max(overview.totalRemaining, 0))} Remaining</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search budget categories..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-cyan-500 dark:text-white"
              />
            </div>

            {/* Live Category Budgets */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Category Budgets</h2>
              </div>

              {categories.length === 0 ? (
                <p className="text-center text-slate-500 py-4 font-medium dark:text-slate-400">You have not set up any category budgets for this month.</p>
              ) : visibleCategories.length === 0 ? (
                <p className="text-center text-slate-500 py-4 font-medium dark:text-slate-400">No budget categories match your search.</p>
              ) : (
                <div className="space-y-8">
                  {visibleCategories.map((cat) => {
                    const { icon: Icon, bg, text, bar } = getCategoryUI(cat.category);
                    const isOverBudget = cat.utilizationPercentage > 100;

                    return (
                      <div key={cat._id} className="flex flex-col md:flex-row md:items-center gap-4 group">
                        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center ${text} shrink-0`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-end mb-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{cat.category}</span>
                            <div className="text-right">
                              <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                {formatPkr(cat.spent)}
                              </span>
                              <span className="text-xs font-medium text-slate-400 block">
                                of {formatPkr(cat.limit)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : bar}`} 
                              style={{ width: `${Math.min(cat.utilizationPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="md:opacity-0 group-hover:opacity-100 transition-opacity flex justify-end shrink-0">
                          <button 
                            type="button"
                            onClick={() => handleDeleteBudget(cat._id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-xl transition-all"
                            title="Delete this budget"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            {/* Live Budget Alerts */}
            {criticalBudgets.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-6 border border-red-100 dark:border-red-900 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle size={18} className="text-red-500 dark:text-red-400" />
                  <h3 className="font-bold text-red-800 dark:text-red-300">Budget Alerts</h3>
                </div>
                
                {criticalBudgets.map(cat => (
                  <div key={`alert-${cat._id}`} className="flex justify-between items-center py-3 border-b border-red-200/50 dark:border-red-900/40 last:border-0">
                    <span className="text-sm font-semibold text-red-900 dark:text-red-200">{cat.category}</span>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-md">
                      {cat.utilizationPercentage.toFixed(0)}% Utilized
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Create Budget Action */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <Edit3 size={24} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">Adjust Your Plan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                Need to reallocate funds? Update your category limits for the remainder of the month.
              </p>
              <button onClick={() => setShowBudgetForm(true)} className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors">
                Set New Budget
              </button>
            </div>

          </div>
        </div>
      )}

      {showBudgetForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveBudget} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set Monthly Budget</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{monthDisplay}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Category</label>
              <select
                value={newBudget.category}
                onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
              >
                <option value="Groceries" className="dark:bg-slate-900">Groceries</option>
                <option value="Food & Dining" className="dark:bg-slate-900">Food & Dining</option>
                <option value="Housing" className="dark:bg-slate-900">Housing</option>
                <option value="Transportation" className="dark:bg-slate-900">Transportation</option>
                <option value="Entertainment" className="dark:bg-slate-900">Entertainment</option>
                <option value="Shopping" className="dark:bg-slate-900">Shopping</option>
                <option value="Utilities" className="dark:bg-slate-900">Utilities</option>
                <option value="Others" className="dark:bg-slate-900">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1 uppercase tracking-wider">Limit (PKR)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={newBudget.limit}
                onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowBudgetForm(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSavingBudget} className="flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isSavingBudget ? 'Saving...' : 'Save Budget'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
