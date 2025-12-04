import { create } from 'zustand';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string | { outline: string; detail: string };
}

export interface ChatSession {
    id: string;
    name: string | null;
    history: ChatMessage[];
    created_at: string;
    updated_at: string;
}

interface ChatState {
    sessions: ChatSession[];
    currentSessionId: string | null;
    isLoading: boolean;
    setSessions: (sessions: ChatSession[]) => void;
    setCurrentSession: (sessionId: string) => void;
    addSession: (session: ChatSession) => void;
    updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
    deleteSession: (sessionId: string) => void;
    addMessage: (sessionId: string, message: ChatMessage) => void;
    updateMessageContent: (sessionId: string, messageIndex: number, content: any) => void;
    setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    sessions: [],
    currentSessionId: null,
    isLoading: false,
    setSessions: (sessions) => set({ sessions }),
    setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
    addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
    updateSession: (sessionId, updates) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, ...updates } : s
            ),
        })),
    deleteSession: (sessionId) =>
        set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            currentSessionId:
                state.currentSessionId === sessionId
                    ? state.sessions[state.sessions.length - 1]?.id || null
                    : state.currentSessionId,
        })),
    addMessage: (sessionId, message) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? { ...s, history: [...s.history, message], updated_at: new Date().toISOString() }
                    : s
            ),
        })),
    updateMessageContent: (sessionId: string, messageIndex: number, content: any) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? {
                        ...s,
                        history: s.history.map((msg, idx) =>
                            idx === messageIndex
                                ? { ...msg, content }
                                : msg
                        ),
                        updated_at: new Date().toISOString()
                    }
                    : s
            ),
        })),
    setLoading: (loading) => set({ isLoading: loading }),
}));
