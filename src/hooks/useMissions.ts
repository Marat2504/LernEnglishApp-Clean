import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as missionsService from '../services/missionsService';
import { DailyMission } from '../types';

export const useDailyMissions = () => {
  return useQuery<DailyMission[]>({
    queryKey: ['dailyMissions'],
    queryFn: missionsService.getDailyMissions,
  });
};

export const useUpdateMissionProgress = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: missionsService.updateMissionProgress,
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['dailyMissions']}),
  });
};
