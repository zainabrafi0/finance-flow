'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnalyticsService } from '../../services/analytics.service';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchDashboardSummary } from '../../store/statsSlice';
import { ArrowDownLeft, ArrowUpRight, BarChart3, FolderKanban, TrendingUp, WalletCards } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type DashboardData = {
  overview?: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
  };
  recentTransactions?: any[];
  activeBudgets?: any[];
  savingsGoals?: any[];
};

const formatCurrency = (amount = 0, currency = 'PKR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const summary = useAppSelector((state) => state.stats.summary);
  const isStatsLoading = useAppSelector((state) => state.stats.isLoading);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTxLoading, setIsTxLoading] = useState(true);
  const [reportRange, setReportRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    dispatch(fetchDashboardSummary());
    TransactionService.getAll({ limit: 500 })
      .then(setTransactions)
      .catch((error) => console.error('Failed to load transactions for dashboard charts', error))
      .finally(() => setIsTxLoading(false));
  }, [dispatch]);

  const isLoading = isStatsLoading || isTxLoading;
  const data = (summary || {}) as any;

  const budgets = data.activeBudgets || [];
  const recentTransactions = data.recentTransactions || [];
  const budgetTotals = useMemo(() => {
    const totalBudget = budgets.reduce((sum: number, budget: any) => sum + (budget.limit || budget.amount || 0), 0);
    const totalSpent = budgets.reduce((sum: number, budget: any) => sum + (budget.spent || 0), 0);
    return {
      totalBudget,
      totalSpent,
      utilization: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0,
    };
  }, [budgets]);

  const reportData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeStart = reportRange === 'week' ? startOfWeek : reportRange === 'month' ? startOfMonth : null;

    const inRange = transactions.filter((tx) => {
      if (!rangeStart) return true;
      return new Date(tx.transactionDate || tx.date || tx.createdAt || '') >= rangeStart;
    });

    const weekly = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      const daily = transactions.filter((tx) => new Date(tx.transactionDate || tx.date || tx.createdAt || '').toDateString() === date.toDateString());
      return {
        label,
        income: daily.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
        expense: daily.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
      };
    });

    const monthly = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const label = date.toLocaleDateString('en-US', { month: 'short' });
      const monthTx = transactions.filter((tx) => {
        const txDate = new Date(tx.transactionDate || tx.date || tx.createdAt || '');
        return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
      });
      return {
        label,
        income: monthTx.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
        expense: monthTx.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
      };
    });

    const totals = inRange.reduce(
      (acc, tx) => {
        if (tx.type === 'income') acc.income += tx.amount;
        if (tx.type === 'expense') acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );

    const categories = inRange
      .filter((tx) => tx.type === 'expense')
      .reduce<Record<string, number>>((acc, tx) => {
        const category = tx.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + tx.amount;
        return acc;
      }, {});

    const categoryRows = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      weekly,
      monthly,
      totals,
      categories: categoryRows,
      topCategories: categoryRows.slice(0, 5),
      net: totals.income - totals.expense,
    };
  }, [transactions, reportRange]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">Loading your financial dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Overview</h1>
          <p className="text-sm text-slate-500 font-medium">Your dashboard reflects the wallets, transactions, budgets, and goals you create.</p>
        </div>
        <Link href="/dashboard/transactions" className="text-sm font-bold text-blue-600 hover:text-blue-700">
          View Report
        </Link>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Reports & Analytics</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Weekly reports, monthly reports, category-wise reports, income vs expense, and spending trends.</p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setReportRange(range)}
                className={`px-4 py-2 text-xs font-extrabold uppercase rounded-lg transition-colors ${
                  reportRange === range ? 'bg-white text-cyan-700 shadow-sm dark:bg-slate-700 dark:text-cyan-200' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {range === 'week' ? 'Last Week' : range === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900">
            <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">Income Summary</p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-200">{formatCurrency(reportData.totals.income)}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4 border border-red-100 dark:bg-red-950/40 dark:border-red-900">
            <p className="text-xs font-bold uppercase text-red-700 dark:text-red-300">Expense Summary</p>
            <p className="text-2xl font-extrabold text-red-700 dark:text-red-200">{formatCurrency(reportData.totals.expense)}</p>
          </div>
          <div className="rounded-xl bg-cyan-50 p-4 border border-cyan-100 dark:bg-cyan-950/40 dark:border-cyan-900">
            <p className="text-xs font-bold uppercase text-cyan-700 dark:text-cyan-300">Net Flow</p>
            <p className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-200">{formatCurrency(reportData.net)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Spending Trends</h3>
              <TrendingUp size={18} className="text-cyan-600" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportRange === 'week' ? reportData.weekly : reportData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="income" fill="#059669" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="#dc2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3">Top Spending Categories</h3>
            {reportData.topCategories.length === 0 ? (
              <p className="text-sm font-medium text-slate-500">No expense categories in this range.</p>
            ) : (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={reportData.topCategories} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={3}>
                        {reportData.topCategories.map((entry, index) => (
                          <Cell key={entry.name} fill={['#0891b2', '#ea580c', '#7c3aed', '#16a34a', '#db2777'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {reportData.topCategories.map((category) => (
                    <div key={category.name} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{category.name}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(category.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Balance</p>
            <WalletCards size={22} className="text-blue-300" />
          </div>
          <p className="text-3xl font-extrabold">{formatCurrency(data.overview?.totalBalance || 0)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft size={20} />
            </span>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Monthly Income</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(data.overview?.monthlyIncome || 0)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 flex items-center justify-center">
              <ArrowUpRight size={20} />
            </span>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Monthly Expenses</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(data.overview?.monthlyExpense || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">No transactions yet. Add income or expenses to populate this table.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx: any) => {
                const isIncome = tx.type === 'income';
                const walletCurrency = tx.walletId?.currency || 'PKR';
                return (
                  <div key={tx._id} className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{tx.description || tx.note || 'Wallet transfer'}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{tx.category || tx.categoryId?.name || 'Uncategorized'} • {tx.walletId?.name || 'Wallet'}</p>
                    </div>
                    <p className={`font-extrabold ${isIncome ? 'text-emerald-600' : tx.type === 'expense' ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                      {isIncome ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(Math.abs(tx.amount), walletCurrency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Budget Utilization</h2>
              <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mb-4">
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${Math.min(budgetTotals.utilization, 100)}%` }} />
              </div>
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400">{budgetTotals.utilization}% utilized</p>
            </div>
            <Link href="/dashboard/budgeting" className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
              <FolderKanban size={16} /> Manage Budgets
            </Link>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Savings Progress</h2>
            {(data.savingsGoals || []).length === 0 ? (
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No savings goals yet.</p>
            ) : (
              (data.savingsGoals || []).map((goal: any) => (
                <div key={goal._id} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>{goal.name}</span>
                    <span>{Math.round(goal.completionPercentage || 0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: `${Math.min(goal.completionPercentage || 0, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
