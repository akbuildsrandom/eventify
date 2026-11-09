import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      type = 'button',
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary:
        'bg-brand-600 hover:bg-brand-700 text-white shadow-subtle hover:shadow-glow focus:ring-brand-500 border border-transparent',
      secondary:
        'bg-navy-900 hover:bg-navy-800 text-white shadow-subtle focus:ring-navy-800 border border-transparent',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-slate-400 shadow-sm',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus:ring-slate-300 border border-transparent',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-subtle focus:ring-rose-500 border border-transparent',
      gradient:
        'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-premium hover:shadow-glow border border-transparent',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5 font-semibold',
      icon: 'p-2 rounded-lg',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          Icon && <Icon className="w-4 h-4 shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
