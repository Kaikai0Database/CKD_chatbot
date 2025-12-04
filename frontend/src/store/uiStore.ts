import { create } from 'zustand';

type Language = '繁體中文' | 'English' | '简体中文';

interface UIState {
    language: Language;
    sidebarOpen: boolean;
    setLanguage: (language: Language) => void;
    toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    language: '繁體中文',
    sidebarOpen: true,
    setLanguage: (language) => set({ language }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
