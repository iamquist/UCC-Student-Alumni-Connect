import React from "react";
import { cn } from "@/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const badgeVariants = {
  default: "bg-gray-100 text-gray-600",
  primary: "bg-blue-100 text-brand-blue",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-700",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className,
}) => (
  <span
    className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
      badgeVariants[variant],
      className,
    )}
  >
    {children}
  </span>
);

interface TagProps {
  label: string;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  label,
  onRemove,
  onClick,
  active,
}) => (
  <span
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
      active
        ? "bg-blue-100 text-brand-blue border border-blue-200"
        : "bg-gray-100 text-gray-600 border border-gray-200",
      onClick && "cursor-pointer hover:bg-gray-200",
    )}
  >
    #{label}
    {onRemove && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 hover:text-red-500 transition-colors"
      >
        <svg
          className="w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    )}
  </span>
);

export default Badge;
