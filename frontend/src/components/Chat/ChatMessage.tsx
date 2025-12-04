import type { ChatMessage as ChatMessageType } from '../../store/chatStore';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
    message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
    const [showDetail, setShowDetail] = useState(false);

    if (message.role === 'user') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-end mb-6"
            >
                <div className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-2xl max-w-2xl shadow-md">
                    <p className="text-sm leading-relaxed">
                        {typeof message.content === 'string' ? message.content : ''}
                    </p>
                </div>
            </motion.div>
        );
    }

    // Assistant message
    const content = typeof message.content === 'object' ? message.content : { outline: message.content, detail: message.content };
    const isThinking = content.outline === '思考中...';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-start mb-6"
        >
            <div className="bg-white border border-gray-200 rounded-2xl p-5 max-w-3xl w-full shadow-sm hover:shadow-md transition-shadow">
                {/* AI Icon */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-light flex items-center justify-center text-white font-semibold flex-shrink-0">
                        AI
                    </div>
                    <div className="flex-1">
                        <div className={`prose prose-sm max-w-none leading-relaxed ${isThinking ? 'text-gray-400 italic' : 'text-gray-800'
                            }`}>
                            {content.outline}
                        </div>
                    </div>
                </div>

                {/* Feedback Buttons */}
                <div className="flex gap-2 mt-4 mb-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-50 hover:bg-green-50 hover:text-green-600 rounded-full transition-colors border border-gray-200"
                    >
                        <ThumbsUp size={16} />
                        <span>有幫助</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-gray-200"
                    >
                        <ThumbsDown size={16} />
                        <span>沒幫助</span>
                    </motion.button>
                </div>

                {/* Detail Expansion */}
                {content.detail && content.detail !== content.outline && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <button
                            onClick={() => setShowDetail(!showDetail)}
                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition"
                        >
                            {showDetail ? (
                                <>
                                    <ChevronUp size={16} />
                                    <span>隱藏詳情</span>
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={16} />
                                    <span>顯示詳情</span>
                                </>
                            )}
                        </button>

                        {showDetail && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-200"
                            >
                                {content.detail}
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
