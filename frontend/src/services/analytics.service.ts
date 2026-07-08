import { api } from './api';

export interface DashboardSummary {
  overview: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
  };
  recentTransactions: any[];
  activeBudgets: any[];
  savingsGoals: any[];
}

export const AnalyticsService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },
};
