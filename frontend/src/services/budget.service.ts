import { api } from './api';

export const BudgetService = {
  getProgress: async (month: string, year: number) => {
    const response = await api.get('/budgets/progress', { params: { month, year } });
    return response.data;
  },
  createOrUpdate: async (data: { category: string; limit: number; month: string; year: number }) => {
    const response = await api.post('/budgets', data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};