import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SavingsGoal {
  _id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: string;
}

interface SavingsState {
  goals: SavingsGoal[];
}

const initialState: SavingsState = { goals: [] };

const savingsSlice = createSlice({
  name: 'savings',
  initialState,
  reducers: {
    setGoals: (state, action: PayloadAction<SavingsGoal[]>) => {
      state.goals = action.payload;
    },
    updateGoal: (state, action: PayloadAction<SavingsGoal>) => {
      const index = state.goals.findIndex(g => g._id === action.payload._id);
      if (index !== -1) state.goals[index] = action.payload;
    }
  },
});

export const { setGoals, updateGoal } = savingsSlice.actions;
export default savingsSlice.reducer;