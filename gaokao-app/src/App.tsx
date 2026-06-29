import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import {
  WelcomePage,
  Step1Province,
  Step2Score,
  Step3Confirm,
  Step4Preference,
  Step5Weight,
  ResultsPage,
  RiskReportPage,
} from './pages';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/step1" element={<Step1Province />} />
        <Route path="/step2" element={<Step2Score />} />
        <Route path="/step3" element={<Step3Confirm />} />
        <Route path="/step4" element={<Step4Preference />} />
        <Route path="/step5" element={<Step5Weight />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/risk" element={<RiskReportPage />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-warm-bg">
          <Routes>
            {/* 公开路由：登录 / 注册 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* 受保护路由：需登录才能访问 */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AnimatedRoutes />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
