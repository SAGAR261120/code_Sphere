import nodemailer from 'nodemailer';

let transporter = null;
let testAccountReady = false;

async function getTransporter() {
  if (transporter) return transporter;

  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP credentials required in production. Set SMTP_USER and SMTP_PASS.');
    }

    // Auto-create an Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    if (!testAccountReady) {
      console.log(`\n📧 Dev email ready — using Ethereal test account: ${testAccount.user}`);
      console.log('   Preview sent emails at https://ethereal.email/messages\n');
      testAccountReady = true;
    }

    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: `"${process.env.FROM_NAME || 'CodeMarket'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Email preview: ${previewUrl}`);
  } else {
    console.log('Email sent:', info.messageId);
  }

  return info;
}
