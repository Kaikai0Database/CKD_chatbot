import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import ChatInput from '../components/Chat/ChatInput';
import ChatMessage from '../components/Chat/ChatMessage';
import ChatSidebar from '../components/Chat/ChatSidebar';

export default function ChatPage() {
    const navigate = useNavigate();
    const { user, isAnonymous, logout } = useAuthStore();
    const { sessions, currentSessionId, setCurrentSession, setSessions, addSession, deleteSession, updateSession } = useChatStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        loadSessions();
    }, [user]);

    const loadSessions = async () => {
        if (!user) return;
        try {
            const data = await chatService.getSessions(
                user.id,
                isAnonymous ? undefined : user.doctor
            );
            setSessions(data);

            // 如果用戶沒有任何session,自動創建第一個
            if (data.length === 0) {
                console.log('No sessions found, creating first session automatically');
                await handleCreateSession();
            } else if (!currentSessionId) {
                // 如果有session但沒有選中的,選中第一個
                setCurrentSession(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    const handleCreateSession = async () => {
        if (!user) return;
        try {
            const newSession = await chatService.createSession(
                user.id,
                isAnonymous ? undefined : user.doctor
            );
            addSession(newSession);
            setCurrentSession(newSession.id);
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!user) return;
        try {
            await chatService.deleteSession(sessionId, user.id);
            deleteSession(sessionId);
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const handleRenameSession = async (sessionId: string, newName: string) => {
        try {
            await chatService.updateSession(sessionId, newName);
            updateSession(sessionId, { name: newName });
        } catch (error) {
            console.error('Failed to rename session:', error);
        }
    };

    const handleLogout = async () => {
        if (user) {
            await authService.logout(user.id);
            logout();
            // Reload page to trigger auto-anonymous login
            window.location.reload();
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const currentSession = sessions.find(s => s.id === currentSessionId);

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <ChatSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                user={user}
                isAnonymous={isAnonymous}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onSelectSession={setCurrentSession}
                onCreateSession={handleCreateSession}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                onLogin={handleLogin}
                onLogout={handleLogout}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex items-center gap-4"
                >
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Menu size={24} className="text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {currentSession?.name || '新對話'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {currentSession?.history.length ? `${Math.floor(currentSession.history.length / 2)} 則對話` : '開始新的對話'}
                        </p>
                    </div>
                </motion.div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {!currentSession?.history.length ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center h-full text-center"
                        >
                            <div className="text-6xl mb-4">🩺</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                開始您的 CKD 諮詢
                            </h3>
                            <p className="text-gray-500 max-w-md">
                                歡迎使用 CKD 腎臟衛教問答系統。請輸入您的問題，系統將為您提供專業的建議。
                            </p>
                        </motion.div>
                    ) : (
                        <AnimatePresence>
                            {currentSession.history.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <ChatMessage message={msg} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Input Area */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-6 bg-white border-t border-gray-200 shadow-lg"
                >
                    <ChatInput sessionId={currentSessionId} />
                </motion.div>
            </div>
        </div>
    );
}
