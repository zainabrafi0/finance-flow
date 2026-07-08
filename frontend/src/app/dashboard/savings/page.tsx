'use client';

import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { SavingsService } from '../../../services/savings.service';
import { WalletService } from '../../../services/wallet.service';
import { setGoals, updateGoal } from '../../../store/savingsSlice';
import { setWallets } from '../../../store/walletSlice';
import { addNotification } from '../../../store/notificationSlice';
import { Target, PiggyBank, Award, Plus } from 'lucide-react';

const formatCurrency = (amount: number, currency = 'PKR') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount);

export default function SavingsPage() {
  const dispatch = useAppDispatch();
  const { goals } = useAppSelector((state) => state.savings);
  const { wallets } = useAppSelector((state) => state.wallets);
  
  const [isLoading, setIsLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Goal Form State
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', description: '', targetAmount: '', targetDate: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsData, walletsData] = await Promise.all([
          SavingsService.getAll(),
          WalletService.getAll()
        ]);
        dispatch(setGoals(goalsData));
        dispatch(setWallets(walletsData));
        if (goalsData.length > 0) {
          setSelectedGoalId(goalsData[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await SavingsService.create({
        ...newGoal,
        targetAmount: Number(newGoal.targetAmount),
      });
      dispatch(addNotification({
        kind: 'savings',
        title: 'Savings goal created',
        message: `${newGoal.name} is now tracking toward ${Number(newGoal.targetAmount).toLocaleString()}.`,
      }));
      const updatedGoals = await SavingsService.getAll();
      dispatch(setGoals(updatedGoals));
      if (updatedGoals.length > 0 && !selectedGoalId) {
        setSelectedGoalId(updatedGoals[0]._id);
      }
      setNewGoal({ name: '', description: '', targetAmount: '', targetDate: '' });
      setShowNewGoalForm(false);
    } catch (err) {
      alert('Failed to create goal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || selectedGoalId === 'others') {
      alert('Please select a valid savings goal.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const targetGoal = goals.find(g => g._id === selectedGoalId);
      const goalName = targetGoal ? targetGoal.name : 'Selected Goal';

      const updatedGoal = await SavingsService.addFunds(selectedGoalId, {
        walletId: selectedWalletId,
        amount: Number(depositAmount),
      });
      dispatch(updateGoal(updatedGoal));
      dispatch(addNotification({
        kind: 'savings',
        title: 'Savings deposit added',
        message: `${Number(depositAmount).toLocaleString()} was allocated to ${goalName}.`,
      }));
      
      const updatedWallets = await WalletService.getAll();
      dispatch(setWallets(updatedWallets));
      
      setDepositAmount('');
      alert('Deposit Successful!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to deposit funds');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="p-12 text-slate-500 animate-pulse font-medium">Loading secure reserves...</div>;

  const visibleGoals = goals.filter((goal) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || [goal.name, goal.description, goal.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
  });
  const selectedWallet = wallets.find((wallet) => wallet._id === selectedWalletId);
  const selectedCurrency = selectedWallet?.currency || 'PKR';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Savings Goals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Plan and lock down future capital reserves.</p>
        </div>
        {!showNewGoalForm && (
          <button onClick={() => setShowNewGoalForm(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors">
            <Plus size={16} /> Create Goal
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search savings goals by name, description, or status..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-cyan-500 dark:text-white"
        />
      </div>

      {showNewGoalForm ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Create a New Strategic Goal</h2>
          <form onSubmit={handleCreateGoal} className="space-y-4 max-w-md">
            <input required type="text" placeholder="Goal Name (e.g., Down Payment)" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 dark:text-white" />
            <input required type="text" placeholder="Description" value={newGoal.description} onChange={e => setNewGoal({...newGoal, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 dark:text-white" />
            <input required type="number" placeholder="Target Amount (PKR)" value={newGoal.targetAmount} onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 dark:text-white" />
            <input required type="date" value={newGoal.targetDate} onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 dark:text-white" />
            <div className="flex gap-3">
              <button type="submit" disabled={isProcessing} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50">Create Goal</button>
              {goals.length > 0 && (
                <button type="button" onClick={() => setShowNewGoalForm(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 font-bold rounded-xl">Cancel</button>
              )}
            </div>
          </form>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 mb-4 font-medium">You don't have any savings goals yet.</p>
          <button onClick={() => setShowNewGoalForm(true)} className="mx-auto flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <>
          {visibleGoals.length === 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
              No savings goals match your search.
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Savings & Reserves</h2>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1"></span>
                  Dynamic Goal Active
                </span>
              </div>

              {visibleGoals.map((goal) => {
                const completionPercentage = (goal.currentAmount / goal.targetAmount) * 100;
                const isCompleted = goal.currentAmount >= goal.targetAmount;
                const isOverfunded = goal.currentAmount > goal.targetAmount;
                const statusText = isOverfunded ? 'Overfunded' : isCompleted ? 'Goal Met' : `${completionPercentage.toFixed(0)}% Completed`;

                return (
                  <div key={goal._id} className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <PiggyBank className="absolute right-12 top-1/2 -translate-y-1/2 w-48 h-48 text-slate-50 dark:text-slate-800/10 opacity-60 pointer-events-none" strokeWidth={1} />
                    
                    <div className="relative z-10 flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
                      <Target size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Strategic Savings Goal</span>
                    </div>

                    <div className="relative z-10 mb-10">
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">{goal.name}</h2>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{goal.description}</p>
                    </div>

                    <div className="relative z-10 mb-8">
                      <div className="flex justify-between items-end mb-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                        <span>Goal Progress ({statusText})</span>
                        <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                          style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="relative z-10 flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800 text-sm font-bold">
                      <span className="text-slate-600 dark:text-slate-400">
                        {isCompleted 
                          ? `Surplus Amount: ${formatCurrency(goal.currentAmount - goal.targetAmount)}` 
                          : `Remaining Amount: ${formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))}`
                        }
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Award size={16} />Streak: Active</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-800 dark:text-white">Increase Savings</h3>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Lock down liquid assets from checking or external accounts to earn 4.85% APY compounding.
              </p>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Fund from Wallet</label>
                  <select required value={selectedWalletId} onChange={(e) => setSelectedWalletId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 dark:text-white">
                    <option value="" disabled>Select Wallet</option>
                    {wallets.map(w => (
                      <option key={w._id} value={w._id} className="dark:bg-slate-900">{w.name} ({formatCurrency(w.balance, w.currency)})</option>
                    ))}
                    <option value="others" className="dark:bg-slate-900">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Allocate to Savings Goal</label>
                  <select required value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 dark:text-white">
                    <option value="" disabled>Select Savings Goal</option>
                    {goals.map(g => (
                      <option key={g._id} value={g._id} className="dark:bg-slate-900">{g.name} (Target: {formatCurrency(g.targetAmount)})</option>
                    ))}
                    <option value="others" className="dark:bg-slate-900">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Allocate Funds Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">{selectedCurrency === 'PKR' ? 'Rs' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : '$'}</span>
                    <input required type="number" step="0.01" min="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full pl-14 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" />
                  </div>
                </div>

                <button type="submit" disabled={isProcessing || !selectedWalletId || !selectedGoalId || selectedGoalId === 'others'} className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isProcessing ? 'Processing...' : 'Commit Deposit'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
