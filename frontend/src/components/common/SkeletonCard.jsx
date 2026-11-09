import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-subtle animate-pulse flex flex-col gap-3">
    <div className="w-full h-48 bg-slate-200 rounded-xl" />
    <div className="flex gap-2">
      <div className="w-20 h-5 bg-slate-200 rounded-full" />
      <div className="w-16 h-5 bg-slate-200 rounded-full" />
    </div>
    <div className="w-3/4 h-6 bg-slate-200 rounded-md mt-1" />
    <div className="w-1/2 h-4 bg-slate-200 rounded-md" />
    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
      <div className="w-24 h-5 bg-slate-200 rounded-md" />
      <div className="w-20 h-8 bg-slate-200 rounded-lg" />
    </div>
  </div>
);

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div
        className={`${sizes[size]} border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin`}
      />
    </div>
  );
};

export const EmptyState = ({
  icon: Icon,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  action,
}) => (
  <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-subtle my-6 max-w-lg mx-auto">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
    )}
    <h4 className="text-lg font-bold text-slate-800">{title}</h4>
    <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);
