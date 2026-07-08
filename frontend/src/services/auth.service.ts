import { api } from './api';

export const AuthService = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: { email: string; password: string; firstName: string; lastName: string; otpCode: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  sendOtp: async (data: { email: string; purpose: 'registration' | 'reset-password' }) => {
    const response = await api.post('/auth/send-otp', data);
    return response.data;
  },

  resetPassword: async (data: { email: string; otpCode: string; newPassword?: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  updateProfile: async (formData: FormData) => {
    const response = await api.post('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
