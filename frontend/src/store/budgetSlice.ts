import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CategoryBudget {
  _id: string;
  category: string;
  limit: number;
  spent: number;
  utilizationPercentage: number;
}

interface BudgetOverview {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  totalUtilization: number;
}

interface BudgetState {
  overview: BudgetOverview;
  categories: CategoryBudget[];
}

const initialState: BudgetState = {
  overview: {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    totalUtilization: 0,
  },
  categories: [],
};

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    setBudgetData: (state, action: PayloadAction<BudgetState>) => {
      state.overview = action.payload.overview;
      state.categories = action.payload.categories;
    },
  },
});

export const { setBudgetData } = budgetSlice.actions;
export default budgetSlice.reducer;