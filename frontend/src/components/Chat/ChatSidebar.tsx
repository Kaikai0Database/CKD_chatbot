import { useState, useEffect } from 'react';
import { Plus, LogOut, LogIn, Settings2, User, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SessionMenu from '../Session/SessionMenu';

interface Session {
    id: string;
    name: string | null;
    history: any[];
}

interface User {
    id: string;
    name: string;
    doctor: string;
}

interface ChatSidebarProps {
    sessions: Session[];
    currentSessionId: string | null;
    user: User | null;
    isAnonymous: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSelectSession: (id: string) => void;
    onCreateSession: () => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, name: string) => void;
    onLogin: () => void;
    onLogout: () => void;
}

export default function ChatSidebar({
    sessions,
    currentSessionId,
    user,
    isAnonymous,
    isOpen,
    onClose,
    onSelectSession,
    onCreateSession,
    onDeleteSession,
    onRenameSession,
    onLogin,
    onLogout
}: ChatSidebarProps) {
    const [showSettings, setShowSettings] = useState(false);

    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sidebarVariants = {
        open: { x: 0, opacity: 1, display: 'flex' },
        closed: { x: '-100%', opacity: 0, transitionEnd: { display: 'none' } }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.div
                initial={false}
                animate={isDesktop || isOpen ? "open" : "closed"}
                variants={sidebarVariants}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed md:relative z-50 w-72 h-full bg-white border-r border-gray-200 flex flex-col shadow-2xl md:shadow-none`}
                style={{ x: 0, opacity: 1, display: 'flex' }} // Force visible on desktop via CSS override if needed, but framer motion handles it. 
            // Actually, for responsive behavior with framer motion, it's tricky. 
            // Better to use a media query hook or just conditional rendering for the variant.
            // Let's rely on the parent to control 'isOpen' based on screen size, OR use CSS media queries to override the 'closed' state on desktop.
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-primary-light relative">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-3xl">🩺</span>
                        CKD Chatbot
                    </h1>
                    <p className="text-white/80 text-sm mt-1">腎臟衛教問答系統</p>

                    {/* Close Button (Mobile Only) */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white md:hidden"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            onCreateSession();
                            if (window.innerWidth < 768) onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow"
                    >
                        <Plus size={20} />
                        <span>新對話</span>
                    </motion.button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
                    <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare size={12} />
                        對話列表
                    </div>
                    <AnimatePresence>
                        {sessions.map((session, index) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="mb-1"
                            >
                                <div
                                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${session.id === currentSessionId
                                        ? 'bg-primary/10 shadow-sm border border-primary/20'
                                        : 'hover:bg-gray-50'
                                        }`}
                                    onClick={() => {
                                        onSelectSession(session.id);
                                        if (window.innerWidth < 768) onClose();
                                    }}
                                >
                                    <div className="flex-1 truncate text-sm">
                                        <span className={session.id === currentSessionId ? 'text-primary font-medium' : 'text-gray-700'}>
                                            {session.name || '未命名對話'}
                                        </span>
                                    </div>

                                    <SessionMenu
                                        sessionId={session.id}
                                        sessionName={session.name}
                                        onRename={(name) => onRenameSession(session.id, name)}
                                        onDelete={() => onDeleteSession(session.id)}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {sessions.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                            尚無對話紀錄
                        </div>
                    )}
                </div>

                {/* User Auth Section */}
                <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-4">
                        {isAnonymous ? (
                            // Anonymous user - show login button
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onLogin}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow"
                            >
                                <LogIn size={20} />
                                <span>登入帳戶</span>
                            </motion.button>
                        ) : (
                            // Authenticated user - show user info and logout
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-700">{user?.name}</span>
                                            <span className="text-xs text-gray-500">{user?.doctor} 醫師</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <Settings2 size={18} className="text-gray-600" />
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showSettings && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <button
                                                onClick={onLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                            >
                                                <LogOut size={16} />
                                                <span>登出系統</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}
