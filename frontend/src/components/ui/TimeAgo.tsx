import React from 'react';

interface TimeAgoProps {
  date: Date;
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours`;
  if (diffDays === 1) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export const TimeAgo: React.FC<TimeAgoProps> = ({ date, className }) => (
  <span className={className}>{formatTimeAgo(date)}</span>
);
