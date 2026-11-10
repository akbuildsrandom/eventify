import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  UserCheck,
  Briefcase,
  Eye,
  EyeOff,
  Check,
  Circle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/common/Button';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character (e.g. @, #, $, !, %)'
    ),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
});

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'ORGANIZER' ? 'ORGANIZER' : 'CUSTOMER';
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password') || '';

  const passwordRequirements = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: passwordValue.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter (A-Z)',
      met: /[A-Z]/.test(passwordValue),
    },
    {
      id: 'number',
      label: 'At least one number (0-9)',
      met: /[0-9]/.test(passwordValue),
    },
    {
      id: 'special',
      label: 'Mandatory special character (e.g. @, #, $, !, %)',
      met: /[^A-Za-z0-9]/.test(passwordValue),
    },
  ];

  const isPasswordValid = passwordRequirements.every((r) => r.met);

  const onSubmit = async (data) => {
    if (!isPasswordValid) return;

    try {
      setIsLoading(true);
      await registerUser({
        ...data,
        role: selectedRole,
      });
      navigate('/login');
    } catch {
      // Handled in toast store
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="text-2xl font-black text-slate-900">Create an Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Join thousands booking and hosting live experiences
          </p>
        </div>

        {/* Account Role Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('CUSTOMER')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'CUSTOMER'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Attendee</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('ORGANIZER')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'ORGANIZER'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Event Host</span>
          </button>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Full Name or Organization
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Aarav Sharma / TechSpark"
                {...register('name')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
            {errors.name && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.name.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                {...register('phone')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
            {errors.phone && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.phone.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                {...register('password')}
                aria-label="Password"
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Validation error message if invalid */}
            {errors.password && (
              <p
                className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1"
                role="alert"
              >
                <span>{errors.password.message}</span>
              </p>
            )}

            {/* Live Password Requirements Checklist */}
            <div className="mt-2.5 p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Password Requirements</span>
                <span
                  className={`text-[10px] font-semibold ${
                    isPasswordValid ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {passwordRequirements.filter((r) => r.met).length} of 4 met
                </span>
              </div>

              <ul className="space-y-1.5" aria-label="Password requirements">
                {passwordRequirements.map((req) => (
                  <li
                    key={req.id}
                    data-testid={`req-${req.id}`}
                    className={`flex items-center gap-2 text-[11px] transition-colors duration-150 ${
                      req.met ? 'text-emerald-600 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {req.met ? (
                      <Check
                        className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
                        data-testid={`check-${req.id}`}
                      />
                    ) : (
                      <Circle
                        className="w-3.5 h-3.5 text-slate-300 flex-shrink-0"
                        data-testid={`pending-${req.id}`}
                      />
                    )}
                    <span>{req.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            <span>Create {selectedRole === 'ORGANIZER' ? 'Host' : 'Attendee'} Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
