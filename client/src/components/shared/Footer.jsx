import { Link } from 'react-router-dom';
import { Code2, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Code2 size={18} className="text-white" />
              </div>
              <span>Code<span className="text-primary">Market</span></span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed">
              Premium source code marketplace. Earn coins, buy projects, build faster.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-text-muted hover:text-text-primary">
                <Github size={16} />
              </a>
              <a href="#" className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-text-muted hover:text-text-primary">
                <Twitter size={16} />
              </a>
              <a href="#" className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-text-muted hover:text-text-primary">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">Platform</h4>
            <ul className="space-y-2">
              {[['Marketplace', '/marketplace'], ['Earn Coins', '/dashboard/tasks'], ['Pricing', '/marketplace']].map(([label, to]) => (
                <li key={label}><Link to={to} className="text-text-secondary hover:text-text-primary text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">Support</h4>
            <ul className="space-y-2">
              {[['FAQ', '/faq'], ['Contact', '/contact'], ['Help Center', '/faq']].map(([label, to]) => (
                <li key={label}><Link to={to} className="text-text-secondary hover:text-text-primary text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">Legal</h4>
            <ul className="space-y-2">
              {[['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']].map(([label, to]) => (
                <li key={label}><Link to={to} className="text-text-secondary hover:text-text-primary text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">© {new Date().getFullYear()} CodeMarket. All rights reserved.</p>
          <p className="text-text-muted text-sm">Built for developers, by developers.</p>
        </div>
      </div>
    </footer>
  );
}
