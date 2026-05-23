export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Terms of Service</h1>
      <p className="text-text-muted text-sm mb-8">Last updated: January 2025</p>
      <div className="space-y-6 text-text-secondary leading-relaxed">
        {[
          ['1. Acceptance of Terms', 'By accessing CodeMarket, you agree to be bound by these terms. If you disagree, please do not use the platform.'],
          ['2. Account Responsibility', 'You are responsible for maintaining the confidentiality of your account. You agree not to share your account credentials or allow others to access your account.'],
          ['3. Coin Economy', 'Coins are platform credits with no monetary value and cannot be exchanged for money. Coins earned through task completion are subject to verification. Fraudulent completion attempts will result in coin forfeiture and account suspension.'],
          ['4. Purchases', 'All sales are final unless the product materially fails to match its description. Download limits apply per purchase (maximum 10 downloads). We reserve the right to revoke access to purchases made fraudulently.'],
          ['5. Content Policy', 'Products on CodeMarket must not contain malicious code, illegal content, or infringe on third-party intellectual property. Uploaded products are reviewed before activation.'],
          ['6. Prohibited Activities', 'Automated task completion, creating multiple accounts, VPN usage to circumvent geographic restrictions, and any form of fraud is strictly prohibited and will result in permanent bans.'],
          ['7. Limitation of Liability', 'CodeMarket is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from use of the platform or downloaded products.'],
          ['8. Changes to Terms', 'We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.'],
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
