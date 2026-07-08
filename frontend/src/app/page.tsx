'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, BellRing, Layers3, LockKeyhole, Moon, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';

const features = [
  { icon: WalletCards, title: 'Accounts in one place', body: 'Cash, bank accounts, credit accounts, and digital wallets stay organized together.' },
  { icon: BarChart3, title: 'Clear spending insight', body: 'See where your money goes with simple trends, categories, and monthly summaries.' },
  { icon: BellRing, title: 'Helpful reminders', body: 'Stay ahead of budgets, savings goals, transfers, and important account activity.' },
  { icon: LockKeyhole, title: 'Private by design', body: 'Your financial workspace stays personal, protected, and easy to return to.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f3fbfb] text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-cyan-950/10 bg-[#f3fbfb]/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 text-sm font-black tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white dark:bg-cyan-400 dark:text-slate-950">FF</span>
            FinanceFlow
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10">
              Login
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-slate-950/10 hover:bg-cyan-800 dark:bg-cyan-400 dark:text-slate-950">
              Register <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 pb-16 pt-28 lg:grid-cols-[1fr_560px]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-800 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200">
            <Sparkles size={14} /> Personal finance dashboard
          </div>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
            FinanceFlow
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-slate-300">
            Plan budgets, track spending, move money between accounts, and grow savings from one calm financial workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-cyan-700 px-6 py-3 text-sm font-black text-white shadow-xl shadow-cyan-700/20 hover:bg-cyan-800">
              Create Account <ArrowRight size={17} />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-800 hover:border-cyan-300 dark:border-white/10 dark:bg-white/10 dark:text-white">
              Login
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="landing-grid absolute inset-0 rounded-[2rem]" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-cyan-950/10 dark:border-white/10 dark:bg-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/10">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-200">Dashboard preview</p>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Live user financial graph</p>
              </div>
              <img src="/globe.svg" alt="" className="h-9 w-9 opacity-70 dark:invert" />
            </div>
            <div className="grid gap-4 p-5">
              <div className="rounded-2xl bg-slate-950 p-5 text-white dark:bg-slate-900">
                <p className="text-xs font-black uppercase text-cyan-200">Total Balance</p>
                <p className="mt-3 text-4xl font-black">PKR 1.84M</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-4/5 rounded-full bg-cyan-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 p-5 dark:border-white/10">
                  <WalletCards className="text-cyan-700 dark:text-cyan-200" />
                  <p className="mt-5 text-2xl font-black">6</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Wallets linked</p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-5 dark:border-white/10">
                  <Moon className="text-violet-700 dark:text-violet-200" />
                  <p className="mt-5 text-2xl font-black">Dark</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Theme ready</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 p-5 dark:border-white/10">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-black">Spending trend</p>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">+18%</span>
                </div>
                <div className="flex h-28 items-end gap-2">
                  {[42, 66, 38, 80, 56, 92, 74, 88].map((height, index) => (
                    <div key={index} className="flex-1 rounded-t-lg bg-cyan-600/80 dark:bg-cyan-300/80" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-cyan-950/10 bg-white py-20 dark:border-white/10 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-200">Product features</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight">Built like a serious finance platform, polished like modern consumer software.</h2>
            </div>
            <ShieldCheck className="hidden text-cyan-700 dark:text-cyan-200 md:block" size={44} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-[#f8fcfc] p-6 dark:border-white/10 dark:bg-white/5">
                <Icon className="text-cyan-700 dark:text-cyan-200" size={26} />
                <h3 className="mt-6 text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-3">
        {[
          ['Budget with confidence', 'Set monthly limits, follow category progress, and spot overspending before it surprises you.'],
          ['Save with purpose', 'Create goals, fund them from real accounts, and watch progress build over time.'],
          ['Understand your cash flow', 'Review transactions, transfers, balances, and trends without switching between tools.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-cyan-950/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Layers3 className="mb-8 text-cyan-700 dark:text-cyan-200" size={28} />
            <h3 className="text-2xl font-black">{title}</h3>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
