import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi, usersApi } from "@/services/api";
import type { Notification, User } from "@/types";
import { useAuthStore } from "@/store/authStore";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import { formatRelativeTime, getUserDisplayName, cn } from "@/utils";
import toast from "react-hot-toast";

// ── Profile Viewers Modal ─────────────────────────────────────
const MOCK_VIEWERS: Array<User & { viewedAt: string; mutual: number }> = [
  {
    _id: "v1",
    firstName: "Abena",
    lastName: "Mensah",
    email: "",
    role: "alumni",
    bio: "Product Manager at Jumia",
    location: "Accra, Ghana",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    viewedAt: "2024-01-15T10:00:00Z",
    mutual: 5,
  },
  {
    _id: "v2",
    firstName: "Kofi",
    lastName: "Amponsah",
    email: "",
    role: "student",
    bio: "CS Student, Ashesi University",
    location: "Accra, Ghana",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    viewedAt: "2024-01-15T08:30:00Z",
    mutual: 3,
  },
  {
    _id: "v3",
    firstName: "Ama",
    lastName: "Owusu",
    email: "",
    role: "alumni",
    bio: "UX Lead at mPharma",
    location: "Kumasi, Ghana",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    viewedAt: "2024-01-14T16:00:00Z",
    mutual: 8,
  },
  {
    _id: "v4",
    firstName: "Emmanuel",
    lastName: "Boateng",
    email: "",
    role: "student",
    bio: "Aspiring Product Designer",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    viewedAt: "2024-01-14T12:00:00Z",
    mutual: 2,
  },
  {
    _id: "v5",
    firstName: "Efua",
    lastName: "Asante",
    email: "",
    role: "alumni",
    bio: "Software Engineer at Andela",
    location: "Remote",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    viewedAt: "2024-01-13T09:00:00Z",
    mutual: 12,
  },
  {
    _id: "v6",
    firstName: "Kwame",
    lastName: "Asante",
    email: "",
    role: "alumni",
    bio: "Senior Engineer at Google",
    location: "London, UK",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    viewedAt: "2024-01-12T14:00:00Z",
    mutual: 4,
  },
];

function ProfileViewersModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  return (
    <Modal open={open} onClose={onClose} title="Profile Viewers" size="md">
      <div className="space-y-[0.1rem]">
        <p className="text-xs text-gray-400 mb-[0.1rem]">
          People who viewed your profile in the last 90 days
        </p>
        {MOCK_VIEWERS.map((v) => (
          <div
            key={v._id}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Avatar user={v} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {getUserDisplayName(v)}
              </p>
              <p className="text-xs text-gray-400 truncate">{v.bio}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">
                {formatRelativeTime(v.viewedAt)} · {v.mutual} mutual connections
              </p>
            </div>
            <button
              onClick={() => {
                navigate(`/profile/${v._id}`);
                onClose();
              }}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              View
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ── Post Likes Modal ──────────────────────────────────────────
const MOCK_LIKERS: Array<User & { postTitle: string }> = [
  {
    _id: "l1",
    firstName: "Yaw",
    lastName: "Darko",
    email: "",
    role: "alumni",
    bio: "CTO at Hubtel",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    postTitle: "The Future of Product Design in Africa",
  },
  {
    _id: "l2",
    firstName: "Adwoa",
    lastName: "Frimpong",
    email: "",
    role: "student",
    bio: "Design student, KNUST",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    postTitle: "The Future of Product Design in Africa",
  },
  {
    _id: "l3",
    firstName: "Nana",
    lastName: "Ama",
    email: "",
    role: "alumni",
    bio: "Product Lead at Flutterwave",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
    postTitle: "Building Scalable Systems",
  },
];

function PostLikesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const grouped: Record<string, typeof MOCK_LIKERS> = {};
  MOCK_LIKERS.forEach((l) => {
    if (!grouped[l.postTitle]) grouped[l.postTitle] = [];
    grouped[l.postTitle].push(l);
  });
  return (
    <Modal open={open} onClose={onClose} title="Post Likes" size="md">
      <div className="space-y-4">
        {Object.entries(grouped).map(([title, likers]) => (
          <div key={title} className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 mb-3 truncate">
              "{title}"
            </p>
            <div className="space-y-2">
              {likers.map((liker) => (
                <div key={liker._id} className="flex items-center gap-3">
                  <Avatar user={liker} size="sm" />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => {
                        navigate(`/profile/${liker._id}`);
                        onClose();
                      }}
                      className="text-sm font-semibold text-gray-900 hover:text-brand-blue transition-colors"
                    >
                      {getUserDisplayName(liker)}
                    </button>
                    <p className="text-xs text-gray-400 truncate">
                      {liker.bio}
                    </p>
                  </div>
                  <span className="text-brand-blue text-sm">❤️</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ── Notification Settings Modal ────────────────────────────────
function NotificationSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState({
    connections: { push: true, email: true },
    messages: { push: true, email: false },
    mentorship: { push: true, email: true },
    jobs: { push: false, email: true },
    events: { push: true, email: false },
    posts: { push: true, email: false },
    system: { push: false, email: true },
  });
  const [saving, setSaving] = useState(false);
  const toggle = (key: string, type: "push" | "email") => {
    setSettings((p) => ({
      ...p,
      [key]: {
        ...p[key as keyof typeof p],
        [type]: !p[key as keyof typeof p][type],
      },
    }));
  };
  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Notification preferences saved!");
    setSaving(false);
    onClose();
  };

  const items = [
    { key: "connections", label: "Connection Requests", icon: "🔗" },
    { key: "messages", label: "New Messages", icon: "💬" },
    { key: "mentorship", label: "Mentorship Requests", icon: "🎓" },
    { key: "jobs", label: "Job Recommendations", icon: "💼" },
    { key: "events", label: "Event Reminders", icon: "📅" },
    { key: "posts", label: "Post Interactions", icon: "📝" },
    { key: "system", label: "System Updates", icon: "🔔" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notification Settings"
      size="md"
    >
      <div className="space-y-[0.1rem]">
        <div
          className="grid grid-cols-3 text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pb-[0.1rem]"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          <span>Type</span>
          <span className="text-center">Push</span>
          <span className="text-center">Email</span>
        </div>
        {items.map((item) => {
          const s = settings[item.key as keyof typeof settings];
          return (
            <div
              key={item.key}
              className="grid grid-cols-3 items-center p-1 rounded-xl hover:bg-gray-50"
            >
              <div className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
              {(["push", "email"] as const).map((type) => (
                <div key={type} className="flex justify-center">
                  <button
                    onClick={() => toggle(item.key, type)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative",
                      s[type] ? "bg-brand-blue" : "bg-gray-200",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform",
                        s[type] ? "right-0.5" : "left-0.5",
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full mt-2"
        >
          {saving ? "Saving…" : "Save Preferences"}
        </button>
      </div>
    </Modal>
  );
}

// ── Stats Modal ──────────────────────────────────────────────
function NotifStatsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const stats = [
    { label: "Profile Views (7d)", value: 128, delta: "+14%", positive: true },
    { label: "Connection Requests", value: 9, delta: "+3 new", positive: true },
    { label: "Post Impressions", value: 2340, delta: "+8%", positive: true },
    { label: "Search Appearances", value: 56, delta: "-2%", positive: false },
    { label: "Mentorship Requests", value: 4, delta: "+2 new", positive: true },
    { label: "Messages Received", value: 23, delta: "+5 new", positive: true },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Your Dashboard Stats" size="md">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4">
            <p
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              {s.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            <p
              className={cn(
                "text-xs font-semibold mt-1",
                s.positive ? "text-green-500" : "text-red-400",
              )}
            >
              {s.delta}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ── Notification Item ──────────────────────────────────────────
function NotificationItem({
  notification,
  onRead,
  onDelete,
  onViewProfile,
  onViewPostLikes,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onViewProfile?: (id: string) => void;
  onViewPostLikes?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const iconMap: Record<string, { icon: string; color: string }> = {
    connection_request: { icon: "🔗", color: "bg-blue-100" },
    connection_accepted: { icon: "✅", color: "bg-green-100" },
    message: { icon: "💬", color: "bg-purple-100" },
    mentorship_request: { icon: "🎓", color: "bg-orange-100" },
    post_like: { icon: "❤️", color: "bg-red-100" },
    post_comment: { icon: "💭", color: "bg-yellow-100" },
    profile_view: { icon: "👁️", color: "bg-blue-100" },
    job_match: { icon: "💼", color: "bg-teal-100" },
    event_reminder: { icon: "📅", color: "bg-indigo-100" },
    system: { icon: "🔔", color: "bg-gray-100" },
  };

  const { icon, color } = iconMap[notification.type] || {
    icon: "🔔",
    color: "bg-gray-100",
  };

  const handleClick = () => {
    onRead(notification._id);
    if (notification.type === "profile_view" && onViewProfile)
      onViewProfile(notification.sender?._id || "");
    if (notification.type === "post_like" && onViewPostLikes) onViewPostLikes();
    if (notification.type === "message") navigate("/chat");
    if (
      ["connection_request", "connection_accepted"].includes(notification.type)
    )
      navigate("/network");
    if (notification.type === "mentorship_request") navigate("/profile");
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3.5 p-4 rounded-xl transition-colors cursor-pointer group",
        !notification.read ? "bg-blue-50/70" : "hover:bg-gray-50",
      )}
      onClick={handleClick}
    >
      <div
        className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0 text-base`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-relaxed",
            !notification.read && "font-semibold text-gray-900",
          )}
        >
          {notification.message || notification.title}
        </p>
        {notification.sender && (
          <p className="text-xs text-gray-400 mt-0.5">
            from{" "}
            <span className="font-medium text-gray-600">
              {getUserDisplayName(notification.sender)}
            </span>
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 bg-brand-blue rounded-full flex-shrink-0 mt-1.5" />
      )}

      {/* 3-dot menu */}
      <div
        ref={menuRef}
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-float border border-gray-100 z-30 py-1.5 animate-fade-in">
            {!notification.read && (
              <button
                onClick={() => {
                  onRead(notification._id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Mark as read
              </button>
            )}
            {notification.sender && (
              <button
                onClick={() => {
                  navigate(`/profile/${notification.sender._id}`);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                View Sender Profile
              </button>
            )}
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              </svg>
              Mute this type
            </button>
            <button
              onClick={() => {
                onDelete(notification._id);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-50"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
              Delete notification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mock notifications ─────────────────────────────────────────
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    _id: "n1",
    recipient: "me",
    sender: {
      _id: "u1",
      firstName: "Kwame",
      lastName: "Asante",
      email: "",
      role: "alumni",
      bio: "Senior Engineer at Google",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: "",
      updatedAt: "",
    },
    type: "connection_request",
    title: "New Connection Request",
    message: "Kwame Asante sent you a connection request",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    updatedAt: "",
  },
  {
    _id: "n2",
    recipient: "me",
    sender: {
      _id: "u2",
      firstName: "Abena",
      lastName: "Mensah",
      email: "",
      role: "alumni",
      bio: "PM at Meta",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: "",
      updatedAt: "",
    },
    type: "post_like",
    title: "Post Liked",
    message: 'Abena Mensah liked your post "The Future of Design in Africa"',
    read: false,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: "",
  },
  {
    _id: "n3",
    recipient: "me",
    sender: {
      _id: "u3",
      firstName: "Emmanuel",
      lastName: "Boateng",
      email: "",
      role: "student",
      bio: "CS Student, Ashesi",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: "",
      updatedAt: "",
    },
    type: "mentorship_request",
    title: "Mentorship Request",
    message:
      'Emmanuel Boateng requested mentorship on "Career transition into product"',
    read: false,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    updatedAt: "",
  },
  {
    _id: "n4",
    recipient: "me",
    sender: {
      _id: "u4",
      firstName: "Ama",
      lastName: "Owusu",
      email: "",
      role: "alumni",
      bio: "UX Lead at mPharma",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: "",
      updatedAt: "",
    },
    type: "profile_view",
    title: "Profile View",
    message: "Ama Owusu viewed your profile",
    read: true,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    updatedAt: "",
  },
  {
    _id: "n5",
    recipient: "me",
    sender: undefined,
    type: "job_match",
    title: "New Job Match",
    message:
      'A new job "Senior Product Designer at Paystack" matches your profile',
    read: true,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: "",
  },
];

const MOCK_EARLIER: Notification[] = [
  {
    _id: "e1",
    recipient: "me",
    sender: {
      _id: "u5",
      firstName: "Yaw",
      lastName: "Darko",
      email: "",
      role: "alumni",
      bio: "CTO at Hubtel",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: "",
      updatedAt: "",
    },
    type: "connection_accepted",
    title: "Connection Accepted",
    message: "Yaw Darko accepted your connection request",
    read: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: "",
  },
  {
    _id: "e2",
    recipient: "me",
    sender: undefined,
    type: "event_reminder",
    title: "Event Tomorrow",
    message: 'Reminder: "Tech for Africa 2024" is tomorrow at 2:00 PM',
    read: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: "",
  },
  {
    _id: "e3",
    recipient: "me",
    sender: {
      _id: "u6",
      firstName: "Nana",
      lastName: "Frimpong",
      email: "",
      role: "student",
      bio: "MBA Student",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: "",
      updatedAt: "",
    },
    type: "post_comment",
    title: "New Comment",
    message:
      'Nana Frimpong commented on your post: "Great insights, thank you!"',
    read: true,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: "",
  },
  {
    _id: "e4",
    recipient: "me",
    sender: undefined,
    type: "system",
    title: "System Update",
    message:
      "UniAlum has been updated with new features. Check out mentorship scheduling!",
    read: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: "",
  },
  {
    _id: "e5",
    recipient: "me",
    sender: {
      _id: "u7",
      firstName: "Efua",
      lastName: "Asante",
      email: "",
      role: "alumni",
      bio: "Engineer at Andela",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: "",
      updatedAt: "",
    },
    type: "message",
    title: "New Message",
    message: "Efua Asante sent you a message",
    read: true,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: "",
  },
];

// ── Notifications Page ─────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [earlier, setEarlier] = useState<Notification[]>(MOCK_EARLIER);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "unread" | "connections" | "mentions" | "jobs"
  >("all");
  const [profileViewersOpen, setProfileViewersOpen] = useState(false);
  const [postLikesOpen, setPostLikesOpen] = useState(false);
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  // Load real notifications on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await notificationsApi.getNotifications({ limit: 20 });
        const notifArray = Array.isArray(result) ? result : result?.data || [];
        if (notifArray.length > 0) {
          const recent = notifArray.filter(
            (n) => new Date(n.createdAt) > new Date(Date.now() - 86400000),
          );
          const old = notifArray.filter(
            (n) => new Date(n.createdAt) <= new Date(Date.now() - 86400000),
          );
          if (recent.length > 0) setNotifications(recent);
          if (old.length > 0) setEarlier(old);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
        // use mock data on failure
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((p) =>
        p.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setEarlier((p) =>
        p.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((p) => p.filter((n) => n._id !== id));
      setEarlier((p) => p.filter((n) => n._id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Could not delete");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
      setEarlier((p) => p.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Could not update");
    }
  };

  const FILTER_TYPES: Record<string, string[]> = {
    all: [],
    unread: [],
    connections: ["connection_request", "connection_accepted"],
    mentions: ["post_comment", "post_like"],
    jobs: ["job_match"],
  };

  const applyFilter = (list: Notification[]) => {
    if (filter === "unread") return list.filter((n) => !n.read);
    const types = FILTER_TYPES[filter];
    if (types.length > 0) return list.filter((n) => types.includes(n.type));
    return list;
  };

  const filteredRecent = applyFilter(notifications);
  const filteredEarlier = applyFilter(earlier);
  const unreadCount = [...notifications, ...earlier].filter(
    (n) => !n.read,
  ).length;

  return (
    <div className="page-container py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main */}
      <div className="lg:col-span-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1
              className="text-base font-bold text-gray-900 uppercase tracking-widest"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              NOTIFICATIONS
            </h1>
            {unreadCount > 0 && (
              <span className="badge-primary">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setNotifSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notification Settings"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {(["all", "unread", "connections", "mentions", "jobs"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap capitalize transition-colors flex-shrink-0",
                  filter === f
                    ? "bg-brand-blue text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                )}
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {f === "unread" ? `Unread (${unreadCount})` : f}
              </button>
            ),
          )}
        </div>

        {/* Recent */}
        <div className="card overflow-hidden mb-4">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <p
              className="text-xs font-bold text-gray-500 uppercase tracking-widest"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              RECENT · TODAY
            </p>
          </div>
          <div className="p-3 space-y-1">
            {filteredRecent.length > 0 ? (
              filteredRecent.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  onViewProfile={(id) => {
                    navigate(`/profile/${id}`);
                  }}
                  onViewPostLikes={() => setPostLikesOpen(true)}
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No recent notifications</p>
              </div>
            )}
          </div>
        </div>

        {/* Earlier */}
        {filteredEarlier.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50">
              <p
                className="text-xs font-bold text-gray-500 uppercase tracking-widest"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                EARLIER
              </p>
            </div>
            <div className="p-3 space-y-1">
              {filteredEarlier.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  onViewProfile={(id) => navigate(`/profile/${id}`)}
                  onViewPostLikes={() => setPostLikesOpen(true)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        {/* Stats */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Your Stats</p>
            <button
              onClick={() => setStatsOpen(true)}
              className="text-xs font-semibold text-brand-blue hover:underline"
            >
              GO TO STATS
            </button>
          </div>
          <div className="space-y-2">
            {[
              {
                label: "Profile views",
                value: `${0} views`,
                trend: `${`↓ ${0}%`}`,
              },
              {
                label: "Post impressions",
                value: `${0} this week`,
                trend: `${`↓ ${0}%`}`,
              },
              {
                label: "Search appearances",
                value: `${0} this week`,
                trend: `${`↓ ${0}%`}`,
              },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <span className="text-xs text-gray-500">{s.label}</span>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-800">
                    {s.value}
                  </p>
                  <p
                    className={cn(
                      "text-[10px]",
                      s.trend.startsWith("↑")
                        ? "text-green-500"
                        : "text-red-400",
                    )}
                  >
                    {s.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Viewers */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Profile Viewers</p>
            <button
              onClick={() => setProfileViewersOpen(true)}
              className="text-xs font-semibold text-brand-blue hover:underline"
            >
              SEE ALL
            </button>
          </div>
          <div className="space-y-[0.1rem]">
            {MOCK_VIEWERS.slice(0, 3).map((v) => (
              <button
                key={v._id}
                onClick={() => setProfileViewersOpen(true)}
                className="w-full flex items-center gap-2.5 hover:bg-gray-50 p-1.5 rounded-lg transition-colors text-left"
              >
                <Avatar user={v} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {getUserDisplayName(v)}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{v.bio}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Post Likes */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Post Likes</p>
            <button
              onClick={() => setPostLikesOpen(true)}
              className="text-xs font-semibold text-brand-blue hover:underline"
            >
              VIEW
            </button>
          </div>
          <div className="flex -space-x-2 mb-2">
            {MOCK_LIKERS.map((l) => (
              <Avatar
                key={l._id}
                user={l}
                size="sm"
                className="ring-2 ring-white"
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">
              {MOCK_LIKERS.length}
            </span>{" "}
            people liked your posts
          </p>
        </div>

        {/* Notification Settings shortcut */}
        <button
          onClick={() => setNotifSettingsOpen(true)}
          className="card p-4 w-full flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Notification Settings
            </p>
            <p className="text-xs text-gray-400">Manage what you receive</p>
          </div>
          <svg
            className="w-4 h-4 text-gray-400 ml-auto"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </aside>

      {/* Modals */}
      <ProfileViewersModal
        open={profileViewersOpen}
        onClose={() => setProfileViewersOpen(false)}
      />
      <PostLikesModal
        open={postLikesOpen}
        onClose={() => setPostLikesOpen(false)}
      />
      <NotificationSettingsModal
        open={notifSettingsOpen}
        onClose={() => setNotifSettingsOpen(false)}
      />
      <NotifStatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}
