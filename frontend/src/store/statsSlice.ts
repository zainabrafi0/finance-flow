import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AnalyticsService, DashboardSummary } from '../services/analytics.service';

interface StatsState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StatsState = {
  summary: null,
  isLoading: false,
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk(
  'stats/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const data = await AnalyticsService.getSummary();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard summary');
    }
  }
);

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    clearStats: (state) => {
      state.summary = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearStats } = statsSlice.actions;
export default statsSlice.reducer;
