import { useState } from 'react';
import { Mail, MessageCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handle = (e) => {
    e.preventDefault();
    setSent(true);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-text-primary">Contact Us</h1>
        <p className="text-text-secondary mt-2">Have a question? We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[
            { icon: Mail, title: 'Email', desc: 'support@codemarket.com', sub: 'Response within 24h' },
            { icon: MessageCircle, title: 'Live Chat', desc: 'Available in dashboard', sub: 'Mon-Fri 9am-6pm' },
            { icon: Clock, title: 'Support Hours', desc: 'Monday - Friday', sub: '9:00 AM – 6:00 PM IST' },
          ].map(({ icon: Icon, title, desc, sub }) => (
            <div key={title} className="card flex items-start gap-4">
              <div className="p-2.5 bg-primary/10 rounded-lg"><Icon size={18} className="text-primary" /></div>
              <div>
                <p className="font-semibold text-text-primary text-sm">{title}</p>
                <p className="text-text-secondary text-sm">{desc}</p>
                <p className="text-text-muted text-xs">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 card">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={24} className="text-success" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Message sent!</h3>
              <p className="text-text-secondary text-sm">We'll get back to you within 24 hours.</p>
              <button onClick={() => setSent(false)} className="btn-secondary mt-4 text-sm">Send another</button>
            </div>
          ) : (
            <form onSubmit={handle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Subject</label>
                <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Message</label>
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your issue..." className="input resize-none" />
              </div>
              <button type="submit" className="btn-primary w-full">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
