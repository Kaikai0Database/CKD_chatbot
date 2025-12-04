import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';

export default function DoctorResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('無效的重置連結');
        }
    }, [token]);

    // Password strength calculation
    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        return strength;
    };

    const passwordStrength = calculatePasswordStrength(formData.new_password);
    const strengthLabels = ['很弱', '弱', '中等', '強', '很強'];
    const strengthColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.new_password || !formData.confirm_password) {
            setError('請填寫所有欄位');
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            setError('密碼不一致');
            return;
        }

        if (formData.new_password.length < 8) {
            setError('密碼至少需要 8 個字元');
            return;
        }

        if (!token) {
            setError('無效的重置連結');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/doctor/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    new_password: formData.new_password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/doctor/login');
                }, 2000);
            } else {
                setError(data.detail || '重置失敗');
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
                            <span className="text-4xl">🔑</span>
                        </motion.div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">
                            重置密碼
                        </h1>
                        <p className="text-gray-600">設定您的新密碼</p>
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
                                密碼已重置！
                            </h3>
                            <p className="text-gray-600 text-sm">
                                正在導向登入頁面...
                            </p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* New Password Input */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    新密碼
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.new_password}
                                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                        placeholder="至少 8 個字元"
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.new_password && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-300"
                                                    style={{
                                                        width: `${(passwordStrength / 5) * 100}%`,
                                                        backgroundColor: strengthColors[passwordStrength - 1] || strengthColors[0]
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium" style={{ color: strengthColors[passwordStrength - 1] || strengthColors[0] }}>
                                                {strengthLabels[passwordStrength - 1] || strengthLabels[0]}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Confirm Password Input */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    確認新密碼
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                        placeholder="再次輸入新密碼"
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading || !token}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '重置中...' : '重置密碼'}
                            </motion.button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
