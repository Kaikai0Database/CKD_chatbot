import api from './api';

export const doctorService = {
    login: async (name: string) => {
        const response = await api.post('/api/auth/doctor/login', { name });
        return response.data;
    },

    getPatients: async (doctorName: string) => {
        const response = await api.get(`/api/doctor/patients?doctor=${encodeURIComponent(doctorName)}`);
        return response.data;
    },

    getDoctorSessions: async (doctorName: string) => {
        const response = await api.get(`/api/doctor/sessions?doctor=${encodeURIComponent(doctorName)}`);
        return response.data;
    }
};
