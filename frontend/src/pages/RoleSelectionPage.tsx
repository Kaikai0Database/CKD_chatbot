import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Stethoscope } from 'lucide-react';

export default function RoleSelectionPage() {
    const navigate = useNavigate();

    const handlePatientClick = () => {
        navigate('/chat');
    };

    const handleDoctorClick = () => {
        navigate('/doctor/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl w-full relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 shadow-2xl"
                    >
                        <span className="text-5xl">🩺</span>
                    </motion.div>
                    <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        CKD 腎臟衛教系統
                    </h1>
                    <p className="text-xl text-white/90">請選擇您的身份</p>
                </div>

                {/* Role Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Patient Card */}
                    <motion.button
                        onClick={handlePatientClick}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all group"
                    >
                        <div className="flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users size={48} className="text-white" />
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-3">
                                我是病患
                            </h2>

                            {/* Description */}
                            <p className="text-gray-600 mb-6">
                                開始使用 CKD 腎臟衛教問答系統
                            </p>

                            {/* Features */}
                            <div className="text-left w-full space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span>即刻開始諮詢</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span>可選登入保存記錄</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span>24/7 隨時諮詢</span>
                                </div>
                            </div>
                        </div>
                    </motion.button>

                    {/* Doctor Card */}
                    <motion.button
                        onClick={handleDoctorClick}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all group"
                    >
                        <div className="flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Stethoscope size={48} className="text-white" />
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-3">
                                我是醫師
                            </h2>

                            {/* Description */}
                            <p className="text-gray-600 mb-6">
                                進入醫師觀察平台
                            </p>

                            {/* Features */}
                            <div className="text-left w-full space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <span>查看病患列表</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <span>追蹤對話記錄</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <span>監測使用情況</span>
                                </div>
                            </div>
                        </div>
                    </motion.button>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 text-center text-white/80 text-sm"
                >
                    <p>🔒 您的資料將被安全保護</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
