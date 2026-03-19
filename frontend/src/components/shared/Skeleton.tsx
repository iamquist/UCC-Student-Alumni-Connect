import React from 'react';
import { cn } from '@/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={cn('skeleton rounded', className)} />
    ))}
  </>
);

export const PostSkeleton: React.FC = () => (
  <div className="card p-5 mb-4 animate-pulse">
    <div className="flex gap-3 mb-4">
      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="skeleton h-3 w-36 rounded" />
        <div className="skeleton h-2.5 w-24 rounded" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
      <div className="skeleton h-3 w-4/6 rounded" />
    </div>
    <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
      <div className="skeleton h-4 w-12 rounded" />
      <div className="skeleton h-4 w-12 rounded" />
    </div>
  </div>
);

export const UserCardSkeleton: React.FC = () => (
  <div className="card p-4 flex items-center gap-3 animate-pulse">
    <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3 w-32 rounded" />
      <div className="skeleton h-2.5 w-24 rounded" />
    </div>
  </div>
);

export const JobCardSkeleton: React.FC = () => (
  <div className="card p-4 flex gap-4 mb-3 animate-pulse">
    <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3 w-40 rounded" />
      <div className="skeleton h-2.5 w-28 rounded" />
      <div className="skeleton h-2.5 w-full rounded" />
      <div className="skeleton h-2.5 w-4/5 rounded" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-gray-50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-3 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
);

export default Skeleton;
