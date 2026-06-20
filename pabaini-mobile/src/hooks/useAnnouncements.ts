import { useQuery } from '@tanstack/react-query';
import { Announcement, Category } from '../types';
import { getAll } from '../api/announcements';
import { queryKeys } from '../constants/queryKeys';

export function useAnnouncements(
  category?: Category,
  options?: { refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: queryKeys.announcements.list({ category }),
    queryFn: async () => {
      const response = await getAll(1, 10, category);
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
}
