import { describe, it, expect } from 'vitest';
import {
  formatRelativeTime, formatDate, getInitials, getUserDisplayName,
  truncate, formatFileSize, pluralize, cn, getAvatarColor,
} from '@/utils';

describe('formatRelativeTime', () => {
  it('returns "just now" for very recent dates', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes for recent dates', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('returns hours for hour-old dates', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days for day-old dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });
});

describe('formatDate', () => {
  it('formats in short format', () => {
    const date = '2024-01-15T10:00:00.000Z';
    const result = formatDate(date, 'short');
    expect(result).toMatch(/Jan\s+15/);
  });

  it('formats time correctly', () => {
    const date = '2024-01-15T14:30:00.000Z';
    const result = formatDate(date, 'time');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('getInitials', () => {
  it('returns two initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns one initial from single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('limits to max initials', () => {
    expect(getInitials('John Michael Doe', 2)).toBe('JM');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('uppercases initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});

describe('getUserDisplayName', () => {
  it('returns full name for valid user', () => {
    expect(getUserDisplayName({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe');
  });

  it('returns "Unknown User" for null', () => {
    expect(getUserDisplayName(null)).toBe('Unknown User');
  });
});

describe('truncate', () => {
  it('returns full string when under limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis when over limit', () => {
    const result = truncate('Hello World', 5);
    expect(result).toContain('…');
    expect(result.length).toBeLessThanOrEqual(6);
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});

describe('pluralize', () => {
  it('returns singular for count 1', () => {
    expect(pluralize(1, 'item')).toBe('1 item');
  });

  it('returns plural for count > 1', () => {
    expect(pluralize(5, 'item')).toBe('5 items');
  });

  it('uses custom plural form', () => {
    expect(pluralize(2, 'person', 'people')).toBe('2 people');
  });
});

describe('cn (classname merger)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles undefined', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });
});

describe('getAvatarColor', () => {
  it('returns a valid CSS class', () => {
    const color = getAvatarColor('507f1f77bcf86cd799439011');
    expect(color).toMatch(/^bg-/);
  });

  it('returns consistent color for same ID', () => {
    const id = '507f1f77bcf86cd799439011';
    expect(getAvatarColor(id)).toBe(getAvatarColor(id));
  });

  it('can return different colors for different IDs', () => {
    const colors = new Set([
      getAvatarColor('aaa'),
      getAvatarColor('bbb'),
      getAvatarColor('ccc'),
      getAvatarColor('ddd'),
      getAvatarColor('eee'),
    ]);
    expect(colors.size).toBeGreaterThan(1);
  });
});
