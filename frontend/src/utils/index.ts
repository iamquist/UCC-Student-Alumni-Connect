import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return date.toLocaleDateString();
}

export function formatDate(dateStr: string, format = "medium"): string {
  const date = new Date(dateStr);
  if (format === "short")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (format === "long")
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  if (format === "time")
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getInitials(name: string, max = 2): string {
  return name
    .split(" ")
    .slice(0, max)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export function getUserDisplayName(
  user: { firstName: string; lastName: string } | null,
): string {
  if (!user) return "Unknown User";
  return `${user.firstName} ${user.lastName}`;
}

export function getAvatarUrl(
  user: { profilePicture?: string; firstName: string; lastName: string } | null,
): string | null {
  return user?.profilePicture || null;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + "…";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function pluralize(
  count: number,
  word: string,
  plural?: string,
): string {
  return count === 1 ? `${count} ${word}` : `${count} ${plural || word + "s"}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export const AVATAR_COLORS = [
  "bg-rose-400",
  "bg-pink-400",
  "bg-purple-400",
  "bg-indigo-400",
  "bg-blue-400",
  "bg-cyan-400",
  "bg-teal-400",
  "bg-green-400",
  "bg-yellow-400",
  "bg-orange-400",
];

export function getAvatarColor(id: string): string {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
