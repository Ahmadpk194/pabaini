export const queryKeys = {
  announcements: {
    all: ['announcements'] as const,
    list: (filters?: { category?: string }) => ['announcements', 'list', filters] as const,
    detail: (id: number) => ['announcements', 'detail', id] as const,
  },
  matches: {
    all: ['matches'] as const,
    list: (filters?: { status?: string; team_id?: number }) => ['matches', 'list', filters] as const,
    detail: (id: number) => ['matches', 'detail', id] as const,
    lineup: (id: number) => ['matches', 'lineup', id] as const,
  },
};

