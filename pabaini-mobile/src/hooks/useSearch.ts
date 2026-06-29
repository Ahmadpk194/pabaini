import { useInfiniteQuery } from '@tanstack/react-query';
import {
  searchAnnouncements,
  searchPlayers,
  searchTeams,
  searchMatches,
  searchUsers,
} from '../api/search';

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AnnouncementsResponse {
  data: any[];
  pagination: PageMeta;
  message: string;
}

interface PaginatedDataResponse {
  data: {
    data: any[];
    meta: PageMeta;
  };
  message: string;
}

const STALE_TIME = 30000; // 30 seconds cache

export const useSearchAnnouncements = (query: string, enabled: boolean) =>
  useInfiniteQuery<any, Error, any, any, number>({
    queryKey: ['search', 'announcements', query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchAnnouncements(query, pageParam);
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
    },
    enabled: enabled && query.trim().length >= 2,
    initialPageParam: 1,
    staleTime: STALE_TIME,
  });

export const useSearchPlayers = (query: string, enabled: boolean) =>
  useInfiniteQuery<any, Error, any, any, number>({
    queryKey: ['search', 'players', query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchPlayers(query, pageParam);
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      const meta = lastPage?.data?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: enabled && query.trim().length >= 2,
    initialPageParam: 1,
    staleTime: STALE_TIME,
  });

export const useSearchTeams = (query: string, enabled: boolean) =>
  useInfiniteQuery<any, Error, any, any, number>({
    queryKey: ['search', 'teams', query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchTeams(query, pageParam);
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      const meta = lastPage?.data?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: enabled && query.trim().length >= 2,
    initialPageParam: 1,
    staleTime: STALE_TIME,
  });

export const useSearchMatches = (query: string, enabled: boolean) =>
  useInfiniteQuery<any, Error, any, any, number>({
    queryKey: ['search', 'matches', query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchMatches(query, pageParam);
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      const meta = lastPage?.data?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: enabled && query.trim().length >= 2,
    initialPageParam: 1,
    staleTime: STALE_TIME,
  });

export const useSearchUsers = (query: string, enabled: boolean) =>
  useInfiniteQuery<any, Error, any, any, number>({
    queryKey: ['search', 'users', query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchUsers(query, pageParam);
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      const meta = lastPage?.data?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: enabled && query.trim().length >= 2,
    initialPageParam: 1,
    staleTime: STALE_TIME,
  });

export const useSearchAll = (query: string, enabled: boolean) => {
  const posts = useSearchAnnouncements(query, enabled);
  const players = useSearchPlayers(query, enabled);
  const teams = useSearchTeams(query, enabled);
  const matches = useSearchMatches(query, enabled);

  return { posts, players, teams, matches };
};
