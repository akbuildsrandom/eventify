import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { toast } from '../../store/toastStore';

export const CustomerProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { register: regProfile, handleSubmit: submitProfile } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    },
  });

  const {
    register: regPassword,
    handleSubmit: submitPassword,
    reset: resetPasswordForm,
  } = useForm();

  const onUpdateProfile = async (data) => {
    try {
      setIsUpdatingProfile(true);
      const res = await authService.updateProfile(data);
      if (res?.data?.user) {
        setUser({ ...user, ...res.data.user });
        toast.success('Profile Updated', 'Your profile details have been saved.');
      }
    } catch (err) {
      toast.error('Update Failed', err.message || 'Could not update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Validation Error', 'New passwords do not match');
      return;
    }
    try {
      setIsChangingPassword(true);
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password Changed', 'Your account password has been updated.');
      resetPasswordForm();
    } catch (err) {
      toast.error('Password Error', err.message || 'Could not update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 1. Profile Information */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your public profile and contact preferences
          </p>
        </div>

        <form onSubmit={submitProfile(onUpdateProfile)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                {...regProfile('name')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Email cannot be changed directly for security purposes.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                {...regProfile('phone')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Avatar Image URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              {...regProfile('avatar')}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
            />
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={isUpdatingProfile}>
            Save Changes
          </Button>
        </form>
      </div>

      {/* 2. Change Password */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ensure your account is protected with a strong password
          </p>
        </div>

        <form onSubmit={submitPassword(onChangePassword)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                {...regPassword('currentPassword')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Min. 8 characters"
                {...regPassword('newPassword')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                {...regPassword('confirmPassword')}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={isChangingPassword}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};
