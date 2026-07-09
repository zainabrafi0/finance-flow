'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { useEffect } from 'react';
import { setCredentials } from './authSlice';
import { setNotifications } from './notificationSlice';
import { setTheme } from './themeSlice';
import { Toaster } from 'react-hot-toast';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user && !store.getState().auth.isAuthenticated) {
      store.dispatch(setCredentials({ user: JSON.parse(user) }));
    }

    const storedTheme = localStorage.getItem('financeflow-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      store.dispatch(setTheme(storedTheme));
    }

    try {
      const storedNotifications = JSON.parse(localStorage.getItem('financeflow-notifications') || '[]');
      if (Array.isArray(storedNotifications)) {
        store.dispatch(setNotifications(storedNotifications));
      }
    } catch {
      store.dispatch(setNotifications([]));
    }

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      localStorage.setItem('financeflow-theme', state.theme.mode);
      localStorage.setItem('financeflow-notifications', JSON.stringify(state.notifications.items));
      document.documentElement.classList.toggle('dark', state.theme.mode === 'dark');
    });

    document.documentElement.classList.toggle('dark', store.getState().theme.mode === 'dark');
    return unsubscribe;
  }, []);

  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-right" reverseOrder={false} />
    </Provider>
  );
}
