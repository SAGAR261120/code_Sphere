const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0F1117; color: #F8FAFC; margin: 0; padding: 0;
`;
const cardStyle = `
  max-width: 560px; margin: 40px auto; background: #1A1D27;
  border-radius: 16px; border: 1px solid #2A2D3E; overflow: hidden;
`;
const headerStyle = `
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  padding: 32px 40px; text-align: center;
`;
const bodyStyle = `padding: 40px;`;
const btnStyle = `
  display: inline-block; background: #6366F1; color: #fff;
  padding: 14px 32px; border-radius: 8px; text-decoration: none;
  font-weight: 600; font-size: 16px; margin: 24px 0;
`;
const footerStyle = `
  padding: 24px 40px; border-top: 1px solid #2A2D3E;
  text-align: center; color: #94A3B8; font-size: 13px;
`;

export function emailVerificationTemplate(name, verifyUrl) {
  return `
    <html><body style="${baseStyle}">
    <div style="${cardStyle}">
      <div style="${headerStyle}">
        <h1 style="margin:0;font-size:28px;font-weight:700;">CodeMarket</h1>
        <p style="margin:8px 0 0;opacity:.8;">Verify your email address</p>
      </div>
      <div style="${bodyStyle}">
        <h2 style="color:#F8FAFC;margin:0 0 16px;">Hello, ${name}! 👋</h2>
        <p style="color:#94A3B8;line-height:1.6;">
          Welcome to CodeMarket! Please verify your email to activate your account and start earning coins.
        </p>
        <div style="text-align:center;">
          <a href="${verifyUrl}" style="${btnStyle}">Verify Email Address</a>
        </div>
        <p style="color:#64748B;font-size:13px;">
          This link expires in 24 hours. If you didn't create an account, ignore this email.
        </p>
      </div>
      <div style="${footerStyle}">© ${new Date().getFullYear()} CodeMarket. All rights reserved.</div>
    </div></body></html>
  `;
}

export function passwordResetTemplate(name, resetUrl) {
  return `
    <html><body style="${baseStyle}">
    <div style="${cardStyle}">
      <div style="${headerStyle}">
        <h1 style="margin:0;font-size:28px;font-weight:700;">CodeMarket</h1>
        <p style="margin:8px 0 0;opacity:.8;">Password Reset Request</p>
      </div>
      <div style="${bodyStyle}">
        <h2 style="color:#F8FAFC;margin:0 0 16px;">Reset your password</h2>
        <p style="color:#94A3B8;line-height:1.6;">
          Hi ${name}, we received a request to reset your password. Click below to set a new one.
        </p>
        <div style="text-align:center;">
          <a href="${resetUrl}" style="${btnStyle}">Reset Password</a>
        </div>
        <p style="color:#64748B;font-size:13px;">
          This link expires in 1 hour. If you didn't request this, your account is safe — ignore this email.
        </p>
      </div>
      <div style="${footerStyle}">© ${new Date().getFullYear()} CodeMarket. All rights reserved.</div>
    </div></body></html>
  `;
}

export function purchaseConfirmationTemplate(name, productName, orderNumber, downloadUrl) {
  return `
    <html><body style="${baseStyle}">
    <div style="${cardStyle}">
      <div style="${headerStyle}">
        <h1 style="margin:0;font-size:28px;font-weight:700;">CodeMarket</h1>
        <p style="margin:8px 0 0;opacity:.8;">Purchase Confirmed 🎉</p>
      </div>
      <div style="${bodyStyle}">
        <h2 style="color:#F8FAFC;margin:0 0 16px;">Thank you, ${name}!</h2>
        <p style="color:#94A3B8;line-height:1.6;">
          Your order <strong style="color:#6366F1;">${orderNumber}</strong> for
          <strong style="color:#F8FAFC;">${productName}</strong> is ready.
        </p>
        <div style="text-align:center;">
          <a href="${downloadUrl}" style="${btnStyle}">Download Now</a>
        </div>
        <p style="color:#64748B;font-size:13px;">
          You can also access your downloads anytime from your Dashboard → Downloads.
        </p>
      </div>
      <div style="${footerStyle}">© ${new Date().getFullYear()} CodeMarket. All rights reserved.</div>
    </div></body></html>
  `;
}

export function taskRewardTemplate(name, coins, taskTitle) {
  return `
    <html><body style="${baseStyle}">
    <div style="${cardStyle}">
      <div style="${headerStyle}">
        <h1 style="margin:0;font-size:28px;font-weight:700;">CodeMarket</h1>
        <p style="margin:8px 0 0;opacity:.8;">Coins Earned! 🪙</p>
      </div>
      <div style="${bodyStyle}">
        <h2 style="color:#F8FAFC;margin:0 0 16px;">Great work, ${name}!</h2>
        <p style="color:#94A3B8;line-height:1.6;">
          You just earned <strong style="color:#F59E0B;font-size:20px;">${coins} coins</strong>
          for completing: <strong style="color:#F8FAFC;">${taskTitle}</strong>
        </p>
        <p style="color:#94A3B8;line-height:1.6;">
          Keep completing tasks to earn more coins and unlock premium products!
        </p>
        <div style="text-align:center;">
          <a href="${process.env.CLIENT_URL}/dashboard/tasks" style="${btnStyle}">View More Tasks</a>
        </div>
      </div>
      <div style="${footerStyle}">© ${new Date().getFullYear()} CodeMarket. All rights reserved.</div>
    </div></body></html>
  `;
}
