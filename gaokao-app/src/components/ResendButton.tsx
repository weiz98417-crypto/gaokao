import { useState, useEffect, useCallback } from 'react';
import { authApi, AuthApiError } from '../api/auth';
import { Button } from '../design-system';

interface Props {
  email: string;
}

/**
 * 验证码倒计时重发按钮
 *
 * 点击后发送验证码并进入 60 秒冷却期。
 * 冷却期间按钮禁用并显示倒计时。
 */
export function ResendButton({ email }: Props) {
  const [cooldown, setCooldown] = useState(0);

  const handleResend = useCallback(async () => {
    try {
      await authApi.sendVerification(email, 'register');
      setCooldown(60);
    } catch (err: unknown) {
      const message =
        err instanceof AuthApiError ? err.message : '发送失败，请稍后重试';
      alert(message);
    }
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={cooldown > 0}
      onClick={handleResend}
    >
      {cooldown > 0 ? `${cooldown}秒后重新发送` : '重新发送验证码'}
    </Button>
  );
}
