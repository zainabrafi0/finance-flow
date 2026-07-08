'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="max-w-md text-center">
        <p className="text-sm font-black uppercase tracking-wider text-red-300">Error</p>
        <h1 className="mt-4 text-4xl font-black">Something went wrong</h1>
        <p className="mt-4 text-sm font-medium leading-6 text-slate-300">
          FinanceFlow could not render this page. Try again or return to the dashboard.
        </p>
        <button onClick={reset} className="mt-8 rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950">
          Try Again
        </button>
      </div>
    </main>
  );
}
