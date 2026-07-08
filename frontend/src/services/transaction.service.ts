import { api } from './api';

export interface Transaction {
  _id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  destinationAmount?: number | null;
  exchangeRate?: number;
  category: string;
  description: string;
  note?: string;
  date: string;
  transactionDate?: string;
  createdAt?: string;
  walletId?: { _id: string; name: string; currency?: string } | string;
  destinationWalletId?: { _id: string; name: string; currency?: string } | string | null;
}

export const TransactionService = {
  getAll: async (params?: {
    walletId?: string;
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    limit?: number;
  }): Promise<Transaction[]> => {
    const response = await api.get('/transactions', { params });
    return response.data?.data || response.data || [];
  },

  // TRY THIS: Change query string to path parameter if your backend expects /transactions/wallet/:id
  getByWallet: async (walletId: string): Promise<Transaction[]> => {
    const response = await api.get(`/transactions/wallet/${walletId}`);
    return response.data?.data || response.data || [];
  },

  create: async (data: {
    walletId: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
  }) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  transfer: async (data: { sourceWalletId: string; destinationWalletId: string; amount: number }) => {
    const payload = {
      walletId: data.sourceWalletId,
      destinationWalletId: data.destinationWalletId,
      amount: Number(data.amount),
      type: 'transfer',
      category: 'Transfer',
      description: 'Wallet transfer',
    };
    
    const response = await api.post('/transactions', payload); 
    return response.data;
  },

  update: async (transactionId: string, data: { password: string; category?: string; description?: string }) => {
    const response = await api.patch(`/transactions/${transactionId}`, data);
    return response.data;
  },

  delete: async (transactionId: string, password: string) => {
    const response = await api.delete(`/transactions/${transactionId}`, { data: { password } });
    return response.data;
  },
};
