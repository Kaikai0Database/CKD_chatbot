import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import DoctorLoginPage from './pages/DoctorLoginPage';
import DoctorRegisterPage from './pages/DoctorRegisterPage';
import DoctorForgotPasswordPage from './pages/DoctorForgotPasswordPage';
import DoctorResetPasswordPage from './pages/DoctorResetPasswordPage';
import DoctorDashboard from './pages/DoctorDashboard';
import RoleSelectionPage from './pages/RoleSelectionPage';

function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      console.log('Current user:', user);
    }
  }, [user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/doctor/login" element={<DoctorLoginPage />} />
        <Route path="/doctor/register" element={<DoctorRegisterPage />} />
        <Route path="/doctor/forgot-password" element={<DoctorForgotPasswordPage />} />
        <Route path="/doctor/reset-password" element={<DoctorResetPasswordPage />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
