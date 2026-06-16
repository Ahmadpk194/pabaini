import { create } from 'zustand';
import { getUnreadCount } from '../services/notificationsApi';

interface NotificationsStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void; // optimistic decrement when marking one as read
  clearUnreadCount: () => void;     // optimistic clear when marking all as read
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  fetchUnreadCount: async () => {
    try {
      const res = await getUnreadCount();
      set({ unreadCount: res.count });
    } catch (err) {
      console.warn('Failed to fetch unread count:', err);
    }
  },
  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearUnreadCount: () => set({ unreadCount: 0 }),
}));
