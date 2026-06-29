import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { authApi, AuthApiError } from '../api/auth';
import { ResendButton } from '../components/ResendButton';
import { Card, Button, C } from '../design-system';

/**
 * 注册页面（两步流程）
 *
 * 步骤 1：填写昵称、邮箱、密码 → 注册并发送验证码
 * 步骤 2：输入 6 位验证码 → 验证邮箱 → 跳转首页
 */
export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  /* ========== 步骤 1：注册 ========== */

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ email, password, nickname: nickname || undefined });
      setStep('verify');
    } catch (err: unknown) {
      const message =
        err instanceof AuthApiError ? err.message : '注册失败，请稍后重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* ========== 步骤 2：验证邮箱 ========== */

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.verifyEmail(email, code);
      setSuccess('验证成功！即将跳转...');
      setTimeout(() => navigate('/welcome'), 1200);
    } catch (err: unknown) {
      const message =
        err instanceof AuthApiError ? err.message : '验证失败，请检查验证码';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* ========== 验证码输入处理 ========== */

  const handleCodeChange = (index: number, value: string) => {
    // 处理粘贴完整验证码
    if (value.length > 1) {
      const codes = value.replace(/\D/g, '').slice(0, 6).split('');
      codes.forEach((c, i) => {
        if (codeInputs.current[i]) codeInputs.current[i]!.value = c;
      });
      setCode(codes.join('').padEnd(6, ''));
      codeInputs.current[Math.min(codes.length, 5)]?.focus();
      return;
    }

    const newCode = code.split('');
    newCode[index] = value;
    setCode(newCode.join(''));
    if (value && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  /* ========== 步骤 2 UI：验证邮箱 ========== */

  if (step === 'verify') {
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
          <Card className="p-8 text-center">
            {/* 标题 */}
            <h1
              className="text-2xl font-bold tracking-tight mb-1"
              style={{ color: C.text }}
            >
              📧 验证邮箱
            </h1>
            <p
              className="text-sm mb-5"
              style={{ color: C.textMuted }}
            >
              验证码已发送至{' '}
              <strong style={{ color: C.text }}>{email}</strong>
            </p>

            {/* 错误提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-left"
                style={{
                  backgroundColor: C.dangerBg,
                  color: C.danger,
                }}
              >
                {error}
              </motion.div>
            )}

            {/* 成功提示 */}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: C.sageBg,
                  color: C.sage,
                }}
              >
                {success}
              </motion.div>
            )}

            {/* 6 位验证码输入 */}
            <div className="flex gap-2 justify-center mb-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  ref={(el) => {
                    codeInputs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={i === 0}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 rounded-xl border text-center text-2xl font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  style={{
                    borderColor: C.border,
                    color: C.text,
                  }}
                />
              ))}
            </div>

            {/* 验证按钮 */}
            <Button
              fullWidth
              size="lg"
              disabled={loading || code.length !== 6}
              onClick={handleVerify}
              className="mb-3"
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
                  验证中...
                </span>
              ) : (
                '验  证'
              )}
            </Button>

            {/* 重发按钮 */}
            <ResendButton email={email} />
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ========== 步骤 1 UI：注册表单 ========== */

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
            创建账号
          </h1>
          <p
            className="text-sm text-center mb-6"
            style={{ color: C.textMuted }}
          >
            注册后即可使用智能志愿填报
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
          <form onSubmit={handleRegister} noValidate>
            {/* 昵称 */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: C.textSecondary }}
              >
                昵称（选填）
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="你的昵称"
                className="w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                style={{ borderColor: C.border, color: C.text }}
              />
            </div>

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
                密码（至少8位）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="至少8位字符"
                minLength={8}
                className="w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                style={{ borderColor: C.border, color: C.text }}
              />
            </div>

            {/* 注册按钮 */}
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
                  注册中...
                </span>
              ) : (
                '发送验证码'
              )}
            </Button>

            {/* 登录链接 */}
            <p className="text-center text-sm" style={{ color: C.textMuted }}>
              <Link
                to="/login"
                className="font-medium hover:underline transition-colors duration-200"
                style={{ color: C.primary }}
              >
                已有账号？立即登录
              </Link>
            </p>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
