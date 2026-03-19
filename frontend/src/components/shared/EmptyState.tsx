import React from 'react';
import { cn } from '@/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
    {icon && (
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
        {icon}
      </div>
    )}
    <p className="text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>{title}</p>
    {description && <p className="text-xs text-gray-400 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
