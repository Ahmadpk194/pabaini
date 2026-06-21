import { create } from 'zustand';

interface AuthPromptState {
  visible: boolean;
  title: string;
  description: string;
  showPrompt: (options?: { title?: string; description?: string }) => void;
  hidePrompt: () => void;
}

export const useAuthPromptStore = create<AuthPromptState>((set) => ({
  visible: false,
  title: 'Log In Required',
  description: 'You need to be logged in to perform this action.',
  showPrompt: (options) =>
    set({
      visible: true,
      title: options?.title || 'Log In Required',
      description: options?.description || 'You need to be logged in to perform this action.',
    }),
  hidePrompt: () => set({ visible: false }),
}));
