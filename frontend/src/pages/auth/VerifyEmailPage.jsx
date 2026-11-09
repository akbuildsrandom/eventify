import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import { LoadingSpinner } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in URL.');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification link expired or already used.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-premium text-center">
        {status === 'verifying' && (
          <div>
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-bold text-slate-900 mt-4">Verifying Email...</h2>
            <p className="text-xs text-slate-500 mt-1">Please wait while we validate your token.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Email Verified!</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your email address has been successfully verified. You now have full access to Eventify.
            </p>
            <div className="mt-8">
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  <span>Sign In to Your Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Verification Failed</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{message}</p>
            <div className="mt-8">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
