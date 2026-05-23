import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service.js';

const schema = z.object({ email: z.string().email() });

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ email }) => authService.forgotPassword(email),
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(err.response?.data?.message || 'Request failed'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Forgot password?</h1>
          <p className="text-text-secondary mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={24} className="text-success" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Check your email</h3>
              <p className="text-text-secondary text-sm">We've sent a password reset link. Check your inbox and spam folder.</p>
              <Link to="/login" className="btn-primary mt-6 block text-center">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(mutate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email address</label>
                <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
                {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isPending} className="btn-primary w-full flex items-center justify-center gap-2">
                {isPending && <Loader2 size={16} className="animate-spin" />}
                Send Reset Link
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-text-secondary hover:text-text-primary text-sm mt-2">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
