import { useState, type FormEvent } from 'react';
import { Send, Mic, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatService } from '../../services/chatService';

interface Props {
    sessionId: string | null;
}

export default function ChatInput({ sessionId }: Props) {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const user = useAuthStore((state) => state.user);
    const { addMessage, updateMessageContent, setLoading: setChatLoading, updateSession } = useChatStore();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !sessionId || !user) return;

        const userMessage = message;
        setMessage('');
        setLoading(true);
        setChatLoading(true);

        // Check if this is the first message BEFORE adding any messages
        const currentSession = useChatStore.getState().sessions.find(s => s.id === sessionId);
        const isFirstMessage = currentSession && currentSession.history.length === 0;

        // If first message, immediately update session name locally
        if (isFirstMessage) {
            const sessionName = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
            updateSession(sessionId, { name: sessionName });
            console.log('Session name updated immediately:', sessionName);
        }

        // Add user message immediately
        addMessage(sessionId, { role: 'user', content: userMessage });

        // Add placeholder for assistant message with "思考中..." indicator
        const assistantMessageIndex = useChatStore.getState().sessions.find(s => s.id === sessionId)?.history.length || 0;
        addMessage(sessionId, {
            role: 'assistant',
            content: { outline: '思考中...', detail: '' },
        });

        let outlineText = '';
        let detailText = '';

        try {
            await chatService.sendMessageStream(
                sessionId,
                userMessage,
                (event) => {
                    // Update assistant message with streaming chunks
                    if (event.type === 'outline_chunk') {
                        outlineText += event.content;
                        updateMessageContent(sessionId, assistantMessageIndex, {
                            outline: outlineText,
                            detail: detailText
                        });
                    } else if (event.type === 'detail_chunk') {
                        detailText += event.content;
                        updateMessageContent(sessionId, assistantMessageIndex, {
                            outline: outlineText,
                            detail: detailText
                        });
                    } else if (event.type === 'status') {
                        // Optionally show status updates
                        console.log('Status:', event.content);
                    } else if (event.type === 'done') {
                        // Final update with complete content
                        updateMessageContent(sessionId, assistantMessageIndex, {
                            outline: event.outline,
                            detail: event.detail
                        });
                    } else if (event.type === 'error') {
                        updateMessageContent(sessionId, assistantMessageIndex, {
                            outline: '系統發生錯誤',
                            detail: event.content
                        });
                    }
                },
                (error) => {
                    console.error('Streaming error:', error);
                    updateMessageContent(sessionId, assistantMessageIndex, {
                        outline: '系統發生錯誤',
                        detail: '系統發生錯誤，請稍後再試。'
                    });
                },
                () => {
                    // Streaming complete
                    setLoading(false);
                    setChatLoading(false);
                }
            );
        } catch (error) {
            console.error('Failed to send message:', error);
            updateMessageContent(sessionId, assistantMessageIndex, {
                outline: '系統發生錯誤',
                detail: '系統發生錯誤，請稍後再試。'
            });
            setLoading(false);
            setChatLoading(false);
        }
    };

    const handleVoiceInput = () => {
        // Web Speech API implementation
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('您的瀏覽器不支援語音輸入');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'zh-TW';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsRecording(true);
        recognition.start();

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setMessage(transcript);
            setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="請輸入您的問題..."
                    className="w-full px-5 py-3.5 pr-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-700 placeholder-gray-400"
                    disabled={loading}
                />
            </div>

            <motion.button
                type="button"
                onClick={handleVoiceInput}
                disabled={loading || isRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3.5 rounded-xl shadow-md transition-all ${isRecording
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-gradient-to-r from-primary-light to-primary hover:shadow-lg'
                    } text-white disabled:opacity-50`}
            >
                <Mic size={22} />
            </motion.button>

            <motion.button
                type="submit"
                disabled={loading || !message.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>處理中...</span>
                    </>
                ) : (
                    <>
                        <Send size={20} />
                        <span>發送</span>
                    </>
                )}
            </motion.button>
        </form>
    );
}
