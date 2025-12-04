import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { chatService } from '../services/chatService';
import { doctorService } from '../services/doctorService';
import { Users, MessageSquare, Clock, LogOut, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Patient {
    user_id: string;
    name: string;
    email: string;  // 新增：病患email
    session_count: number;
    last_activity: string;
}

interface Session {
    id: string;
    name: string;
    history: any[];
    created_at: string;
    updated_at: string;
}

export default function DoctorDashboard() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [patientSessions, setPatientSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !user.doctor) {
            navigate('/doctor/login');
            return;
        }
        loadPatients();
    }, [user]);

    const loadPatients = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await doctorService.getPatients(user.doctor);
            setPatients(data);
        } catch (error) {
            console.error('Failed to load patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPatientSessions = async (patientId: string) => {
        try {
            const data = await chatService.getSessions(patientId);
            setPatientSessions(data);
            setSelectedPatient(patientId);
        } catch (error) {
            console.error('Failed to load patient sessions:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/doctor/login');
    };

    const handleDeleteClick = (sessionId: string) => {
        setSessionToDelete(sessionId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!sessionToDelete || !user) return;

        try {
            const response = await fetch(
                `http://localhost:8000/api/doctor/session/${sessionToDelete}?doctor_id=${user.id}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                // Remove from UI
                setPatientSessions(prev => prev.filter(s => s.id !== sessionToDelete));
                // Reload patients to update session counts
                loadPatients();
                setDeleteConfirmOpen(false);
                setSessionToDelete(null);
            } else {
                const data = await response.json();
                alert(data.detail || '刪除失敗');
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
            alert('刪除失敗');
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setSessionToDelete(null);
    };

    const selectedPatientData = patients.find(p => p.user_id === selectedPatient);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* 病患列表側邊欄 */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-800">醫師觀察平台</h1>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="登出"
                        >
                            <LogOut size={20} className="text-gray-600" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={16} />
                        <span className="font-medium">{user?.name}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                        {patients.length} 位病患
                    </div>
                </div>

                {/* 病患列表 */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">載入中...</div>
                    ) : patients.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Users size={48} className="mx-auto mb-2 opacity-50" />
                            <p>尚無病患記錄</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {patients.map((patient) => (
                                <motion.div
                                    key={patient.user_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => loadPatientSessions(patient.user_id)}
                                    className={`p-4 rounded-lg cursor-pointer transition-all ${selectedPatient === patient.user_id
                                        ? 'bg-green-50 border-2 border-green-500'
                                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-800">
                                            {patient.name}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <MessageSquare size={12} />
                                            <span>{patient.session_count}</span>
                                        </div>
                                    </div>
                                    {/* 顯示病患 Email */}
                                    {patient.email && (
                                        <div className="text-xs text-gray-500 mb-1 truncate" title={patient.email}>
                                            📧 {patient.email}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock size={12} />
                                        <span>
                                            {new Date(patient.last_activity).toLocaleDateString('zh-TW')}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 對話內容區域 */}
            <div className="flex-1 flex flex-col">
                {selectedPatient && selectedPatientData ? (
                    <>
                        {/* 對話 Header */}
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-1">
                                {selectedPatientData.name} 的對話記錄
                            </h2>
                            <p className="text-sm text-gray-500">
                                共 {patientSessions.length} 個對話
                            </p>
                        </div>

                        {/* 對話列表 */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {patientSessions.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>此病患尚無對話記錄</p>
                                </div>
                            ) : (
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    {patientSessions.map((session) => (
                                        <motion.div
                                            key={session.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                                        >
                                            {/* 對話標題 */}
                                            <div className="mb-4 pb-4 border-b border-gray-100 flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800 text-lg mb-2">
                                                        {session.name || '未命名對話'}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            <span>
                                                                建立: {new Date(session.created_at).toLocaleString('zh-TW')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MessageSquare size={14} />
                                                            <span>{Math.floor(session.history.length / 2)} 則對話</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteClick(session.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                    title="刪除此對話"
                                                >
                                                    <Trash2 size={18} className="text-gray-400 group-hover:text-red-500" />
                                                </button>
                                            </div>

                                            {/* 對話內容 */}
                                            <div className="space-y-4">
                                                {session.history.map((msg, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-4 rounded-lg ${msg.role === 'user'
                                                            ? 'bg-blue-50 border-l-4 border-blue-500'
                                                            : 'bg-gray-50 border-l-4 border-green-500'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs font-semibold text-gray-600 uppercase">
                                                                {msg.role === 'user' ? '🙋 病患' : '🤖 AI助手'}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                            {typeof msg.content === 'string'
                                                                ? msg.content
                                                                : msg.content?.outline || msg.content?.detail || ''}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                            <Users size={64} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg">請選擇病患查看對話記錄</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4"
                    >
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                <Trash2 className="text-red-600" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                確認刪除對話
                            </h3>
                            <p className="text-gray-600 mb-6">
                                確定要刪除此對話記錄嗎？<br />
                                此操作無法復原。
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteCancel}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    確定刪除
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
