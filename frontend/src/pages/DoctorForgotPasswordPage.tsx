import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Check } from 'lucide-react';

export default function DoctorForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [resetLink, setResetLink] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!email) {
            setError('請輸入 Email');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/doctor/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                if (data.reset_link) {
                    // For testing: display the link
                    setResetLink(data.reset_link);
                }
            } else {
                setError(data.detail || '發送失敗');
            }
        } catch (err) {
            setError('伺服器連接失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-4"
                        >
                            <span className="text-4xl">🔐</span>
                        </motion.div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">
                            忘記密碼
                        </h1>
                        <p className="text-gray-600">輸入您的 Email 以重置密碼</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">
                                <Check className="text-green-600" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                重置連結已發送
                            </h3>
                            <p className="text-gray-600 text-sm">
                                如果該 Email 已註冊，您將收到重置密碼的連結
                            </p>

                            {/* For Testing: Show reset link */}
                            {resetLink && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs text-yellow-800 mb-2 font-semibold">
                                        測試模式 - 重置連結：
                                    </p>
                                    <a
                                        href={resetLink}
                                        className="text-xs text-blue-600 hover:text-blue-800 break-all underline"
                                    >
                                        {resetLink}
                                    </a>
                                </div>
                            )}

                            <button
                                onClick={() => navigate('/doctor/login')}
                                className="mt-6 text-green-600 hover:text-green-700 font-medium"
                            >
                                返回登入
                            </button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Input */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@hospital.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '發送中...' : '發送重置連結'}
                            </motion.button>

                            {/* Back to Login */}
                            <button
                                type="button"
                                onClick={() => navigate('/doctor/login')}
                                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2"
                            >
                                <ArrowLeft size={16} />
                                <span>返回登入</span>
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
