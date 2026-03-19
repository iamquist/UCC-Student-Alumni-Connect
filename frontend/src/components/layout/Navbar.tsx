import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn, getUserDisplayName, formatRelativeTime } from "@/utils";
import { useAuthStore } from "@/store/authStore";
import { useChatStore, useNotificationStore } from "@/store/chatStore";
import Avatar from "@/components/shared/Avatar";
import SearchDropdown from "@/components/search/SearchDropdown";
import { Bell, Briefcase, MessageCircle, Rss, Users } from "lucide-react";

const NAV_ITEMS = [
  { path: "/feed", label: "FEED", icon: Rss },
  { path: "/network", label: "NETWORK", icon: Users },
  { path: "/jobs", label: "JOBS", icon: Briefcase },
  { path: "/chat", label: "CHAT", icon: MessageCircle },
  { path: "/events", label: "EVENTS", icon: Bell },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadTotal } = useChatStore();
  const { unreadCount } = useNotificationStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link to="/feed" className="flex-shrink-0 mr-2">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8">
              <svg viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 2L4 8v6c0 8 5.5 14.5 12 16 6.5-1.5 12-8 12-16V8L16 2z"
                  fill="none"
                  stroke="#e8457a"
                  strokeWidth="2"
                />
                <path
                  d="M10 12l4 4 8-8"
                  stroke="#e8457a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="16" r="3" fill="#ff6b9d" opacity="0.6" />
                <circle cx="24" cy="16" r="3" fill="#e8457a" opacity="0.6" />
                <circle cx="16" cy="24" r="3" fill="#c0325e" opacity="0.6" />
              </svg>
            </div>
            <span className="font-display text-sm font-bold">
              <span className="text-gray-900">Uni</span>
              <span className="text-brand-blue">Alum</span>
            </span>
          </div>
        </Link>

        {/* Nav items */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            const badge = path === "/chat" ? unreadTotal : 0;
            return (
              <Link
                key={path}
                to={path}
                className={cn("nav-link", active && "active nav-indicator")}
              >
                <div className="relative">
                  <Icon
                    className={cn(active ? "text-brand-blue" : "text-gray-400")}
                  />
                  {badge > 0 && (
                    <span className="badge-primary absolute -top-1.5 -right-1.5 min-w-[16px] h-4 text-[10px]">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px]",
                    active ? "text-brand-blue" : "text-gray-400",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-xs relative ml-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span>Search</span>
          </button>
          {searchOpen && (
            <SearchDropdown onClose={() => setSearchOpen(false)} />
          )}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* Notifications bell */}
          <Link
            to="/notifications"
            className="relative p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="badge-primary absolute top-0 right-0 min-w-[16px] h-4 text-[10px]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
            >
              <Avatar user={user} size="sm" />
              <div className="hidden sm:block text-left">
                <p
                  className="text-xs font-semibold text-gray-900 leading-tight"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  {getUserDisplayName(user)}{" "}
                  <span className="text-gray-400 font-normal">YOU</span>
                </p>
                <p className="text-[10px] text-gray-400">
                  {user?.viewsToday || 0} views today
                </p>
              </div>
              <svg
                className="w-3 h-3 text-gray-400 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-float border border-gray-100 py-2 z-50 animate-fade-in">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <Avatar user={user} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {user?.role}
                    </p>
                  </div>
                </Link>
                <hr className="border-gray-100 my-1" />
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  onClick={() => setProfileOpen(false)}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  onClick={() => setProfileOpen(false)}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                  Settings
                </Link>
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-blue hover:bg-blue-50"
                    onClick={() => setProfileOpen(false)}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Admin Panel
                  </Link>
                )}
                <hr className="border-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
