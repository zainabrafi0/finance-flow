'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/authSlice';
import { AuthService } from '../../services/auth.service';
import Link from 'next/link';
import { LockKeyhole, Mail, ShieldCheck, X } from 'lucide-react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password flow states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotSendingOtp, setForgotSendingOtp] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await AuthService.login({ email, password });
      dispatch(setCredentials({ user: data.user }));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSendOtp = async () => {
    if (!forgotEmail) {
      setForgotError('Please enter your email address first.');
      return;
    }
    setForgotError('');
    setForgotSendingOtp(true);
    setForgotSuccess('');
    try {
      await AuthService.sendOtp({ email: forgotEmail, purpose: 'reset-password' });
      setForgotOtpSent(true);
      setForgotSuccess('Reset code sent successfully!');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setForgotSendingOtp(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (forgotPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    if (!forgotOtp) {
      setForgotError('Please enter the OTP verification code.');
      return;
    }

    setForgotLoading(true);
    try {
      await AuthService.resetPassword({
        email: forgotEmail,
        otpCode: forgotOtp,
        newPassword: forgotPassword,
      });
      setForgotSuccess('Password reset successfully!');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotEmail('');
        setForgotOtp('');
        setForgotPassword('');
        setForgotConfirmPassword('');
        setForgotOtpSent(false);
        setForgotError('');
        setForgotSuccess('');
        setError('Password reset successfully. Please log in.');
      }, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[440px_1fr]">
      <div className="relative w-full rounded-[1.75rem] border border-white/10 bg-white p-8 text-slate-950 shadow-2xl md:p-10">
        
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-lg shadow-cyan-700/30">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-3">
            Welcome Back
          </h1>
          <p className="text-slate-500 font-medium">
            Securely sign in to FinanceFlow
          </p>
        </div>

        {searchParams.get('registered') === '1' && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700">
            Account created. Please log in to continue.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50/50 backdrop-blur-md border border-red-200/60 text-red-600 text-sm font-medium rounded-2xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">
              Email Address
            </label>
            <div className="relative">
            <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-5 font-medium text-slate-800 outline-none transition-all placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
              placeholder="you@example.com"
            />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">
              Password
            </label>
            <div className="relative">
            <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-5 font-medium text-slate-800 outline-none transition-all placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
              placeholder="••••••••"
            />
            </div>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-xs font-bold text-cyan-700 hover:underline transition-all"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-cyan-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-cyan-700/20 hover:bg-cyan-800 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-10 text-center text-sm font-medium text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="font-bold text-cyan-700 hover:text-cyan-800 transition-colors">
            Create one
          </Link>
        </p>
      </div>
      <section className="hidden lg:block">
        <Link href="/" className="mb-10 inline-flex items-center gap-3 text-sm font-extrabold text-cyan-200">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-slate-950">FF</span>
          FinanceFlow
        </Link>
        <h1 className="max-w-xl text-5xl font-black tracking-tight">
          Your command center for spending, budgets, and financial momentum.
        </h1>
        <div className="mt-8 grid max-w-xl grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-3xl font-black text-cyan-200">24/7</p>
          <p className="mt-2 text-sm font-semibold text-slate-300">Private dashboard access</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-3xl font-black text-emerald-200">Live</p>
          <p className="mt-2 text-sm font-semibold text-slate-300">Account and budget updates</p>
          </div>
        </div>
      </section>
      </div>
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleForgotSubmit}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-800">Reset Password</h2>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div className="p-3.5 bg-red-50 text-red-600 text-xs font-semibold rounded-xl text-center">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="p-3.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl text-center">
                {forgotSuccess}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:bg-white text-slate-800 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 ml-1">Verification Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:bg-white text-slate-800 text-sm font-semibold tracking-wider text-center"
                  placeholder="123456"
                />
                <button
                  type="button"
                  disabled={forgotSendingOtp || !forgotEmail}
                  onClick={handleForgotSendOtp}
                  className="px-4 py-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-extrabold rounded-xl text-xs transition-colors border border-cyan-200/50 disabled:opacity-50 min-w-[90px]"
                >
                  {forgotSendingOtp ? 'Sending...' : forgotOtpSent ? 'Resend' : 'Send Code'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 ml-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={forgotPassword}
                onChange={(e) => setForgotPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:bg-white text-slate-800 text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 ml-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:bg-white text-slate-800 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {forgotLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">Loading login...</main>}>
      <LoginPageContent />
    </Suspense>
  );
}
