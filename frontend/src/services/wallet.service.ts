import { api } from './api';

export const WalletService = {
  getAll: async () => {
    const response = await api.get('/wallets');
    return response.data;
  },
  create: async (data: {
    name: string;
    currency: string;
    balance?: number;
    walletType?: string;
    accountSubType?: string;
    bankName?: string;
    accountNumber?: string;
    creditLimit?: number;
  }) => {
    const response = await api.post('/wallets', data);
    return response.data;
  },
  delete: async (walletId: string) => {
    const response = await api.delete(`/wallets/${walletId}`);
    return response.data;
  },
};
