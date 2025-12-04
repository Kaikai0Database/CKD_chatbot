import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, User as UserIcon, Stethoscope, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export default function LoginPage() {
    // 醫師名單
    const DOCTORS = [
        '黃秋錦 Chiu-Ching Huang',
        '賴彬卿 Ping-Chin Lai',
        '葉宏傑 Hung-Chieh Yeh',
        '郭錦輯 Chin-Chi Kuo',
        '郭慧亮 Huey-Liang Kuo',
        '王怡寬 I-Kuan Wang',
        '陳怡儒 I-Ru Chen',
        '張志宗 Chiz-Tzung Chang',
        '丁羿文 I-Wen Ting',
        '梁志嘉 Chih-Chia Liang'
    ];

    const [name, setName] = useState('');
    const [doctor, setDoctor] = useState('');
    const [patientEmail, setPatientEmail] = useState('');  // 改名: doctorEmail → patientEmail
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ name, doctor, patient_email: patientEmail });  // 改: doctor_email → patient_email
            if (response.success) {
                login(response.user);
                navigate('/chat');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || '登入失敗，請重試');
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymousLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const response = await authService.loginAnonymous();
            if (response.success) {
                login(response.user);
                navigate('/chat');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || '匿名登入失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-primary/80 flex items-center justify-center p-4 relative overflow-hidden">
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
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-primary-light rounded-full mb-4"
                    >
                        <span className="text-4xl">🩺</span>
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-2">
                        CKD 腎臟衛教系統
                    </h1>
                    <p className="text-gray-600">患者身份驗證</p>

                    {/* Back to Role Selection */}
                    <motion.button
                        type="button"
                        onClick={() => navigate('/')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← 返回角色選擇
                    </motion.button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Input */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <UserIcon size={16} className="text-primary" />
                            患者姓名
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            placeholder="請輸入您的姓名"
                            required
                        />
                    </motion.div>

                    {/* Doctor Input */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Stethoscope size={16} className="text-primary" />
                            主治醫師
                        </label>
                        <select
                            value={doctor}
                            onChange={(e) => setDoctor(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            required
                        >
                            <option value="">請選擇您的主治醫師</option>
                            {DOCTORS.map((doc) => (
                                <option key={doc} value={doc}>{doc}</option>
                            ))}
                        </select>
                    </motion.div>

                    {/* Email Input */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Mail size={16} className="text-primary" />
                            您的電子郵件
                        </label>
                        <input
                            type="email"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            placeholder="your_email@gmail.com"
                            required
                        />
                    </motion.div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <LogIn size={20} />
                        {loading ? '登入中...' : '登入系統'}
                    </motion.button>

                    {/* Anonymous Login */}
                    <motion.button
                        type="button"
                        onClick={handleAnonymousLogin}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <UserPlus size={20} />
                        匿名登入
                    </motion.button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>🔒 您的資料將被安全保護</p>
                </div>
            </motion.div>
        </div>
    );
}
