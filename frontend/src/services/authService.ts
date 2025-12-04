import api from './api';

interface LoginData {
    name: string;
    doctor: string;
    patient_email: string;  // 改名: doctor_email → patient_email
}

interface UserProfile {
    name: string;
    doctor: string;
    patient_email: string;  // 改名: doctor_email → patient_email
}

export const authService = {
    login: async (data: LoginData) => {
        const response = await api.post('/api/auth/login', data);
        return response.data;
    },

    loginAnonymous: async () => {
        const response = await api.post('/api/auth/login/anonymous', {});
        return response.data;
    },

    logout: async (userId: string) => {
        const response = await api.post(`/api/auth/logout?user_id=${userId}`);
        return response.data;
    },

    adminLogin: async (password: string) => {
        const response = await api.post('/api/auth/admin/login', { password });
        return response.data;
    },

    verifyUser: async (userId: string) => {
        const response = await api.get(`/api/auth/verify/${userId}`);
        return response.data;
    },
};
