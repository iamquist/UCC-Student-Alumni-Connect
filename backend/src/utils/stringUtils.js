export const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
export const capitalizeWords = (str) => str ? str.split(' ').map(capitalize).join(' ') : '';
export const toTitleCase = capitalizeWords;

export const truncate = (str, length, suffix = '…') =>
  str && str.length > length ? str.slice(0, length).trimEnd() + suffix : str;

export const truncateWords = (str, wordCount, suffix = '…') => {
  if (!str) return '';
  const words = str.split(' ');
  return words.length > wordCount ? words.slice(0, wordCount).join(' ') + suffix : str;
};

export const stripHtml = (str) => str ? str.replace(/<[^>]*>/g, '') : '';

export const normalizeWhitespace = (str) => str ? str.replace(/\s+/g, ' ').trim() : '';

export const slugify = (str) => str
  ? str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
  : '';

export const getInitials = (name, maxInitials = 2) => name
  ? name.split(' ').slice(0, maxInitials).map(w => w[0]?.toUpperCase() || '').join('')
  : '';

export const maskEmail = (email) => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  return `${user[0]}${'*'.repeat(Math.max(user.length - 2, 1))}${user.slice(-1)}@${domain}`;
};

export const maskPhone = (phone) => phone
  ? phone.replace(/(\d{3})\d+(\d{2})/, '$1****$2')
  : '';

export const extractUrls = (str) => {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&//=]*/g;
  return str ? (str.match(urlRegex) || []) : [];
};

export const extractMentions = (str) => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = [];
  let match;
  while ((match = mentionRegex.exec(str)) !== null) matches.push(match[1]);
  return matches;
};

export const extractHashtags = (str) => {
  const hashRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = [];
  let match;
  while ((match = hashRegex.exec(str)) !== null) matches.push(match[1]);
  return matches;
};

export const replacePlaceholders = (str, placeholders) =>
  str ? Object.entries(placeholders).reduce((s, [k, v]) => s.replace(new RegExp(`{{${k}}}`, 'g'), v), str) : '';

export const camelToKebab = (str) => str ? str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : '';
export const kebabToCamel = (str) => str ? str.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) : '';
export const snakeToCamel = (str) => str ? str.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) : '';
export const camelToSnake = (str) => str ? str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() : '';

export const pad = (str, length, padChar = ' ', padLeft = false) => {
  const s = String(str);
  const padding = padChar.repeat(Math.max(0, length - s.length));
  return padLeft ? padding + s : s + padding;
};

export const removeDiacritics = (str) =>
  str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';

export const randomString = (length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') =>
  Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');

export const isEmpty = (str) => !str || str.trim().length === 0;
export const countWords = (str) => str ? str.trim().split(/\s+/).filter(Boolean).length : 0;
export const countCharacters = (str) => str ? str.length : 0;
export const escapeHtml = (str) => str ? str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;') : '';
export const unescapeHtml = (str) => str ? str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'") : '';

export default {
  capitalize, capitalizeWords, toTitleCase, truncate, truncateWords, stripHtml,
  normalizeWhitespace, slugify, getInitials, maskEmail, maskPhone, extractUrls,
  extractMentions, extractHashtags, replacePlaceholders, camelToKebab, kebabToCamel,
  snakeToCamel, camelToSnake, pad, removeDiacritics, randomString, isEmpty,
  countWords, countCharacters, escapeHtml, unescapeHtml,
};
