import { useQuery } from '@tanstack/react-query';
import { getUserStats } from '../services/statsService';
import { UserStats } from '../types';

const useStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: getUserStats,
  });
};

export default useStats;
