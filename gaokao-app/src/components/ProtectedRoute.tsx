import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { C } from '../design-system';

/**
 * 路由守卫组件
 *
 * 当用户未登录时，重定向到 /login 页面。
 * 初始化加载期间显示居中 spinner。
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center min-h-[60vh]"
        style={{ backgroundColor: C.bg }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: C.border,
            borderTopColor: C.primary,
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
