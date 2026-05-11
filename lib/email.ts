import nodemailer from 'nodemailer';

type SmtpConfig = {
  user: string;
  pass: string;
  from: string;
};

let transportVerificationPromise: Promise<boolean> | null = null;

function getSmtpConfig(): SmtpConfig {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!user || !pass || !from) {
    throw new Error('SMTP configuration is missing');
  }

  return { user, pass, from };
}

function createTransporter() {
  const { user, pass } = getSmtpConfig();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { rejectUnauthorized: true }
  });
}

function classifySmtpError(error: unknown) {
  const smtpError = error as { code?: unknown; message?: unknown } | null;
  const message = String(smtpError?.message || '').toLowerCase();
  const code = String(smtpError?.code || '');

  if (code === 'EAUTH' || message.includes('invalid login') || message.includes('username and password not accepted')) {
    return 'auth';
  }
  if (code === 'ETIMEDOUT' || message.includes('timeout') || message.includes('connection timeout')) {
    return 'timeout';
  }
  if (code === 'ECONNECTION' || message.includes('connection') || message.includes('network')) {
    return 'network';
  }
  if (message.includes('tls') || message.includes('certificate')) {
    return 'tls';
  }
  return 'unknown';
}

export async function verifyEmailTransport() {
  if (!transportVerificationPromise) {
    transportVerificationPromise = createTransporter()
      .verify()
      .then(() => true)
      .catch((error: unknown) => {
        const category = classifySmtpError(error);
        const smtpError = error as { code?: unknown; message?: unknown } | null;
        console.error('[SMTP VERIFY ERROR]', { category, code: smtpError?.code, message: smtpError?.message });
        return false;
      });
  }
  return transportVerificationPromise;
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  const { from } = getSmtpConfig();
  const transporter = createTransporter();

  await verifyEmailTransport();

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Verify your email address',
      text: [
        'Welcome to UniWork!',
        '',
        'Please verify your email address by opening the link below:',
        verifyUrl,
        '',
        'This verification link expires in 24 hours.'
      ].join('\n')
    });
  } catch (error: any) {
    const category = classifySmtpError(error);
    console.error('[SMTP SEND ERROR]', { category, code: error?.code, command: error?.command, message: error?.message });
    throw error;
  }
}
