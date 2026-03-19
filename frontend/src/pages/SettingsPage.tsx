import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi, usersApi } from "@/services/api";
import Avatar from "@/components/shared/Avatar";
import { getUserDisplayName } from "@/utils";
import toast from "react-hot-toast";
import { cn } from "@/utils";

type SettingsSection =
  | "profile"
  | "account"
  | "notifications"
  | "privacy"
  | "security";

const NAV: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
  {
    key: "profile",
    label: "Edit Profile",
    icon: (
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
    ),
  },
  {
    key: "account",
    label: "Account",
    icon: (
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
    ),
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      </svg>
    ),
  },
  {
    key: "privacy",
    label: "Privacy",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    key: "security",
    label: "Security",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
];

function ProfileSettings() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    location: user?.location || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile(form);
      updateUser(updated);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-base font-bold text-gray-900 mb-1"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          Edit Profile
        </h2>
        <p className="text-xs text-gray-400">
          Update your personal information
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar user={user || undefined} size="xl" />
        <div>
          <button className="btn-secondary text-xs mb-1">Change Photo</button>
          <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            First Name
          </label>
          <input
            value={form.firstName}
            onChange={(e) =>
              setForm((p) => ({ ...p, firstName: e.target.value }))
            }
            className="input-field"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Last Name
          </label>
          <input
            value={form.lastName}
            onChange={(e) =>
              setForm((p) => ({ ...p, lastName: e.target.value }))
            }
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
          Bio
        </label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
          rows={3}
          maxLength={500}
          className="input-field resize-none"
          placeholder="Tell people about yourself..."
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {form.bio.length}/500
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
          Location
        </label>
        <input
          value={form.location}
          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          className="input-field"
          placeholder="City, Country"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
          Phone
        </label>
        <input
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          className="input-field"
          placeholder="+233 XX XXX XXXX"
        />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function SecuritySettings() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      toast.success("Password changed successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to change password");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-base font-bold text-gray-900 mb-1"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          Security
        </h2>
        <p className="text-xs text-gray-400">
          Manage your password and account security
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Current Password
          </label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) =>
              setForm((p) => ({ ...p, currentPassword: e.target.value }))
            }
            className="input-field"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            New Password
          </label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) =>
              setForm((p) => ({ ...p, newPassword: e.target.value }))
            }
            className="input-field"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((p) => ({ ...p, confirmPassword: e.target.value }))
            }
            className="input-field"
          />
        </div>
        <button
          onClick={handleChange}
          disabled={saving}
          className="btn-primary text-sm"
        >
          {saving ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    emailConnections: true,
    emailMessages: true,
    emailMentorship: true,
    emailJobs: false,
    emailEvents: true,
    pushAll: true,
  });

  const Toggle: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
    desc?: string;
  }> = ({ checked, onChange, label, desc }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400">{desc}</p>}
      </div>
      <button
        onClick={onChange}
        className={cn(
          "relative w-10 h-6 rounded-full transition-colors duration-200",
          checked ? "bg-brand-blue" : "bg-gray-200",
        )}
      >
        <div
          className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-base font-bold text-gray-900 mb-1"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          Notifications
        </h2>
        <p className="text-xs text-gray-400">
          Choose what you want to be notified about
        </p>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Email Notifications
        </h3>
        <Toggle
          checked={prefs.emailConnections}
          onChange={() =>
            setPrefs((p) => ({ ...p, emailConnections: !p.emailConnections }))
          }
          label="Connection requests"
          desc="When someone wants to connect with you"
        />
        <Toggle
          checked={prefs.emailMessages}
          onChange={() =>
            setPrefs((p) => ({ ...p, emailMessages: !p.emailMessages }))
          }
          label="New messages"
        />
        <Toggle
          checked={prefs.emailMentorship}
          onChange={() =>
            setPrefs((p) => ({ ...p, emailMentorship: !p.emailMentorship }))
          }
          label="Mentorship requests"
        />
        <Toggle
          checked={prefs.emailJobs}
          onChange={() => setPrefs((p) => ({ ...p, emailJobs: !p.emailJobs }))}
          label="Job recommendations"
        />
        <Toggle
          checked={prefs.emailEvents}
          onChange={() =>
            setPrefs((p) => ({ ...p, emailEvents: !p.emailEvents }))
          }
          label="Event reminders"
        />
      </div>
      <button
        onClick={() => toast.success("Preferences saved!")}
        className="btn-primary text-sm"
      >
        Save Preferences
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>("profile");
  const { user } = useAuthStore();

  return (
    <div className="page-container py-6 flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0">
        <div className="card py-2">
          {/* Profile summary */}
          <div className="px-4 py-3 border-b border-gray-100 mb-1">
            <div className="flex items-center gap-2.5">
              <Avatar user={user || undefined} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-[10px] text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left",
                section === item.key
                  ? "text-brand-blue bg-blue-50 border-l-2 border-brand-blue"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="card p-6">
          {section === "profile" && <ProfileSettings />}
          {section === "security" && <SecuritySettings />}
          {section === "notifications" && <NotificationSettings />}
          {section === "account" && (
            <div>
              <h2
                className="text-base font-bold text-gray-900 mb-4"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Account
              </h2>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Email Address
                  </p>
                  <p className="text-sm text-gray-900">{user?.email}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {user?.isEmailVerified ? "✓ Verified" : "⚠ Not verified"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Account Role
                  </p>
                  <p className="text-sm text-gray-900 capitalize">
                    {user?.role}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <button className="text-sm text-red-500 font-medium hover:text-red-600">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
          {section === "privacy" && (
            <div>
              <h2
                className="text-base font-bold text-gray-900 mb-4"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Privacy
              </h2>
              <p className="text-sm text-gray-400">
                Privacy settings — Coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
