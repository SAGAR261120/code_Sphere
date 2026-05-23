import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Coins, Download, ShoppingBag, Users, CheckCircle, Zap } from 'lucide-react';
import { ProductCard } from '../../components/marketplace/ProductCard.jsx';
import { useFeaturedProducts } from '../../hooks/useProducts.js';
import { CardSkeleton } from '../../components/shared/PageLoader.jsx';

const STATS = [
  { label: 'Products', value: '500+', icon: ShoppingBag },
  { label: 'Developers', value: '12K+', icon: Users },
  { label: 'Coins Earned', value: '2M+', icon: Coins },
  { label: 'Downloads', value: '50K+', icon: Download },
];

const STEPS = [
  { step: '01', icon: ShoppingBag, title: 'Browse Products', desc: 'Explore hundreds of premium source code projects across all categories.' },
  { step: '02', icon: Coins, title: 'Earn Coins', desc: 'Complete simple tasks to earn coins you can spend on any product.' },
  { step: '03', icon: Download, title: 'Unlock & Download', desc: 'Pay with money, coins, or both. Instant access, no waiting.' },
];

const CATEGORIES = [
  { name: 'Web Apps', icon: '🌐', count: 120 },
  { name: 'Mobile Apps', icon: '📱', count: 85 },
  { name: 'SaaS Projects', icon: '☁️', count: 64 },
  { name: 'E-commerce', icon: '🛒', count: 48 },
  { name: 'Admin Panels', icon: '⚙️', count: 37 },
  { name: 'APIs & Scripts', icon: '🔧', count: 92 },
];

export default function HomePage() {
  const { data: featured, isLoading } = useFeaturedProducts(6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-primary text-sm font-medium mb-6">
              <Zap size={14} /> New products added weekly
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary leading-tight mb-6">
              Unlock Premium Code.
              <br />
              <span className="text-primary">Earn Coins. Build Faster.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
              The marketplace for developers. Browse source code, earn coins by completing tasks,
              and unlock premium projects instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/marketplace" className="btn-primary text-base py-3 px-8 flex items-center justify-center gap-2">
                Browse Marketplace <ArrowRight size={18} />
              </Link>
              <Link to="/dashboard/tasks" className="btn-secondary text-base py-3 px-8 flex items-center justify-center gap-2">
                <Coins size={18} /> Earn Coins Free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon size={20} className="text-primary mx-auto mb-2" />
                <p className="text-2xl font-extrabold text-text-primary">{value}</p>
                <p className="text-text-secondary text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Featured Products</h2>
              <p className="text-text-secondary mt-1">Hand-picked premium source code projects</p>
            </div>
            <Link to="/marketplace" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
              : featured?.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-text-primary">How It Works</h2>
            <p className="text-text-secondary mt-2">Simple 3-step process to access any project</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Icon size={28} className="text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(({ name, icon, count }) => (
              <Link
                key={name}
                to={`/marketplace?category=${name}`}
                className="card text-center hover:border-primary/40 hover:bg-surface-2 transition-all cursor-pointer group"
              >
                <div className="text-3xl mb-2">{icon}</div>
                <p className="font-medium text-text-primary text-sm group-hover:text-primary transition-colors">{name}</p>
                <p className="text-text-muted text-xs mt-0.5">{count} products</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-surface border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/20 rounded-2xl p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">Start earning coins today</h2>
            <p className="text-text-secondary mb-6">Complete tasks, build your coin balance, and unlock premium products — all for free.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="btn-primary flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Create Free Account
              </Link>
              <Link to="/marketplace" className="btn-secondary flex items-center justify-center gap-2">
                <ShoppingBag size={16} /> Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
