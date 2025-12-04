import api from './api';
import type { ChatSession } from '../store/chatStore';

export const chatService = {
    getSessions: async (userId: string, doctor?: string): Promise<ChatSession[]> => {
        const params = new URLSearchParams({ user_id: userId });
        if (doctor) params.append('doctor', doctor);
        const response = await api.get(`/api/sessions?${params}`);
        return response.data;
    },

    createSession: async (userId: string, doctor?: string): Promise<ChatSession> => {
        const params = new URLSearchParams({ user_id: userId });
        if (doctor) params.append('doctor', doctor);
        const response = await api.post(`/api/sessions?${params}`);
        return response.data.session;
    },

    getSession: async (sessionId: string): Promise<ChatSession> => {
        const response = await api.get(`/api/sessions/${sessionId}`);
        return response.data;
    },

    updateSession: async (sessionId: string, name: string) => {
        const response = await api.put(`/api/sessions/${sessionId}`, { name });
        return response.data;
    },

    deleteSession: async (sessionId: string, userId: string) => {
        const response = await api.delete(`/api/sessions/${sessionId}?user_id=${userId}`);
        return response.data;
    },

    sendMessage: async (sessionId: string, message: string) => {
        const response = await api.post('/api/chat/message', {
            session_id: sessionId,
            message,
        });
        return response.data;
    },

    sendMessageStream: async (
        sessionId: string,
        message: string,
        onChunk: (event: any) => void,
        onError: (error: Error) => void,
        onComplete: () => void
    ) => {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

        try {
            const response = await fetch(`${baseURL}/api/chat/message/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: message,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body reader available');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Keep the last incomplete line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            onChunk(data);

                            if (data.type === 'done' || data.type === 'error') {
                                onComplete();
                                return;
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE data:', e);
                        }
                    }
                }
            }

            onComplete();
        } catch (error) {
            onError(error as Error);
        }
    },
};
