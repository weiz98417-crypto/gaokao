import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { AuthApiError } from '../api/auth';
import { Card, Button, C } from '../design-system';

/**
 * 登录页面
 *
 * 提供邮箱 + 密码登录表单。
 * 登录成功后跳转到首页 /welcome。
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/welcome');
    } catch (err: unknown) {
      const message =
        err instanceof AuthApiError ? err.message : '登录失败，请稍后重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex justify-center items-center px-4"
      style={{ backgroundColor: C.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <Card className="p-8">
          {/* 标题 */}
          <h1
            className="text-2xl font-bold tracking-tight text-center mb-1"
            style={{ color: C.text }}
          >
            🎓 高考志愿填报
          </h1>
          <p
            className="text-sm text-center mb-6"
            style={{ color: C.textMuted }}
          >
            登录你的账号
          </p>

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: C.dangerBg,
                color: C.danger,
              }}
            >
              {error}
            </motion.div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} noValidate>
            {/* 邮箱 */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: C.textSecondary }}
              >
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                style={{ borderColor: C.border, color: C.text }}
              />
            </div>

            {/* 密码 */}
            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: C.textSecondary }}
              >
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="输入密码"
                  className="w-full px-4 py-3 pr-12 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  style={{ borderColor: C.border, color: C.text }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  style={{ color: C.textMuted }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
              className="mb-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full border-2 animate-spin inline-block"
                    style={{
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                    }}
                  />
                  登录中...
                </span>
              ) : (
                '登  录'
              )}
            </Button>

            {/* 注册链接 */}
            <p className="text-center text-sm" style={{ color: C.textMuted }}>
              <Link
                to="/register"
                className="font-medium hover:underline transition-colors duration-200"
                style={{ color: C.primary }}
              >
                还没有账号？立即注册
              </Link>
            </p>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
