import api from './api';
import { UserStats } from '../types';

export const getUserStats = async (): Promise<UserStats> => {
  const response = await api.get('/auth/stats');
  return response.data;
};
