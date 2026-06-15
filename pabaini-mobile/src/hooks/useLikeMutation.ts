import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleLike } from '../api/announcements';
import { queryKeys } from '../constants/queryKeys';

export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: number) => toggleLike(announcementId),

    onMutate: async (announcementId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.announcements.all,
      });

      // Snapshot previous values for rollback
      const previousList = queryClient.getQueryData(
        queryKeys.announcements.list({})
      );
      const previousDetail = queryClient.getQueryData(
        queryKeys.announcements.detail(announcementId)
      );

      // Optimistically update THE CACHE directly
      // This updates BOTH feed card and detail screen simultaneously
      queryClient.setQueryData(
        queryKeys.announcements.list({}),
        (old: any) => old?.map((a: any) => a.id === announcementId
          ? {
            ...a,
            liked_by_me: !a.liked_by_me,
            likes_count: a.liked_by_me
              ? a.likes_count - 1
              : a.likes_count + 1
          }
          : a
        )
      );
      queryClient.setQueryData(
        queryKeys.announcements.detail(announcementId),
        (old: any) => old ? {
          ...old,
          liked_by_me: !old.liked_by_me,
          likes_count: old.liked_by_me
            ? old.likes_count - 1
            : old.likes_count + 1
        } : old
      );

      return { previousList, previousDetail };
    },

    onError: (err, announcementId, context: any) => {
      // Rollback both list and detail cache on failure
      queryClient.setQueryData(
        queryKeys.announcements.list({}),
        context.previousList
      );
      queryClient.setQueryData(
        queryKeys.announcements.detail(announcementId),
        context.previousDetail
      );
      // TODO: Show error toast
    },

    onSettled: () => {
      // Don't invalidate — optimistic update is already correct
      // Only invalidate if server returns different like count (edge case)
    },
  });
}
