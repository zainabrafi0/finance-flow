import { api } from './api';

export const SavingsService = {
  getAll: async () => (await api.get('/savings')).data,
  create: async (data: any) => (await api.post('/savings', data)).data,
  addFunds: async (goalId: string, data: { walletId: string; amount: number }) => 
    (await api.post(`/savings/${goalId}/add-funds`, data)).data,
};