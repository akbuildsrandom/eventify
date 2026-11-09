import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/common/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const user = await login(data);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'ORGANIZER') {
        navigate('/organizer/dashboard');
      } else {
        navigate(redirectUrl);
      }
    } catch {
      // Handled in store toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (email, password) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-premium">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-glow">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-black text-2xl text-slate-900 tracking-tight">Eventify</span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900">Welcome Back</h2>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to manage your tickets, bookings and events
          </p>
        </div>

        {/* Demo Fast Login Helper */}
        <div className="p-3.5 mb-6 rounded-2xl bg-brand-50/70 border border-brand-200/60 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-brand-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Fast Demo Credentials</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('customer1@eventify.com', 'Password123!')}
              className="py-1 px-2 rounded-lg bg-white font-semibold text-[11px] text-slate-700 border border-slate-200 hover:border-brand-400 hover:text-brand-600 transition-colors shadow-2xs"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('organizer1@eventify.com', 'Password123!')}
              className="py-1 px-2 rounded-lg bg-white font-semibold text-[11px] text-slate-700 border border-slate-200 hover:border-brand-400 hover:text-brand-600 transition-colors shadow-2xs"
            >
              Organizer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@eventify.com', 'Password123!')}
              className="py-1 px-2 rounded-lg bg-white font-semibold text-[11px] text-slate-700 border border-slate-200 hover:border-brand-400 hover:text-brand-600 transition-colors shadow-2xs"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.email.message}</span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-brand-600 hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
            {errors.password && (
              <span className="text-[11px] text-rose-500 mt-1 block">
                {errors.password.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
