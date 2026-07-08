import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import walletReducer from './walletSlice';
import budgetReducer from './budgetSlice';
import savingsReducer from './savingsSlice';
import themeReducer from './themeSlice';
import notificationReducer from './notificationSlice';
import transactionReducer from './transactionSlice';
import statsReducer from './statsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallets: walletReducer,
    budgets: budgetReducer,
    savings: savingsReducer,
    theme: themeReducer,
    notifications: notificationReducer,
    transactions: transactionReducer,
    stats: statsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
