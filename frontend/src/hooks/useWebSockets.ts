import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateWalletBalance } from '../store/walletSlice';
import { addNotification } from '../store/notificationSlice';

let socket: Socket | null = null;

export const useWebSockets = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    socket = io(`${backendUrl}/notifications`, {
      query: { userId: user.id },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to WebSockets server for user', user.id);
    });

    socket.on('balance_update', (data: { walletId: string; newBalance: number }) => {
      console.log('WebSocket Event: balance_update', data);
      dispatch(updateWalletBalance({ walletId: data.walletId, balance: data.newBalance }));
      dispatch(addNotification({
        title: 'Balance Synced',
        message: `Wallet balance updated dynamically.`,
        kind: 'wallet'
      }));
    });

    socket.on('budget_warning', (data: { category: string; message: string }) => {
      console.log('WebSocket Event: budget_warning', data);
      dispatch(addNotification({
        title: `⚠️ Budget Warning`,
        message: data.message,
        kind: 'budget'
      }));
    });

    socket.on('budget_alert', (data: { category: string; message: string }) => {
      console.log('WebSocket Event: budget_alert', data);
      dispatch(addNotification({
        title: `🚨 Budget Limit Exceeded`,
        message: data.message,
        kind: 'budget'
      }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSockets server');
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [isAuthenticated, user?.id, dispatch]);
};
