export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
      <p className="text-text-muted text-sm mb-8">Last updated: January 2025</p>
      <div className="space-y-6 text-text-secondary leading-relaxed">
        {[
          ['1. Information We Collect', 'We collect information you provide directly: name, email, password (hashed), and payment details. We also automatically collect IP addresses, browser fingerprints, and usage data for fraud prevention and platform analytics.'],
          ['2. How We Use Your Information', 'We use your information to: provide and improve the platform, process payments, verify task completions, detect fraud, send transactional emails, and comply with legal obligations.'],
          ['3. Data Security', 'Passwords are hashed using bcrypt. Payment data is processed by certified payment gateways (Razorpay/Stripe) and never stored on our servers. Files are stored encrypted on AWS S3.'],
          ['4. Fraud Prevention', 'We collect IP addresses, device fingerprints, and behavioral data to prevent fraud. This data is retained for 90 days. Users found engaging in fraudulent activities will have their data reviewed by our team.'],
          ['5. Third-Party Services', 'We use: AWS S3 (file storage), Razorpay/Stripe (payments), SendGrid (email), MongoDB Atlas (database). Each has their own privacy policies governing data handling.'],
          ['6. Your Rights', 'You may request access to, correction of, or deletion of your personal data by contacting support. Account deletion removes personal data within 30 days, except where retention is required by law.'],
          ['7. Cookies', 'We use essential cookies for authentication (JWT refresh tokens). We do not use advertising or tracking cookies.'],
          ['8. Contact', 'For privacy concerns, contact: privacy@codemarket.com'],
        ].map(([title, content]) => (
          <div key={title}>
            <h2 className="text-lg font-semibold text-text-primary mb-2">{title}</h2>
            <p>{content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
