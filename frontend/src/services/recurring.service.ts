import { api } from './api';

export interface RecurringTransaction {
  _id: string;
  walletId: any;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRunDate: string;
  isActive: boolean;
  createdAt: string;
}

export const RecurringService = {
  getAll: async (): Promise<RecurringTransaction[]> => {
    const response = await api.get('/recurring');
    return response.data || [];
  },

  create: async (data: {
    walletId: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    frequency: string;
    nextRunDate: string;
  }) => {
    const response = await api.post('/recurring', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      walletId?: string;
      type?: string;
      amount?: number;
      category?: string;
      description?: string;
      frequency?: string;
      nextRunDate?: string;
      isActive?: boolean;
    },
  ) => {
    const response = await api.patch(`/recurring/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/recurring/${id}`);
    return response.data;
  },
};
