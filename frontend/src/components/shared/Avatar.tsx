import React from 'react';
import { cn, getInitials, getAvatarColor } from '@/utils';

interface AvatarProps {
  user?: { firstName: string; lastName: string; profilePicture?: string; _id?: string } | null;
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  online?: boolean;
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

const dotSizes = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2 border',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
  '2xl': 'w-5 h-5 border-2',
};

export const Avatar: React.FC<AvatarProps> = ({
  user,
  src,
  name,
  size = 'md',
  online,
  className,
}) => {
  const imgSrc = src || user?.profilePicture;
  const displayName = name || (user ? `${user.firstName} ${user.lastName}` : '?');
  const initials = getInitials(displayName);
  const colorClass = user?._id ? getAvatarColor(user._id) : 'bg-gray-300';

  return (
    <div className={cn('relative flex-shrink-0 inline-flex', className)}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={displayName}
          className={cn('avatar', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
            sizes[size],
            colorClass
          )}
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            dotSizes[size],
            online ? 'bg-green-400' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
