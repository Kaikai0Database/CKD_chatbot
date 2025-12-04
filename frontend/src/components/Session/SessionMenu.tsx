import { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    sessionId: string;
    sessionName: string | null;
    onRename: (name: string) => void;
    onDelete: () => void;
}

export default function SessionMenu({ sessionId, sessionName, onRename, onDelete }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(sessionName || '');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsRenaming(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleRename = () => {
        if (newName.trim()) {
            onRename(newName.trim());
            setIsRenaming(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="icon-btn opacity-0 group-hover:opacity-100"
            >
                <span className="text-lg">⋮</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50"
                    >
                        {isRenaming ? (
                            <div className="px-3 py-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename();
                                        if (e.key === 'Escape') {
                                            setIsRenaming(false);
                                            setNewName(sessionName || '');
                                        }
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="對話名稱"
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleRename}
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                                    >
                                        <Check size={14} />
                                        確定
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsRenaming(false);
                                            setNewName(sessionName || '');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                        <X size={14} />
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsRenaming(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <Edit size={16} />
                                    <span>重新命名</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('確定要刪除此對話？')) {
                                            onDelete();
                                            setIsOpen(false);
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                >
                                    <Trash2 size={16} />
                                    <span>刪除對話</span>
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
