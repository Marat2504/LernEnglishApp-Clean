import api from './api';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  category: string;
  isSecret: boolean;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export const getAchievements = async (): Promise<Achievement[]> => {
  console.log('Fetching achievements data from API');
  const response = await api.get('/achievements');
  return response.data;
};
