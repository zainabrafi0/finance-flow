'use client';

import { useEffect, useState } from 'react';
import TransactionModal from '../../components/TransactionModal';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout, setCredentials } from '../../store/authSlice';
import { setWallets } from '../../store/walletSlice';
import { clearNotifications, markAllRead } from '../../store/notificationSlice';
import { toggleTheme } from '../../store/themeSlice';
import { useWebSockets } from '../../hooks/useWebSockets';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  PieChart, 
  PiggyBank, 
  Plus, 
  HelpCircle, 
  LogOut, 
  Search, 
  Bell, 
  Settings,
  Moon,
  Sun,
  Trash2,
  X,
  Menu,
  RefreshCw
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useWebSockets();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { items: notifications } = useAppSelector((state) => state.notifications);
  const { mode } = useAppSelector((state) => state.theme);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname(); // Tells us which page is active
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;
    router.push(`/dashboard/transactions?q=${encodeURIComponent(query)}`);
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Wallets', icon: Wallet, path: '/dashboard/wallets' },
    { name: 'Transactions', icon: ArrowRightLeft, path: '/dashboard/transactions' },
    { name: 'Budgeting', icon: PieChart, path: '/dashboard/budgeting' },
    { name: 'Savings', icon: PiggyBank, path: '/dashboard/savings' },
    { name: 'Recurring', icon: RefreshCw, path: '/dashboard/recurring' },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');

  useEffect(() => {
    if (user && showProfileModal) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user, showProfileModal]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('firstName', profileForm.firstName);
      formData.append('lastName', profileForm.lastName);
      if (profileFile) {
        formData.append('file', profileFile);
      }

      const res = await AuthService.updateProfile(formData);
      dispatch(setCredentials({ user: res.user }));
      
      // Update localStorage manually just in case
      localStorage.setItem('user', JSON.stringify(res.user));

      alert('Profile updated successfully!');
      setShowProfileModal(false);
      setProfileFile(null);
      setProfilePreview('');
    } catch (err: any) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!isAuthenticated && !storedUser) {
      router.replace('/login');
      return;
    }

    WalletService.getAll()
      .then((data) => dispatch(setWallets(data)))
      .catch((error) => console.error('Failed to load wallets for dashboard shell', error));
  }, [dispatch, isAuthenticated, router]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex dark:bg-slate-900 dark:border-slate-800">
        <div>
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
              FF
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight dark:text-white">FinanceFlow</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider dark:text-slate-400">Wealth Management</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive 
                      ? 'bg-cyan-600 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Actions */}
        <div className="p-4 space-y-2 border-t border-slate-100">
          <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors"
          >
            <Plus size={18} />
             Add Transaction
         </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <HelpCircle size={18} className="text-slate-400" />
            Help Center
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut size={18} className="text-slate-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navigation Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 dark:bg-slate-900 dark:border-slate-800">
          
          <div className="flex items-center w-full max-w-xl">
            {/* Mobile Sidebar Trigger Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden mr-3 p-2 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Open Menu"
            >
              <Menu size={20} />
            </button>

            {/* Global Search */}
            <form onSubmit={handleGlobalSearch} className="flex items-center w-full bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-2.5 dark:bg-slate-800 dark:border-slate-700">
              <Search size={18} className="text-slate-400 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-700 placeholder-slate-400 dark:text-slate-100"
              />
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-5 ml-4 relative">
            <button
              onClick={() => {
                setShowNotifications((value) => !value);
                dispatch(markAllRead());
              }}
              className="relative text-slate-500 hover:text-slate-800 transition-colors dark:text-slate-300 dark:hover:text-white"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] leading-4 text-center rounded-full border-2 border-white dark:border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowSettings((value) => !value)}
              className="text-slate-500 hover:text-slate-800 transition-colors dark:text-slate-300 dark:hover:text-white"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold ml-2 border border-cyan-200 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-800 overflow-hidden"
              title="Edit Profile"
            >
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-12 top-12 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Notifications</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Wallets, transactions, budgets, and goals.</p>
                  </div>
                  <button onClick={() => dispatch(clearNotifications())} className="text-slate-400 hover:text-red-500" title="Clear notifications">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-sm font-medium text-slate-500 dark:text-slate-400">No notifications yet.</p>
                  ) : (
                    notifications.map((item) => (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{item.message}</p>
                          </div>
                          <span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200">
                            {item.kind}
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {showSettings && (
              <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Settings</h3>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Appearance</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Switch light and dark mode.</p>
                  </div>
                  <button
                    onClick={() => dispatch(toggleTheme())}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    title="Toggle theme"
                  >
                    {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Content (This is where page.tsx gets injected) */}
        <div className="flex-1 overflow-y-auto p-8 dark:bg-slate-950">
          {children}
        </div>
      </main>

      {/* Global Transaction Modal Overlay */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Global Profile Modal Overlay */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
              <button onClick={() => { setShowProfileModal(false); setProfileFile(null); setProfilePreview(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Profile Picture Upload/Preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-cyan-100 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-700 dark:text-cyan-200 font-bold text-2xl overflow-hidden relative group">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                  Upload New Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">First Name</label>
                <input
                  required
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Last Name</label>
                <input
                  required
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
          {/* Drawer container */}
          <aside className="w-64 bg-white h-full flex flex-col justify-between dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-250">
            <div>
              {/* Logo Area */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                    FF
                  </div>
                  <div>
                    <h1 className="font-bold text-slate-800 text-lg leading-tight dark:text-white">FinanceFlow</h1>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider dark:text-slate-400">Wealth Management</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={item.name} 
                      href={item.path}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive 
                          ? 'bg-cyan-600 text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Bottom Actions */}
            <div className="p-4 space-y-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => { setIsMobileSidebarOpen(false); setIsModalOpen(true); }}
                className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors"
              >
                <Plus size={18} />
                Add Transaction
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
              >
                <LogOut size={18} className="text-slate-400" />
                Logout
              </button>
            </div>
          </aside>
          {/* Backdrop click area */}
          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-50 space-y-3">
        {notifications.filter((item) => !item.read).slice(0, 2).map((item) => (
          <div key={item.id} className="w-80 rounded-2xl border border-cyan-100 bg-white p-4 shadow-2xl shadow-cyan-950/10 dark:bg-slate-900 dark:border-cyan-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{item.message}</p>
              </div>
              <span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-black uppercase text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200">
                {item.kind}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
