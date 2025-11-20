import api from './api';
import { DailyMission } from '../types';

export const getDailyMissions = async (): Promise<DailyMission[]> => {
  const response = await api.get('/missions/daily');
  return response.data;
};

export const updateMissionProgress = async (missionId: string): Promise<void> => {
  await api.post(`/missions/${missionId}/progress`);
};
