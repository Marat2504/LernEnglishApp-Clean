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

// Новая функция для проверки и разблокировки достижений пользователя
export interface CheckAchievementsResponse {
  message: string;
  newlyUnlocked: string[];
}

export const checkAchievements = async (): Promise<CheckAchievementsResponse> => {
  const response = await api.post('/achievements/check');
  return response.data;
};
