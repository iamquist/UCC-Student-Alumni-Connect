import React, { useState, useEffect } from "react";
import { adminApi } from "@/services/api";
import type { DashboardStats, User, ActivityLog } from "@/types";
import Avatar from "@/components/shared/Avatar";
import { getUserDisplayName, formatRelativeTime } from "@/utils";
import { cn } from "@/utils";
import toast from "react-hot-toast";

type AdminSection =
  | "dashboard"
  | "users"
  | "moderation"
  | "activity"
  | "settings";

function StatCard({
  label,
  value,
  icon,
  color,
  change,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            color,
          )}
        >
          {icon}
        </div>
        {change && (
          <span className="text-xs font-semibold text-green-500">
            +{change}
          </span>
        )}
      </div>
      <p
        className="text-2xl font-bold text-gray-900"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function DashboardView({ stats }: { stats: DashboardStats | null }) {
  if (!stats)
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    );

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      color: "bg-blue-50",
      icon: (
        <svg
          className="w-5 h-5 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: "Students",
      value: stats.totalStudents,
      color: "bg-purple-50",
      icon: (
        <svg
          className="w-5 h-5 text-purple-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
    {
      label: "Alumni",
      value: stats.totalAlumni,
      color: "bg-green-50",
      icon: (
        <svg
          className="w-5 h-5 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      color: "bg-yellow-50",
      icon: (
        <svg
          className="w-5 h-5 text-yellow-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="5" />
        </svg>
      ),
      change: "12%",
    },
    {
      label: "Total Posts",
      value: stats.totalPosts,
      color: "bg-blue-50",
      icon: (
        <svg
          className="w-5 h-5 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
    },
    {
      label: "Job Listings",
      value: stats.totalJobs,
      color: "bg-indigo-50",
      icon: (
        <svg
          className="w-5 h-5 text-indigo-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
    },
    {
      label: "Events",
      value: stats.totalEvents,
      color: "bg-orange-50",
      icon: (
        <svg
          className="w-5 h-5 text-orange-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: "Connections",
      value: stats.totalConnections,
      color: "bg-teal-50",
      icon: (
        <svg
          className="w-5 h-5 text-teal-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <h2
        className="text-base font-bold text-gray-900 mb-4"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        Dashboard Overview
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Recent signups */}
      <div className="mt-6 card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-bold text-gray-900"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Recent Signups
          </h3>
          <span className="badge bg-green-100 text-green-700 px-2 py-0.5 text-xs">
            {stats.recentSignups} this week
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-2 bg-gradient-to-r from-brand-blue to-blue-400 rounded-full"
            style={{
              width: `${Math.min((stats.recentSignups / stats.totalUsers) * 100 * 20, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: "", status: "" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.getAllUsers(filter);
        const usersArray = Array.isArray(res) ? res : res?.data || [];
        setUsers(usersArray);
      } catch (err) {
        console.error("Failed to load users:", err);
        toast.error("Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [filter]);

  const toggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminApi.updateUserStatus(userId, !isActive);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: !isActive } : u)),
      );
      toast.success("User status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-bold text-gray-900"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          User Management
        </h2>
        <div className="flex gap-2">
          <select
            value={filter.role}
            onChange={(e) => setFilter((p) => ({ ...p, role: e.target.value }))}
            className="input-field w-32 text-xs py-1.5"
          >
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="alumni">Alumni</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter((p) => ({ ...p, status: e.target.value }))
            }
            className="input-field w-32 text-xs py-1.5"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th
                className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5)
                .fill(null)
                .map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <div className="skeleton w-8 h-8 rounded-full" />
                        <div className="skeleton h-3 w-28 rounded my-auto" />
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-3 w-16 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} size="sm" />
                      <span className="text-sm font-medium text-gray-900">
                        {getUserDisplayName(user)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        user.role === "admin"
                          ? "bg-red-100 text-red-700"
                          : user.role === "alumni"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700",
                      )}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatRelativeTime(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(user._id, user.isActive)}
                      className={cn(
                        "text-xs font-semibold px-3 py-1 rounded-lg transition-colors",
                        user.isActive
                          ? "text-red-500 hover:bg-red-50"
                          : "text-green-600 hover:bg-green-50",
                      )}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-gray-400"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.getActivityLogs();
        const logsArray = Array.isArray(res) ? res : res?.data || [];
        setLogs(logsArray);
      } catch (err) {
        console.error("Failed to load activity logs:", err);
        toast.error("Failed to load activity logs");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h2
        className="text-base font-bold text-gray-900 mb-4"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        Activity Logs
      </h2>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log._id} className="flex items-center gap-4 px-4 py-3">
                <Avatar user={log.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">
                      {getUserDisplayName(log.user)}
                    </span>{" "}
                    <span className="text-gray-500">{log.description}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {log.activityType}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">
            No activity logs
          </div>
        )}
      </div>
    </div>
  );
}

const NAV: { key: AdminSection; label: string; icon: React.ReactNode }[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: "users",
    label: "Users",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    key: "moderation",
    label: "Moderation",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    key: "activity",
    label: "Activity Logs",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    adminApi
      .getDashboardStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <p
            className="text-xs font-bold text-gray-900 uppercase tracking-widest"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Admin Panel
          </p>
        </div>
        <nav className="flex-1 py-2">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={cn(
                "admin-nav-item w-full",
                section === item.key && "active",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 bg-brand-gray">
        {section === "dashboard" && <DashboardView stats={stats} />}
        {section === "users" && <UsersView />}
        {section === "activity" && <ActivityView />}
        {section === "moderation" && (
          <div className="card py-16 text-center">
            <p className="text-sm text-gray-400">
              Moderation queue — Coming soon
            </p>
          </div>
        )}
        {section === "settings" && (
          <div className="card p-6">
            <h2
              className="text-base font-bold text-gray-900 mb-4"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              System Settings
            </h2>
            <p className="text-sm text-gray-400">
              Settings management — fetches from /admin/settings
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
