import React from 'react';

interface TagProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ children, variant = 'neutral', className }) => {
  const baseClasses = 'px-2.5 py-0.5 text-xs leading-5 font-semibold rounded-full inline-flex items-center';
  const variantClasses = {
    neutral: 'bg-gray-100 text-gray-800',
    success: 'bg-status-success-soft text-status-success',
    warning: 'bg-status-warning-soft text-status-warning',
    danger: 'bg-status-danger-soft text-status-danger',
    info: 'bg-status-info-soft text-status-info',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};
