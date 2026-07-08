import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TransactionService, Transaction } from '../services/transaction.service';

interface TransactionFilters {
  walletId: string;
  category: string;
  search: string;
  startDate: string;
  endDate: string;
}

interface TransactionState {
  items: Transaction[];
  isLoading: boolean;
  error: string | null;
  filters: TransactionFilters;
  currentPage: number;
  itemsPerPage: number;
}

const initialState: TransactionState = {
  items: [],
  isLoading: false,
  error: null,
  filters: {
    walletId: '',
    category: '',
    search: '',
    startDate: '',
    endDate: '',
  },
  currentPage: 1,
  itemsPerPage: 10,
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as any;
    const { filters } = state.transactions;
    try {
      const data = await TransactionService.getAll({
        walletId: filters.walletId || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 100,
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (
    payload: {
      walletId: string;
      type: 'income' | 'expense';
      amount: number;
      category: string;
      description: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const data = await TransactionService.create(payload);
      dispatch(fetchTransactions());
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create transaction');
    }
  }
);

export const transferMoney = createAsyncThunk(
  'transactions/transfer',
  async (
    payload: { sourceWalletId: string; destinationWalletId: string; amount: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const data = await TransactionService.transfer(payload);
      dispatch(fetchTransactions());
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to perform transfer');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async (
    payload: { transactionId: string; data: { password: string; category?: string; description?: string } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const data = await TransactionService.update(payload.transactionId, payload.data);
      dispatch(fetchTransactions());
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update transaction');
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (
    payload: { transactionId: string; password: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const data = await TransactionService.delete(payload.transactionId, payload.password);
      dispatch(fetchTransactions());
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete transaction');
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    resetFilters: (state) => {
      state.filters = { ...initialState.filters };
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, setCurrentPage, resetFilters } = transactionSlice.actions;
export default transactionSlice.reducer;
