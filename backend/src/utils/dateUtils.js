export const formatDate = (date, format = 'medium') => {
  try {
    const d = new Date(date);
    if (isNaN(d)) return null;
    const opts = {
      short: { month: 'short', day: 'numeric' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    };
    return d.toLocaleDateString('en-US', opts[format] || opts.medium);
  } catch { return null; }
};

export const formatDateISO = (date) => {
  try { return new Date(date).toISOString(); } catch { return null; }
};

export const formatRelativeTime = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d)) return null;
    const diff = Date.now() - d.getTime();
    const abs = Math.abs(diff);
    const future = diff < 0;
    const seconds = Math.floor(abs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    let result;
    if (seconds < 60) result = 'just now';
    else if (minutes < 60) result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    else if (hours < 24) result = `${hours} hour${hours !== 1 ? 's' : ''}`;
    else if (days < 7) result = `${days} day${days !== 1 ? 's' : ''}`;
    else if (weeks < 4) result = `${weeks} week${weeks !== 1 ? 's' : ''}`;
    else if (months < 12) result = `${months} month${months !== 1 ? 's' : ''}`;
    else result = `${years} year${years !== 1 ? 's' : ''}`;
    if (result === 'just now') return result;
    return future ? `in ${result}` : `${result} ago`;
  } catch { return null; }
};

export const getTimeDifference = (date1, date2) => Math.abs(new Date(date1) - new Date(date2));

export const getTimeDifferenceHuman = (date1, date2) => {
  const ms = getTimeDifference(date1, date2);
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

export const isToday = (date) => {
  const d = new Date(date);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
};

export const isYesterday = (date) => {
  const d = new Date(date);
  const y = new Date(); y.setDate(y.getDate() - 1);
  return d.getDate() === y.getDate() && d.getMonth() === y.getMonth() && d.getFullYear() === y.getFullYear();
};

export const isThisWeek = (date) => {
  const d = new Date(date); const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
};

export const isThisMonth = (date) => {
  const d = new Date(date); const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export const isThisYear = (date) => new Date(date).getFullYear() === new Date().getFullYear();

export const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
export const addHours = (date, hours) => new Date(new Date(date).getTime() + hours * 3600000);
export const addMinutes = (date, minutes) => new Date(new Date(date).getTime() + minutes * 60000);

export const startOfDay = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
export const endOfDay = (date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };
export const startOfWeek = (date) => { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; };
export const endOfWeek = (date) => { const d = new Date(date); d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(23,59,59,999); return d; };
export const startOfMonth = (date) => new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1);
export const endOfMonth = (date) => new Date(new Date(date).getFullYear(), new Date(date).getMonth() + 1, 0, 23, 59, 59, 999);
export const startOfYear = (date) => new Date(new Date(date).getFullYear(), 0, 1);
export const endOfYear = (date) => new Date(new Date(date).getFullYear(), 11, 31, 23, 59, 59, 999);

export const formatDateRange = (startDate, endDate, format = 'medium') => {
  const s = formatDate(startDate, format);
  const e = formatDate(endDate, format);
  return s === e ? s : `${s} – ${e}`;
};

export const getAge = (birthDate) => {
  const today = new Date(); const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const isDateBetween = (date, startDate, endDate) => {
  const d = new Date(date);
  return d >= new Date(startDate) && d <= new Date(endDate);
};

export default {
  formatDate, formatDateISO, formatRelativeTime, getTimeDifference, getTimeDifferenceHuman,
  isToday, isYesterday, isThisWeek, isThisMonth, isThisYear, addDays, addHours, addMinutes,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  formatDateRange, getAge, isDateBetween,
};
