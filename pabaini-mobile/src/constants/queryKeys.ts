export const queryKeys = {
  announcements: {
    all: ['announcements'] as const,
    list: (filters?: { category?: string }) => ['announcements', 'list', filters] as const,
    detail: (id: number) => ['announcements', 'detail', id] as const,
  },
};
