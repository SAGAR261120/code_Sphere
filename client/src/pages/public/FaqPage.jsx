import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const FAQS = [
  {
    category: 'General',
    items: [
      { q: 'What is CodeMarket?', a: 'CodeMarket is a marketplace where developers can buy and sell source code projects. Users can also earn coins by completing tasks and use those coins to unlock products.' },
      { q: 'Is CodeMarket free to join?', a: 'Yes! Creating an account is completely free. You can start earning coins immediately and use them to access products without spending money.' },
      { q: 'How do coins work?', a: 'Coins are our platform currency. Earn them by completing tasks (visiting links, watching content, etc.) and spend them to unlock products. Coins cannot be converted to money.' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods are accepted?', a: 'We accept Razorpay (UPI, cards, netbanking), Stripe (international cards), and manual bank transfers.' },
      { q: 'Can I get a refund?', a: 'Refunds are handled on a case-by-case basis. Contact support within 7 days of purchase if the product doesn\'t match its description.' },
      { q: 'What currencies are supported?', a: 'We primarily support INR via Razorpay. International payments are supported via Stripe in USD/EUR.' },
    ],
  },
  {
    category: 'Tasks',
    items: [
      { q: 'How do I earn coins?', a: 'Visit the Task Center, click "Start Task", complete the required action (usually visiting a link for a set duration), then click "Claim Coins".' },
      { q: 'Why was my task rejected?', a: 'Tasks are rejected if our system detects insufficient time spent, IP mismatches, or multiple accounts from the same network.' },
      { q: 'Can I complete the same task multiple times?', a: 'Each task has a configurable maximum completions limit and cooldown period set by the admin.' },
    ],
  },
  {
    category: 'Downloads',
    items: [
      { q: 'How do I download a product?', a: 'After purchase, go to Dashboard → Downloads or Orders, and click the Download button. Each purchase allows up to 10 downloads.' },
      { q: 'What format are the files in?', a: 'Products are delivered as ZIP archives containing the complete source code, documentation, and setup guide.' },
      { q: 'What if my download link expires?', a: 'Download links are valid for 24 hours. You can always go to Dashboard → Orders and generate a new download link.' },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors"
      >
        <span className="font-medium text-text-primary">{q}</span>
        <ChevronDown size={16} className={cn('text-text-muted shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-5 pb-4 text-text-secondary text-sm leading-relaxed border-t border-border pt-4">{a}</div>}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-text-primary">Frequently Asked Questions</h1>
        <p className="text-text-secondary mt-2">Everything you need to know about CodeMarket</p>
      </div>
      <div className="space-y-8">
        {FAQS.map(({ category, items }) => (
          <div key={category}>
            <h2 className="text-lg font-semibold text-text-primary mb-3">{category}</h2>
            <div className="space-y-2">
              {items.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
