/**
 * 邮件服务接口
 */
export interface IEmailService {
  /**
   * 发送验证码邮件
   * @param email 收件人邮箱
   * @param code 6 位验证码明文
   */
  sendVerificationCode(email: string, code: string): Promise<void>;
}

/**
 * Brevo REST API 邮件服务
 *
 * 使用 Brevo（原 Sendinblue）Transactional Email API 发送邮件。
 * 免费额度：300 封/天，无需配置域名或 SMTP，仅需 API Key。
 * API Key 从环境变量 BREVO_API_KEY 读取。
 */
export class BrevoEmailService implements IEmailService {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@gaokao-app.com';
    this.fromName = process.env.BREVO_FROM_NAME || '高考志愿填报系统';
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const body = JSON.stringify({
      sender: {
        name: this.fromName,
        email: this.fromEmail,
      },
      to: [{ email }],
      subject: '高考志愿填报 - 邮箱验证码',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #C04A1A;">🎓 高考志愿填报系统</h2>
          <p>您好！您正在注册或验证账号，验证码如下：</p>
          <div style="background: #f5f0eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #C04A1A;">
              ${code}
            </span>
          </div>
          <p style="color: #666;">验证码 <strong>5 分钟</strong>内有效，请勿泄露给他人。</p>
          <hr style="border: none; border-top: 1px solid #e0d5c7; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            如果这不是您的操作，请忽略此邮件。
          </p>
        </div>
      `,
    });

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Brevo API error ${res.status}: ${errBody}`);
    }
  }
}

/**
 * 控制台邮件服务（开发环境 / 无 API Key 时使用）
 *
 * 不实际发送邮件，仅通过 console.log 打印验证码。
 */
export class ConsoleEmailService implements IEmailService {
  async sendVerificationCode(email: string, code: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`\n📧 [DEV EMAIL] To: ${email} | 验证码: ${code}\n`);
  }
}

/**
 * 邮件服务工厂函数
 *
 * 优先级：
 * 1. BREVO_API_KEY 已设置 → BrevoEmailService（真实发送）
 * 2. 否则 → ConsoleEmailService（控制台打印）
 */
export function createEmailService(): IEmailService {
  if (process.env.BREVO_API_KEY) {
    return new BrevoEmailService();
  }
  return new ConsoleEmailService();
}
