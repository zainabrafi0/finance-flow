import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Wallet {
  _id: string;
  name: string;
  balance: number;
  currency: string;
  accountNumber?: string;
  walletType?: string;
  accountSubType?: string;
  bankName?: string;
}

interface WalletState {
  wallets: Wallet[];
  totalBalance: number;
}

const initialState: WalletState = {
  wallets: [],
  totalBalance: 0,
};

const walletSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    setWallets: (state, action: PayloadAction<Wallet[]>) => {
      state.wallets = action.payload;
      // Calculate total balance automatically across all wallets
      state.totalBalance = action.payload.reduce((sum, w) => sum + w.balance, 0);
    },
    clearWallets: (state) => {
      state.wallets = [];
      state.totalBalance = 0;
    },
    updateWalletBalance: (state, action: PayloadAction<{ walletId: string; balance: number }>) => {
      const idx = state.wallets.findIndex((w) => w._id === action.payload.walletId);
      if (idx !== -1) {
        state.wallets[idx].balance = action.payload.balance;
        state.totalBalance = state.wallets.reduce((sum, w) => sum + w.balance, 0);
      }
    },
  },
});

export const { setWallets, clearWallets, updateWalletBalance } = walletSlice.actions;
export default walletSlice.reducer;
