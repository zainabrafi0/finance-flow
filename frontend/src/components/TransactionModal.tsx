'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { TransactionService } from '../services/transaction.service';
import { WalletService } from '../services/wallet.service';
import { setWallets } from '../store/walletSlice';
import { addNotification } from '../store/notificationSlice';
import { X } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number, currency = 'PKR') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount);

export default function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const { wallets } = useAppSelector((state) => state.wallets);
  const dispatch = useAppDispatch();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [isLoading, setIsLoading] = useState(false);

  const selectedWallet = wallets.find((w) => w._id === walletId);
  const selectedCurrency = selectedWallet?.currency || '';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) {
      toast.error('Please select a wallet');
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Create the transaction
      await TransactionService.create({
        walletId,
        type,
        amount: Number(amount),
        category,
        description,
      });

      // 2. Refetch wallets to update the global balances
      const updatedWallets = await WalletService.getAll();
      dispatch(setWallets(updatedWallets));
      dispatch(addNotification({
        kind: 'transaction',
        title: `${type === 'income' ? 'Income' : 'Expense'} recorded`,
        message: `${description || category} for ${Number(amount).toLocaleString()} was added successfully.`,
      }));

      toast.success('Transaction saved successfully!');
      setDescription('');
      setAmount('');
      onClose();
    } catch (error) {
      console.error('Failed to create transaction', error);
      toast.error('Failed to save transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-transparent dark:border-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>
 
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Whole Foods Market"
              className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
 
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Account / Wallet</label>
            <select
              required
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
            >
              <option value="" disabled className="dark:bg-slate-950">Select a wallet...</option>
              {wallets.map(w => (
                <option key={w._id} value={w._id} className="dark:bg-slate-950">{w.name} ({formatCurrency(w.balance, w.currency)})</option>
              ))}
              <option value="others" className="dark:bg-slate-950">Others</option>
            </select>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Amount {selectedCurrency ? `(${selectedCurrency})` : ''}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Transaction Type</label>
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${type === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${type === 'expense' ? 'bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Expense
                </button>
              </div>
            </div>
          </div>
 
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
            >
              <option value="Groceries" className="dark:bg-slate-950">Groceries</option>
              <option value="Income" className="dark:bg-slate-950">Salary / Income</option>
              <option value="Utilities" className="dark:bg-slate-950">Utilities</option>
              <option value="Housing" className="dark:bg-slate-950">Housing</option>
              <option value="Transportation" className="dark:bg-slate-950">Transportation</option>
              <option value="Entertainment" className="dark:bg-slate-950">Entertainment</option>
              <option value="Others" className="dark:bg-slate-950">Others</option>
            </select>
          </div>
 
          <button
            type="submit"
            disabled={isLoading || wallets.length === 0}
            className="w-full py-3.5 mt-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Register Transaction'}
          </button>
          
          {wallets.length === 0 && (
            <p className="text-xs text-red-500 text-center mt-2 font-medium">
              You must create a Wallet on the dashboard first.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
