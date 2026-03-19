import { describe, it, expect } from '@jest/globals';
import {
  isValidEmail, isValidPassword, isValidObjectId, isValidUrl,
  isFutureDate, isPastDate, isValidDateRange, isValidFileSize,
  isValidLength, validateRequired, isValidEnum, sanitizeString,
} from '../../utils/validators.js';
import {
  capitalize, capitalizeWords, truncate, slugify, getInitials,
  maskEmail, maskPhone, extractMentions, extractHashtags,
  camelToKebab, snakeToCamel, isEmpty, countWords, escapeHtml, unescapeHtml,
} from '../../utils/stringUtils.js';
import {
  formatDate, formatRelativeTime, isToday, isYesterday,
  addDays, startOfDay, endOfDay, getAge, isDateBetween,
} from '../../utils/dateUtils.js';

// ── Validators ────────────────────────────────────────────────
describe('Validators', () => {
  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user+tag@sub.domain.co')).toBe(true);
    });
    it('rejects invalid emails', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('missing@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('accepts strong passwords', () => {
      const { valid } = isValidPassword('Strong@Pass1');
      expect(valid).toBe(true);
    });
    it('rejects weak passwords', () => {
      expect(isValidPassword('short').valid).toBe(false);
      expect(isValidPassword('nouppercase@1').valid).toBe(false);
      expect(isValidPassword('NoSpecial1').valid).toBe(false);
      expect(isValidPassword('NoNumber@').valid).toBe(false);
    });
    it('returns errors array', () => {
      const { errors } = isValidPassword('weak');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('isValidObjectId', () => {
    it('accepts valid 24-char hex ids', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });
    it('rejects invalid ids', () => {
      expect(isValidObjectId('short')).toBe(false);
      expect(isValidObjectId('zzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false);
      expect(isValidObjectId('')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('accepts http/https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://sub.domain.co/path?q=1')).toBe(true);
    });
    it('rejects non-URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('ftp://old-protocol.com')).toBe(false);
    });
  });

  describe('isFutureDate / isPastDate', () => {
    it('correctly identifies future dates', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      expect(isFutureDate(future)).toBe(true);
      expect(isPastDate(future)).toBe(false);
    });
    it('correctly identifies past dates', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(isPastDate(past)).toBe(true);
      expect(isFutureDate(past)).toBe(false);
    });
  });

  describe('isValidDateRange', () => {
    it('accepts valid range', () => {
      expect(isValidDateRange('2024-01-01', '2024-12-31')).toBe(true);
    });
    it('accepts same start and end', () => {
      expect(isValidDateRange('2024-06-01', '2024-06-01')).toBe(true);
    });
    it('rejects inverted range', () => {
      expect(isValidDateRange('2024-12-31', '2024-01-01')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('accepts non-empty values', () => {
      expect(validateRequired('hello')).toBe(true);
      expect(validateRequired(['item'])).toBe(true);
      expect(validateRequired(0)).toBe(true);
    });
    it('rejects empty values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('  ')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('removes angle brackets', () => {
      expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    });
    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });
  });
});

// ── String Utils ──────────────────────────────────────────────
describe('StringUtils', () => {
  it('capitalize', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('WORLD')).toBe('World');
    expect(capitalize('')).toBe('');
  });

  it('capitalizeWords', () => {
    expect(capitalizeWords('hello world')).toBe('Hello World');
  });

  it('truncate', () => {
    expect(truncate('Hello World', 5)).toBe('Hello…');
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  it('slugify', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
  });

  it('getInitials', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('John Michael Doe', 2)).toBe('JM');
    expect(getInitials('')).toBe('');
  });

  it('maskEmail', () => {
    const masked = maskEmail('john@example.com');
    expect(masked).toContain('@example.com');
    expect(masked).not.toBe('john@example.com');
  });

  it('extractMentions', () => {
    expect(extractMentions('Hello @john and @jane!')).toEqual(['john', 'jane']);
    expect(extractMentions('No mentions here')).toEqual([]);
  });

  it('extractHashtags', () => {
    expect(extractHashtags('#react #nodejs are great')).toEqual(['react', 'nodejs']);
  });

  it('camelToKebab', () => {
    expect(camelToKebab('camelCaseString')).toBe('camel-case-string');
  });

  it('snakeToCamel', () => {
    expect(snakeToCamel('snake_case_string')).toBe('snakeCaseString');
  });

  it('isEmpty', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('  ')).toBe(true);
    expect(isEmpty('hello')).toBe(false);
  });

  it('countWords', () => {
    expect(countWords('hello world foo')).toBe(3);
    expect(countWords('')).toBe(0);
  });

  it('escapeHtml / unescapeHtml', () => {
    const original = '<div class="test">Hello & World</div>';
    const escaped = escapeHtml(original);
    expect(escaped).not.toContain('<');
    expect(unescapeHtml(escaped)).toBe(original);
  });
});

// ── Date Utils ────────────────────────────────────────────────
describe('DateUtils', () => {
  it('formatDate - medium format', () => {
    const result = formatDate('2024-06-15T10:00:00Z', 'medium');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });

  it('formatDate - returns null for invalid date', () => {
    expect(formatDate('not-a-date')).toBeNull();
  });

  it('formatRelativeTime - just now', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe('just now');
  });

  it('formatRelativeTime - minutes ago', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(past)).toContain('5 minute');
  });

  it('formatRelativeTime - future date', () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(future)).toContain('in');
  });

  it('isToday', () => {
    expect(isToday(new Date().toISOString())).toBe(true);
    expect(isToday(new Date(Date.now() - 86400000).toISOString())).toBe(false);
  });

  it('isYesterday', () => {
    expect(isYesterday(new Date(Date.now() - 86400000).toISOString())).toBe(true);
    expect(isYesterday(new Date().toISOString())).toBe(false);
  });

  it('addDays', () => {
    const base = new Date('2024-01-01');
    const result = addDays(base, 5);
    expect(result.getDate()).toBe(6);
  });

  it('startOfDay / endOfDay', () => {
    const d = new Date('2024-06-15T15:30:00Z');
    const start = startOfDay(d);
    const end = endOfDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it('getAge', () => {
    const thirtyYearsAgo = new Date();
    thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
    expect(getAge(thirtyYearsAgo.toISOString())).toBe(30);
  });

  it('isDateBetween', () => {
    expect(isDateBetween('2024-06-15', '2024-01-01', '2024-12-31')).toBe(true);
    expect(isDateBetween('2023-06-15', '2024-01-01', '2024-12-31')).toBe(false);
  });
});
