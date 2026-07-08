import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

export type NotificationKind = 'wallet' | 'transaction' | 'budget' | 'savings' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  items: AppNotification[];
}

const getInitialNotifications = (): AppNotification[] => {
  return [];
};

const initialState: NotificationState = {
  items: getInitialNotifications(),
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<{ title: string; message: string; kind?: NotificationKind }>,
    ) => {
      state.items.unshift({
        id: nanoid(),
        title: action.payload.title,
        message: action.payload.message,
        kind: action.payload.kind || 'system',
        createdAt: new Date().toISOString(),
        read: false,
      });
      state.items = state.items.slice(0, 50);
    },
    markAllRead: (state) => {
      state.items = state.items.map((item) => ({ ...item, read: true }));
    },
    clearNotifications: (state) => {
      state.items = [];
    },
    setNotifications: (state, action: PayloadAction<AppNotification[]>) => {
      state.items = action.payload;
    },
  },
});

export const { addNotification, markAllRead, clearNotifications, setNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
