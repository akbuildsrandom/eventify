import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { toast } from '../../store/toastStore';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      await authService.forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Email Sent', 'If an account exists, a reset link has been dispatched.');
    } catch (err) {
      toast.error('Error', err.message || 'Could not process request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-premium">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>

        {isSubmitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Check Your Email</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We have dispatched a password reset link to <strong>{email}</strong>. Please check your inbox or spam folder.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Forgot Password</h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter your registered email address and we will send you a secure link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
