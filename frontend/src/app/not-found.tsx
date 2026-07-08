import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="max-w-md text-center">
        <p className="text-sm font-black uppercase tracking-wider text-cyan-300">404</p>
        <h1 className="mt-4 text-4xl font-black">Page not found</h1>
        <p className="mt-4 text-sm font-medium leading-6 text-slate-300">
          The FinanceFlow page you requested does not exist or has moved.
        </p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
