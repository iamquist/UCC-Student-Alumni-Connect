import React from "react";

export const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 4L28 9V19L20 24L12 19V9L20 4Z" fill="#E53935" opacity="0.9" />
    <path d="M20 4L28 9V14L20 19L12 14V9L20 4Z" fill="#FF7043" opacity="0.85" />
    <path d="M12 9L4 14V24L12 29L20 24V14L12 9Z" fill="#43A047" opacity="0.9" />
    <path
      d="M28 9L36 14V24L28 29L20 24V14L28 9Z"
      fill="#1E88E5"
      opacity="0.9"
    />
    <path
      d="M20 24L28 29V34L20 36L12 34V29L20 24Z"
      fill="#FDD835"
      opacity="0.9"
    />
  </svg>
);

export const LogoFull: React.FC = () => (
  <div style={{ flex: "0 0 240px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <Logo size={32} />
      <span
        style={{
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        <span className="text-accent">Student-Alumni</span>
        <span className="text-primary-dark">Connect</span>
      </span>
    </div>
    <p style={{ fontSize: 12, color: "#6C6C70", lineHeight: 1.6 }}>
      The professional network built exclusively for university alumni and
      students and the careers they build.
    </p>
  </div>
);
