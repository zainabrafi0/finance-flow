'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../services/auth.service';
import Link from 'next/link';
import { CheckCircle2, Shield, Sparkles, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    otpCode: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setOtpSending(true);
    setOtpSuccessMessage('');
    try {
      await AuthService.sendOtp({ email: formData.email, purpose: 'registration' });
      setOtpSent(true);
      setOtpSuccessMessage('Verification code sent successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-flight Validation: Ensure passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    if (!formData.otpCode) {
      setError('Please request and enter your verification code.');
      return;
    }

    setIsLoading(true);

    try {
      // Strip out confirmPassword before sending to the backend
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        otpCode: formData.otpCode,
      };

      await AuthService.register(payload);
      router.push('/login?registered=1');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef7f8] p-6 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <Link href="/" className="mb-10 inline-flex items-center gap-3 text-sm font-extrabold text-cyan-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white">FF</span>
            FinanceFlow
          </Link>
          <h1 className="max-w-xl text-5xl font-black tracking-tight text-slate-950">
            Build better money habits from day one.
          </h1>
          <p className="mt-5 max-w-lg text-base font-medium leading-7 text-slate-600">
            Create your FinanceFlow account and start organizing accounts, budgets, savings goals, and everyday spending in one place.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: Shield, label: 'Private' },
              { icon: UserPlus, label: 'Personal' },
              { icon: Sparkles, label: 'Simple' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
                <Icon className="mb-3 text-cyan-700" size={22} />
                <p className="text-sm font-extrabold text-slate-800">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="relative w-full rounded-[1.75rem] border border-white/80 bg-white p-8 shadow-2xl shadow-cyan-950/10 md:p-10">
        
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-lg shadow-cyan-700/20">
            <CheckCircle2 size={26} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Join FinanceFlow to manage your wealth
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/50 backdrop-blur-md border border-red-200/60 text-red-600 text-sm font-medium rounded-2xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 ml-1">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none transition-all placeholder-slate-400 text-slate-800 text-sm"
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 ml-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none transition-all placeholder-slate-400 text-slate-800 text-sm"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 ml-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none transition-all placeholder-slate-400 text-slate-800 text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 ml-1">Verification Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="otpCode"
                required
                maxLength={6}
                value={formData.otpCode}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none transition-all placeholder-slate-400 text-slate-800 text-sm font-semibold tracking-wider text-center"
                placeholder="123456"
              />
              <button
                type="button"
                disabled={otpSending || !formData.email}
                onClick={handleSendOtp}
                className="px-4 py-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-extrabold rounded-xl text-xs transition-colors border border-cyan-200/50 disabled:opacity-50 min-w-[90px]"
              >
                {otpSending ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
              </button>
            </div>
            {otpSuccessMessage && (
              <p className="text-[11px] font-bold text-emerald-600 mt-1 ml-1">{otpSuccessMessage}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 ml-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none transition-all placeholder-slate-400 text-slate-800 text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 ml-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none transition-all placeholder-slate-400 text-slate-800 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-4 bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-700/20 hover:bg-cyan-800 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-cyan-700 hover:underline transition-colors">
            Log in
          </Link>
        </p>
      </div>
      </div>
    </main>
  );
}
