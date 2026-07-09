'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { WalletService } from '../../../services/wallet.service';
import { TransactionService, Transaction } from '../../../services/transaction.service';
import { setWallets } from '../../../store/walletSlice';
import { addNotification } from '../../../store/notificationSlice';
import { Plus, Wallet as WalletIcon, ArrowRightLeft, CreditCard, X, ArrowUpRight, ArrowDownLeft, RefreshCcw, ListFilter, Trash2 } from 'lucide-react';
import Link from 'next/link';

const RATES_TO_PKR: Record<string, number> = {
  PKR: 1,
  USD: 278,
  EUR: 302,
  GBP: 352,
};

const ACCOUNT_CATEGORIES = ['Bank Account', 'Credit Account', 'Digital Wallet', 'Manual/Cash', 'Others'];
const ACCOUNT_SUBTYPES: Record<string, string[]> = {
  'Bank Account': ['Checking', 'Savings', 'Current', 'Others'],
  'Credit Account': ['Credit Card', 'Line of Credit', 'Others'],
  'Digital Wallet': ['Sadapay', 'NayaPay', 'JazzCash', 'EasyPaisa', 'PayPal', 'Others'],
  'Manual/Cash': ['Cash', 'Others'],
  'Others': ['Others'],
};
const FINANCIAL_INSTITUTIONS = [
  'Meezan Bank',
  'HBL',
  'UBL',
  'MCB',
  'Allied Bank',
  'Bank Alfalah',
  'Standard Chartered',
  'Faysal Bank',
  'Askari Bank',
  'Bank Al Habib',
  'National Bank of Pakistan',
  'JS Bank',
  'Others',
];

export default function WalletsPage() {
  const dispatch = useAppDispatch();
  const { wallets } = useAppSelector((state) => state.wallets);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Extended Wallet Form State
  const [newWallet, setNewWallet] = useState({ 
    name: '', 
    balance: '', 
    currency: 'PKR',
    walletType: 'Manual/Cash',
    accountSubType: 'Cash',
    bankName: 'Meezan Bank',
    accountNumber: '',
    creditLimit: ''
  });

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  const [isTransferring, setIsTransferring] = useState(false);
  const [transferForm, setTransferForm] = useState({
    sourceWalletId: '',
    destinationWalletId: '',
    amount: ''
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'PKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const maskAccountNumber = (accountNum?: string) => {
    if (!accountNum) return '';
    if (accountNum.length <= 4) return `**** ${accountNum}`;
    return `**** **** **** ${accountNum.slice(-4)}`;
  };

  const getRefId = (ref: any) => typeof ref === 'object' && ref?._id ? ref._id : ref;

  const isLettersOnlyName = (name: string) => /^[A-Za-z][A-Za-z\s.'-]*$/.test(name.trim());
  const normalizeWalletType = (type?: string) => {
    if (type === 'Bank' || type === 'Savings' || type === 'Checking') return 'Bank Account';
    if (type === 'Credit Card') return 'Credit Account';
    if (type === 'Cash') return 'Manual/Cash';
    return type || 'Manual/Cash';
  };
  const formatBankIdentifierInput = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})/g, '$1 ').trim();
  const isIbanFormat = (value: string) => {
    const iban = value.replace(/\s/g, '').toUpperCase();
    return !iban || /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban);
  };
  const isValidAccountIdentifier = (value: string, accountCategory: string) => {
    const compact = value.replace(/\s/g, '');
    if (!compact) return true;
    if (accountCategory !== 'Bank Account') return compact.length >= 3;
    if (/^[A-Z]{2}\d{2}/i.test(compact)) return isIbanFormat(value);
    return /^[A-Z0-9-]{5,34}$/i.test(compact);
  };
  const visibleWallets = wallets.filter((wallet: any) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [wallet.name, wallet.walletType, wallet.accountSubType, wallet.bankName, wallet.currency]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
    const normalizedType = normalizeWalletType(wallet.walletType);
    const matchesType = !typeFilter
      || typeFilter === `category:${normalizedType}`
      || typeFilter === `subtype:${wallet.accountSubType || wallet.walletType}`;
    return matchesSearch && matchesType;
  });

  const getTransactionAmountForSelectedWallet = (tx: Transaction) => {
    if (tx.type !== 'transfer') return tx.amount;
    return getRefId(tx.destinationWalletId) === selectedWalletId && tx.destinationAmount ? tx.destinationAmount : tx.amount;
  };

  const getTransactionTitle = (tx: Transaction) => {
    if (tx.type === 'transfer') return 'Wallet-to-wallet transfer';
    return tx.description || tx.note || tx.category || 'Transaction';
  };

  const fetchWallets = async () => {
    try {
      const data = await WalletService.getAll();
      dispatch(setWallets(data));
      if (data.length > 0 && !selectedWalletId) {
        handleSelectWallet(data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch wallets', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelectWallet(walletId: string) {
    setSelectedWalletId(walletId);
    setIsLoadingTx(true);
    try {
      const txData = await TransactionService.getByWallet(walletId);
      const parsedData = Array.isArray(txData) ? txData : [];
      setWalletTransactions(parsedData);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      setWalletTransactions([]);
    } finally {
      setIsLoadingTx(false);
    }
  }

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLettersOnlyName(newWallet.name)) {
      toast.error('Account name can contain letters, spaces, apostrophes, dots, or hyphens only.');
      return;
    }
    if (!isValidAccountIdentifier(newWallet.accountNumber, newWallet.walletType)) {
      toast.error('Please enter a valid account number, IBAN, or wallet identifier.');
      return;
    }
    setIsSubmitting(true);
    try {
      await WalletService.create({
        name: newWallet.name,
        balance: Number(newWallet.balance),
        currency: newWallet.currency,
        walletType: newWallet.walletType,
        accountSubType: newWallet.accountSubType,
        bankName: newWallet.walletType === 'Bank Account' ? newWallet.bankName : undefined,
        accountNumber: newWallet.accountNumber.replace(/\s/g, ''),
        creditLimit: newWallet.walletType === 'Credit Account' ? Number(newWallet.creditLimit) : undefined
      });
      dispatch(addNotification({
        kind: 'wallet',
        title: 'Wallet created',
        message: `${newWallet.name} was added to your accounts.`,
      }));
      toast.success('Wallet created successfully!');
      setNewWallet({ name: '', balance: '', currency: 'PKR', walletType: 'Manual/Cash', accountSubType: 'Cash', bankName: 'Meezan Bank', accountNumber: '', creditLimit: '' });
      setShowCreateModal(false);
      await fetchWallets(); 
    } catch (error) {
      toast.error('Failed to create wallet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (!confirm('Delete this wallet? Its balance account will be removed.')) return;
    try {
      await WalletService.delete(walletId);
      if (selectedWalletId === walletId) {
        setSelectedWalletId(null);
        setWalletTransactions([]);
      }
      toast.success('Wallet deleted successfully!');
      await fetchWallets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete wallet.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.sourceWalletId === transferForm.destinationWalletId) {
      toast.error('Cannot transfer to the same wallet.');
      return;
    }
    
    setIsTransferring(true);
    try {
      await TransactionService.transfer({
        sourceWalletId: transferForm.sourceWalletId,
        destinationWalletId: transferForm.destinationWalletId,
        amount: Number(transferForm.amount)
      });
      dispatch(addNotification({
        kind: 'transaction',
        title: 'Transfer completed',
        message: `${Number(transferForm.amount).toLocaleString()} moved between wallets.`,
      }));
      
      setTransferForm({ sourceWalletId: '', destinationWalletId: '', amount: '' });
      await fetchWallets(); 
      if (selectedWalletId) handleSelectWallet(selectedWalletId);
      
      toast.success('Transfer successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed. Check balance or limits.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Wallets & Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your balances and swift wallet-to-wallet transfers.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
        >
          <Plus size={18} /> Add Account
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search wallets by account, bank, or currency..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-cyan-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        >
          <option value="">All Account Types</option>
          <optgroup label="Account Categories">
            {ACCOUNT_CATEGORIES.map((type) => (
              <option key={type} value={`category:${type}`}>{type}</option>
            ))}
          </optgroup>
          <optgroup label="Account Sub-Types">
            {Array.from(new Set(Object.values(ACCOUNT_SUBTYPES).flat())).map((type) => (
              <option key={type} value={`subtype:${type}`}>{type}</option>
            ))}
          </optgroup>
          <option value="others">Others</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Your Portfolios</h2>
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">Loading wallets...</div>
            ) : wallets.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm font-medium">
                No accounts found. Click "Add Account" to get started.
              </div>
            ) : visibleWallets.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm font-medium dark:bg-slate-900 dark:border-slate-800">
                No wallets match your current search or filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleWallets.map((wallet: any) => (
                  <div 
                    key={wallet._id} 
                    onClick={() => handleSelectWallet(wallet._id)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-48 ${
                      selectedWalletId === wallet._id 
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 shadow-md ring-1 ring-blue-600' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        selectedWalletId === wallet._id ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                      }`}>
                        <WalletIcon size={20} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWallet(wallet._id);
                          }}
                          className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                          title="Delete wallet"
                        >
                          <Trash2 size={12} />
                        </button>
                        <Link
                          href={`/dashboard/transactions?walletId=${wallet._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <ListFilter size={12} /> Transactions
                        </Link>
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm font-bold mb-0.5 ${selectedWalletId === wallet._id ? 'text-blue-800 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {wallet.name}
                      </p>
                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(wallet.balance || 0, wallet.currency)}
                      </h3>
                      {wallet.accountNumber && (
                        <p className="text-xs font-mono font-medium text-slate-400 mt-1">
                          {maskAccountNumber(wallet.accountNumber)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                 Recent Activity
                 {selectedWalletId && (
                   <span className="text-blue-600 dark:text-blue-400">: {wallets.find((w) => w._id === selectedWalletId)?.name}</span>
                 )}
               </h2>
               {selectedWalletId && (
                 <Link href={`/dashboard/transactions?walletId=${selectedWalletId}`} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                   View All
                 </Link>
               )}
             </div>
             {!selectedWalletId ? (
                <div className="py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  Select a wallet above to view its recent transaction history.
                </div>
             ) : isLoadingTx ? (
                <div className="py-8 text-center text-sm font-medium text-slate-400 animate-pulse">Loading transactions...</div>
             ) : (!Array.isArray(walletTransactions) || walletTransactions.length === 0) ? (
                <div className="py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No transactions found for this wallet yet.
                </div>
             ) : (
                <div className="space-y-4">
                  {walletTransactions.map((tx) => (
                    <div key={tx._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 
                          tx.type === 'expense' ? 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          {tx.type === 'income' && <ArrowDownLeft size={18} />}
                          {tx.type === 'expense' && <ArrowUpRight size={18} />}
                          {tx.type === 'transfer' && <RefreshCcw size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{getTransactionTitle(tx)}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {tx.type === 'transfer' ? 'Internal Transfer' : tx.category || 'General'} • {new Date(tx.transactionDate || tx.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                        {formatCurrency(
                          getTransactionAmountForSelectedWallet(tx),
                          wallets.find(w => w._id === selectedWalletId)?.currency || 'PKR'
                        )}
                      </span>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft size={18} className="text-slate-700 dark:text-slate-300" />
            <h3 className="font-bold text-slate-800 dark:text-white">Quick Transfer</h3>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">Move money instantly between wallets.</p>
          
          <form onSubmit={handleTransfer} className="space-y-4">
            <select 
              required
              value={transferForm.sourceWalletId}
              onChange={(e) => setTransferForm({...transferForm, sourceWalletId: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
            >
              <option value="" disabled className="dark:bg-slate-900">Select source wallet</option>
              {wallets.map((w: any) => <option key={w._id} value={w._id} className="dark:bg-slate-900">{w.name} ({formatCurrency(w.balance, w.currency)})</option>)}
              <option value="others" className="dark:bg-slate-900">Others</option>
            </select>
            
            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                <ArrowRightLeft size={14} className="rotate-90" />
              </div>
            </div>
            
            <select 
              required
              value={transferForm.destinationWalletId}
              onChange={(e) => setTransferForm({...transferForm, destinationWalletId: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
            >
              <option value="" disabled className="dark:bg-slate-900">Select destination wallet</option>
              {wallets.map((w: any) => <option key={w._id} value={w._id} className="dark:bg-slate-900">{w.name}</option>)}
              <option value="others" className="dark:bg-slate-900">Others</option>
            </select>

            {(() => {
              const sourceWallet = wallets.find((w: any) => w._id === transferForm.sourceWalletId);
              const destWallet = wallets.find((w: any) => w._id === transferForm.destinationWalletId);
              const isCrossCurrency = sourceWallet && destWallet && sourceWallet.currency !== destWallet.currency;
              
              let convertedText = null;
              if (isCrossCurrency && transferForm.amount) {
                const amountInPkr = Number(transferForm.amount) * (RATES_TO_PKR[sourceWallet.currency] || 1);
                const finalAmount = amountInPkr / (RATES_TO_PKR[destWallet.currency] || 1);
                
                convertedText = (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-medium text-blue-700">
                    <p>Cross-currency transfer detected.</p>
                    <p>PKR base value: <strong>{formatCurrency(amountInPkr, 'PKR')}</strong></p>
                    <p>Recipient gets: <strong>{formatCurrency(finalAmount, destWallet.currency)}</strong></p>
                  </div>
                );
              }

              return (
                <>
                  <div className="relative pt-2">
                    <span className="absolute left-4 top-[26px] text-slate-400 font-bold">
                      {sourceWallet ? (sourceWallet.currency === 'PKR' ? 'Rs' : sourceWallet.currency === 'EUR' ? '€' : sourceWallet.currency === 'GBP' ? '£' : '$') : 'Rs'}
                    </span>
                    <input 
                      required 
                      type="number" 
                      min="0.01" step="0.01"
                      placeholder="0.00" 
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                      className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 dark:text-white" 
                    />
                  </div>
                  {convertedText}
                </>
              );
            })()}

            <button 
              type="submit" 
              disabled={isTransferring || wallets.length < 2}
              className="w-full py-3 mt-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isTransferring ? 'Processing...' : 'Transfer Funds'}
            </button>
          </form>
        </div>
      </div>

      {/* CREATE WALLET MODAL WITH CONDITIONAL INPUTS */}
      {showCreateModal && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Account</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Account Name</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. HBL Bank, JazzCash..." 
                  value={newWallet.name}
                  onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
                  pattern="[A-Za-z][A-Za-z\s.'-]*"
                  title="Use letters, spaces, apostrophes, dots, or hyphens only."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Account Category</label>
                  <select
                    value={newWallet.walletType}
                    onChange={(e) => setNewWallet({...newWallet, walletType: e.target.value, accountSubType: ACCOUNT_SUBTYPES[e.target.value][0]})}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  >
                    {ACCOUNT_CATEGORIES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Currency</label>
                  <select
                    value={newWallet.currency}
                    onChange={(e) => setNewWallet({...newWallet, currency: e.target.value})}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  >
                    <option value="PKR">PKR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Account Sub-Type</label>
                <select
                  value={newWallet.accountSubType}
                  onChange={(e) => setNewWallet({...newWallet, accountSubType: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                >
                  {ACCOUNT_SUBTYPES[newWallet.walletType].map((subType) => (
                    <option key={subType} value={subType}>{subType}</option>
                  ))}
                </select>
              </div>

              {/* Conditional Bank Name */}
              {newWallet.walletType === 'Bank Account' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Institution</label>
                  <select
                    value={newWallet.bankName}
                    onChange={(e) => setNewWallet({...newWallet, bankName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  >
                    {FINANCIAL_INSTITUTIONS.map((institution) => (
                      <option key={institution} value={institution}>{institution}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* New Account Number Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {newWallet.walletType === 'Bank Account' ? 'Account Number / IBAN' : 'Account Identifier'}
                </label>
                <input 
                  type="text" 
                  placeholder={newWallet.walletType === 'Bank Account' ? 'e.g. PK36 SCBL 0000 0011 2345 6702' : 'e.g. phone, email, or wallet ID'} 
                  value={newWallet.accountNumber}
                  onChange={(e) => setNewWallet({
                    ...newWallet,
                    accountNumber: newWallet.walletType === 'Bank Account'
                      ? formatBankIdentifierInput(e.target.value)
                      : e.target.value,
                  })}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none focus:border-blue-500 ${newWallet.accountNumber && !isValidAccountIdentifier(newWallet.accountNumber, newWallet.walletType) ? 'border-red-300 focus:border-red-500' : 'border-slate-200'}`} 
                />
                {newWallet.accountNumber && !isValidAccountIdentifier(newWallet.accountNumber, newWallet.walletType) && (
                  <p className="mt-1 text-xs font-semibold text-red-500">
                    {newWallet.walletType === 'Bank Account'
                      ? 'Enter a valid account number or IBAN format.'
                      : 'Enter a wallet identifier with at least 3 characters.'}
                  </p>
                )}
              </div>

              {/* Conditional Credit Limit */}
              {newWallet.walletType === 'Credit Account' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Credit Limit</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    placeholder="300000" 
                    value={newWallet.creditLimit}
                    onChange={(e) => setNewWallet({...newWallet, creditLimit: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {newWallet.walletType === 'Credit Account' ? 'Used Credit / Balance' : 'Starting Balance'}
                </label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={newWallet.balance}
                  onChange={(e) => setNewWallet({...newWallet, balance: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Account Details'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
