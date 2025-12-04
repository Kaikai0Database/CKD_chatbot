import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    doctor: string;
    patient_email: string;  // 改名: doctor_email → patient_email
    is_admin?: boolean;
    is_doctor?: boolean;  // 新增: 標記醫師身份
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isAnonymous: boolean;
    isAdmin: boolean;
    login: (user: User) => void;
    loginAnonymous: (user: User) => void;
    logout: () => void;
    setAdmin: (isAdmin: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isAnonymous: false,
            isAdmin: false,
            login: (user) => set({ user, isAuthenticated: true, isAnonymous: false, isAdmin: user.is_admin || false }),
            loginAnonymous: (user) => set({ user, isAuthenticated: true, isAnonymous: true, isAdmin: false }),
            logout: () => set({ user: null, isAuthenticated: false, isAnonymous: false, isAdmin: false }),
            setAdmin: (isAdmin) => set({ isAdmin }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
