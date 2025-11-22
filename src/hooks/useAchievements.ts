import { useQuery } from '@tanstack/react-query';
import { getAchievements, Achievement } from '../services/achievementsService';

const useAchievements = () => {
  return useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: getAchievements,
  });
};

export default useAchievements;
