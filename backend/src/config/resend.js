import { Resend } from 'resend';
import { env } from './env.js';

const isConfigured = Boolean(
  env.RESEND_API_KEY &&
  !env.RESEND_API_KEY.includes('your_') &&
  env.RESEND_API_KEY.startsWith('re_')
);

let resendClient = null;
if (isConfigured) {
  resendClient = new Resend(env.RESEND_API_KEY);
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isConfigured || !resendClient) {
    console.warn(`[Resend Notice] Resend API key not configured. Mocking email delivery to ${to}: "${subject}"`);
    return {
      id: `mock_email_${Date.now()}`,
      to,
      subject,
      status: 'simulated_dev_delivery',
      isConfigured: false,
    };
  }

  try {
    const data = await resendClient.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || subject,
    });
    return { ...data, isConfigured: true };
  } catch (error) {
    console.error(`[Resend Error] Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

export { resendClient, isConfigured as isResendConfigured };
