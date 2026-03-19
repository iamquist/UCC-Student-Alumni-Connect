import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  usersApi,
  connectionsApi,
  mentorshipApi,
  skillsApi,
  uploadApi,
} from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import type { User, AlumniProfile, StudentProfile, Skill } from "@/types";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import { getUserDisplayName, cn } from "@/utils";
import toast from "react-hot-toast";
import { Twitter, Linkedin, MessageSquarePlus } from "lucide-react";

// ── Stat Box ──────────────────────────────────────────────────
function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 mx-auto mb-2 text-brand-blue">{icon}</div>
      <p
        className="text-xl font-bold text-gray-900"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// ── Go To Stats Modal ─────────────────────────────────────────
function StatsModal({
  open,
  onClose,
  stats,
}: {
  open: boolean;
  onClose: () => void;
  stats: {
    viewsToday: number;
    postViews: number;
    searchAppearances: number;
    connections: number;
  };
}) {
  const chartData = [
    { day: "Mon", views: 12 },
    { day: "Tue", views: 28 },
    { day: "Wed", views: 19 },
    { day: "Thu", views: 42 },
    { day: "Fri", views: 35 },
    { day: "Sat", views: 8 },
    { day: "Sun", views: 15 },
  ];
  const max = Math.max(...chartData.map((d) => d.views));

  return (
    <Modal open={open} onClose={onClose} title="Your Analytics" size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Profile Views Today",
              value: stats.viewsToday,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Post Views (7 days)",
              value: stats.postViews,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Search Appearances",
              value: stats.searchAppearances,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Total Connections",
              value: stats.connections,
              color: "text-brand-blue",
              bg: "bg-blue-50",
            },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-4`}>
              <p
                className={`text-2xl font-bold ${s.color}`}
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {s.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div>
          <p
            className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Profile Views (Last 7 Days)
          </p>
          <div className="flex items-end gap-2 h-24">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-200 rounded-t-lg transition-all"
                  style={{
                    height: `${(d.views / max) * 80}px`,
                    background: i === 3 ? "#e8457a" : "#fecdd3",
                  }}
                />
                <span className="text-[9px] text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Data reflects the last 7 days of activity
        </p>
      </div>
    </Modal>
  );
}

// ── Share Profile Modal ────────────────────────────────────────
function ShareProfileModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
}) {
  const [copied, setCopied] = useState(false);
  if (!user) return null;
  const url = `${window.location.origin}/profile/${user._id}`;
  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = [
    {
      label: "Twitter",
      icon: Twitter,
      color: "bg-sky-50 text-sky-600",
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "WhatsApp",
      icon: MessageSquarePlus,
      color: "bg-green-50 text-green-600",
    },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Share Profile" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <Avatar user={user} size="md" />
          <div>
            <p className="text-sm font-semibold">{getUserDisplayName(user)}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <input
            readOnly
            value={url}
            className="flex-1 text-xs text-gray-500 bg-transparent outline-none"
          />
          <button
            onClick={copyLink}
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-lg",
              copied
                ? "bg-green-100 text-green-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300",
            )}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {share.map(({ label, color, icon: Icon }) => (
            <button
              key={label}
              className={`${color} py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 hover:opacity-80 transition-opacity`}
            >
              <span className="text-lg">
                <Icon />
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────
function EditProfileModal({
  open,
  onClose,
  user,
  profile,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
  profile: AlumniProfile | StudentProfile | null;
  onSaved: (u: User) => void;
}) {
  const { updateUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio || "",
    location: user.location || "",
    phone: user.phone || "",
    // alumni
    currentCompany: (profile as AlumniProfile)?.currentCompany || "",
    currentPosition: (profile as AlumniProfile)?.currentPosition || "",
    industry: (profile as AlumniProfile)?.industry || "",
    mentorshipAvailable:
      (profile as AlumniProfile)?.mentorshipAvailable || false,
    linkedin:
      (profile as AlumniProfile)?.linkedin ||
      (profile as StudentProfile)?.linkedin ||
      "",
    github:
      (profile as AlumniProfile)?.github ||
      (profile as StudentProfile)?.github ||
      "",
    website: (profile as AlumniProfile)?.website || "",
    // student
    program: (profile as StudentProfile)?.program || "",
    careerGoals: (profile as StudentProfile)?.careerGoals || "",
    portfolio: (profile as StudentProfile)?.portfolio || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [previewAvatar, setPreviewAvatar] = useState(user.profilePicture);
  const [previewCover, setPreviewCover] = useState(user.coverPhoto);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadApi.uploadImage(file);
      if (type === "avatar") setPreviewAvatar(url);
      else setPreviewCover(url);
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        location: form.location,
        phone: form.phone,
        ...(previewAvatar !== user.profilePicture
          ? { profilePicture: previewAvatar }
          : {}),
        ...(previewCover !== user.coverPhoto
          ? { coverPhoto: previewCover }
          : {}),
      });
      onSaved(updated);
      updateUser(updated);
      toast.success("Profile updated!");
      onClose();
    } catch {
      toast.error("Could not save");
    }
    setSaving(false);
  };

  const update = (k: string, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));
  const isAlumni = user.role === "alumni";

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="space-y-[0.1rem]">
        {/* Cover + Avatar */}
        <div className="relative">
          <div
            className="h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 cursor-pointer group relative"
            onClick={() => coverRef.current?.click()}
          >
            {previewCover && (
              <img
                src={previewCover}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
              <span className="text-white text-xs font-semibold">
                Change Cover
              </span>
            </div>
          </div>
          <div className="absolute -bottom-2 left-4">
            <div
              className="relative cursor-pointer group"
              onClick={() => avatarRef.current?.click()}
            >
              <Avatar
                user={{ ...user, profilePicture: previewAvatar }}
                size="xl"
                className="ring-2 ring-white"
              />
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e, "avatar")}
          />
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e, "cover")}
          />
        </div>
        <div className="pt-2 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              First Name
            </label>
            <input
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Last Name
            </label>
            <input
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
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
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="Tell people about yourself…"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Location
            </label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
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
              onChange={(e) => update("phone", e.target.value)}
              className="input-field"
              placeholder="+233 XX XXX XXXX"
            />
          </div>
        </div>
        {isAlumni ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Current Company
                </label>
                <input
                  value={form.currentCompany}
                  onChange={(e) => update("currentCompany", e.target.value)}
                  className="input-field"
                  placeholder="e.g. Google"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Current Position
                </label>
                <input
                  value={form.currentPosition}
                  onChange={(e) => update("currentPosition", e.target.value)}
                  className="input-field"
                  placeholder="e.g. Senior Engineer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Industry
                </label>
                <input
                  value={form.industry}
                  onChange={(e) => update("industry", e.target.value)}
                  className="input-field"
                  placeholder="e.g. Technology"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  LinkedIn
                </label>
                <input
                  value={form.linkedin}
                  onChange={(e) => update("linkedin", e.target.value)}
                  className="input-field"
                  placeholder="linkedin.com/in/…"
                />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  "w-10 h-5 rounded-full transition-colors",
                  form.mentorshipAvailable ? "bg-brand-blue" : "bg-gray-200",
                )}
                onClick={() =>
                  update("mentorshipAvailable", !form.mentorshipAvailable)
                }
              >
                <div
                  className={cn(
                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform m-0.5",
                    form.mentorshipAvailable
                      ? "translate-x-5"
                      : "translate-x-0",
                  )}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Available for mentorship
              </span>
            </label>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Program / Major
                </label>
                <input
                  value={form.program}
                  onChange={(e) => update("program", e.target.value)}
                  className="input-field"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  LinkedIn
                </label>
                <input
                  value={form.linkedin}
                  onChange={(e) => update("linkedin", e.target.value)}
                  className="input-field"
                  placeholder="linkedin.com/in/…"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Career Goals
              </label>
              <textarea
                value={form.careerGoals}
                onChange={(e) => update("careerGoals", e.target.value)}
                rows={2}
                className="input-field resize-none"
                placeholder="What are you aiming for?"
              />
            </div>
          </>
        )}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Contact Info Modal ────────────────────────────────────────
function ContactInfoModal({
  open,
  onClose,
  user,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
  profile: AlumniProfile | StudentProfile | null;
}) {
  const items = [
    { label: "Email", value: user.email, icon: "✉️" },
    { label: "Phone", value: user.phone || "Not set", icon: "📱" },
    { label: "Location", value: user.location || "Not set", icon: "📍" },
    {
      label: "LinkedIn",
      value:
        (profile as AlumniProfile)?.linkedin ||
        (profile as StudentProfile)?.linkedin ||
        "Not set",
      icon: "🔗",
    },
    {
      label: "GitHub",
      value:
        (profile as AlumniProfile)?.github ||
        (profile as StudentProfile)?.github ||
        "Not set",
      icon: "💻",
    },
    {
      label: "Website",
      value:
        (profile as AlumniProfile)?.website ||
        (profile as StudentProfile)?.portfolio ||
        "Not set",
      icon: "🌐",
    },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Contact Information" size="sm">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
          >
            <span className="text-base">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p
                className={cn(
                  "text-sm truncate mt-0.5",
                  item.value === "Not set"
                    ? "text-gray-400 italic"
                    : "text-gray-800 font-medium",
                )}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ── Project Modal ─────────────────────────────────────────────
type Project = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  image?: string;
  status: "active" | "completed" | "paused";
};

function ProjectViewModal({
  project,
  open,
  onClose,
  isOwn,
  onDelete,
}: {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  isOwn: boolean;
  onDelete?: (id: string) => void;
}) {
  if (!project) return null;
  return (
    <Modal open={open} onClose={onClose} title={project.title} size="md">
      <div className="space-y-4">
        {project.image && (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-40 object-cover rounded-xl"
          />
        )}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full capitalize",
              project.status === "active"
                ? "bg-green-100 text-green-700"
                : project.status === "completed"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-yellow-100 text-yellow-700",
            )}
          >
            {project.status}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {project.description}
        </p>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="chip">
                #{t}
              </span>
            ))}
          </div>
        )}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-brand-blue hover:underline"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Project
          </a>
        )}
        {isOwn && onDelete && (
          <button
            onClick={() => {
              onDelete(project.id);
              onClose();
            }}
            className="w-full text-xs text-red-400 hover:text-red-600 py-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete Project
          </button>
        )}
      </div>
    </Modal>
  );
}

// ── Connections List Modal ─────────────────────────────────────
function ConnectionsListModal({
  open,
  onClose,
  connections,
}: {
  open: boolean;
  onClose: () => void;
  connections: User[];
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const filtered = connections.filter((c) =>
    getUserDisplayName(c).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Connections (${connections.length})`}
      size="md"
    >
      <div className="space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search connections…"
          className="input-field"
        />
        <div className="max-h-72 overflow-y-auto space-y-2">
          {filtered.map((u) => (
            <button
              key={u._id}
              onClick={() => {
                navigate(`/profile/${u._id}`);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
            >
              <Avatar user={u} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {getUserDisplayName(u)}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {u.bio?.slice(0, 40) || u.role}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">
              No connections found
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Mentorship Request Modal ───────────────────────────────────
function MentorshipRequestModal({
  open,
  onClose,
  targetUser,
}: {
  open: boolean;
  onClose: () => void;
  targetUser: User | null;
}) {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (!targetUser) return null;
  const handleSubmit = async () => {
    if (!topic.trim() || !message.trim()) {
      toast.error("Topic and message required");
      return;
    }
    setSubmitting(true);
    try {
      await mentorshipApi.sendRequest(targetUser._id, topic, message);
      toast.success("Mentorship request sent!");
      onClose();
      setTopic("");
      setMessage("");
    } catch {
      toast.error("Could not send request");
    }
    setSubmitting(false);
  };
  return (
    <Modal open={open} onClose={onClose} title="Request Mentorship" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <Avatar user={targetUser} size="md" />
          <div>
            <p className="text-sm font-semibold">
              {getUserDisplayName(targetUser)}
            </p>
            <p className="text-xs text-gray-400">
              {
                (
                  targetUser as unknown as AlumniProfile & {
                    currentPosition?: string;
                    currentCompany?: string;
                  }
                )?.currentPosition
              }
            </p>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Topic *
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-field"
            placeholder="e.g. Career transition, Interview prep, Technical skills"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="input-field resize-none"
            placeholder="Introduce yourself and explain what you're looking for…"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? "Sending…" : "Send Request"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Visitor Preview Modal ──────────────────────────────────────
function VisitorPreviewModal({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title="Profile Visitor" size="sm">
      <div className="flex flex-col items-center text-center">
        <Avatar user={user} size="xl" className="mb-3" />
        <p
          className="font-bold text-gray-900"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          {getUserDisplayName(user)}
        </p>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          {user.bio || user.role}
        </p>
        {user.location && (
          <p className="text-xs text-gray-400 mb-4">{user.location}</p>
        )}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => {
              navigate(`/profile/${user._id}`);
              onClose();
            }}
            className="btn-secondary flex-1 text-sm"
          >
            View Profile
          </button>
          <button
            onClick={() => {
              navigate(`/chat`);
              onClose();
            }}
            className="btn-primary flex-1 text-sm"
          >
            Message
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Skill Manager Modal ────────────────────────────────────────
function SkillManagerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<
    "beginner" | "intermediate" | "advanced" | "expert"
  >("intermediate");

  useEffect(() => {
    if (!open) return;
    skillsApi
      .getSkills()
      .then((s) => {
        setSkills(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  const addSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      const s = await skillsApi.addSkill({
        name: newSkillName,
        proficiency: newSkillLevel as
          | "beginner"
          | "intermediate"
          | "advanced"
          | "expert",
        progress: 0,
      });
      setSkills((prev) => [...prev, s]);
      setNewSkillName("");
      toast.success("Skill added!");
    } catch {
      toast.error("Could not add skill");
    }
  };
  const removeSkill = async (id: string) => {
    try {
      await skillsApi.deleteSkill(id);
      setSkills((prev) => prev.filter((s) => s._id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Could not remove");
    }
  };
  const updateProgress = async (id: string, progress: number) => {
    try {
      const updated = await skillsApi.updateProgress(id, progress);
      setSkills((prev) => prev.map((s) => (s._id === id ? updated : s)));
    } catch {
      toast.error("Could not update");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Skills" size="md">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            className="input-field flex-1"
            placeholder="Add a skill…"
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
          />
          <select
            value={newSkillLevel}
            onChange={(e) =>
              setNewSkillLevel(e.target.value as typeof newSkillLevel)
            }
            className="input-field w-36"
          >
            {["beginner", "intermediate", "advanced", "expert"].map((l) => (
              <option key={l} value={l} className="capitalize">
                {l}
              </option>
            ))}
          </select>
          <button onClick={addSkill} className="btn-primary px-4">
            Add
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : skills.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {skills.map((skill) => (
              <div
                key={skill._id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {skill.name}
                    </p>
                    <span className="text-xs text-gray-400 capitalize">
                      {skill.proficiency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-blue rounded-full transition-all"
                        style={{ width: `${skill.progress || 0}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={skill.progress || 0}
                      onChange={(e) =>
                        updateProgress(skill._id, +e.target.value)
                      }
                      className="w-16 accent-brand-blue"
                    />
                    <span className="text-xs text-gray-400 w-8">
                      {skill.progress || 0}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeSkill(skill._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 py-4">
            No skills added yet
          </p>
        )}
      </div>
    </Modal>
  );
}

// ── Account Settings Menu ─────────────────────────────────────
function AccountMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await logout();
      toast.success("Account deleted");
      navigate("/");
    } catch {
      toast.error("Could not delete account");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Account Options" size="sm">
      <div className="space-y-2">
        {[
          {
            label: "Download My Data",
            icon: "⬇️",
            action: () =>
              toast.success("Data download request sent to your email"),
          },
          {
            label: "Privacy Settings",
            icon: "🔒",
            action: () => {
              navigate("/settings");
              onClose();
            },
          },
          {
            label: "Blocked Accounts",
            icon: "🚫",
            action: () => toast.success("Manage blocked accounts coming soon"),
          },
          {
            label: "Manage Visibility",
            icon: "👁️",
            action: () => toast.success("Visibility settings coming soon"),
          },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div className="border-t border-gray-100 pt-2">
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <span>🗑️</span>
            {confirmDelete
              ? "Click again to confirm deletion"
              : "Delete Account"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Profile Page ──────────────────────────────────────────────
const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    title: "E-commerce Platform",
    description:
      "A full-stack e-commerce platform built with React, Node.js, and MongoDB. Features include user authentication, product catalog, shopping cart, and payment integration with Paystack.",
    tags: ["react", "nodejs", "mongodb", "paystack"],
    url: "https://github.com/example/ecommerce",
    status: "completed",
  },
  {
    id: "2",
    title: "AI Study Buddy",
    description:
      "An AI-powered study assistant that helps students generate summaries, flashcards, and quizzes from their notes. Uses the OpenAI API.",
    tags: ["ai", "python", "openai", "flask"],
    status: "active",
  },
  {
    id: "3",
    title: "Campus Event App",
    description:
      "Mobile app for discovering and RSVP-ing to campus events. Built with React Native.",
    tags: ["react-native", "expo", "firebase"],
    status: "paused",
  },
  {
    id: "4",
    title: "Alumni Network API",
    description:
      "REST API powering the UniAlum platform, handling user authentication, connections, and real-time messaging.",
    tags: ["nodejs", "graphql", "mongodb", "socket.io"],
    url: "https://github.com/example/api",
    status: "active",
  },
];

const MOCK_VISITORS: User[] = [
  {
    _id: "v1",
    firstName: "Abena",
    lastName: "Mensah",
    email: "",
    role: "alumni",
    bio: "Product Manager at Jumia",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "v2",
    firstName: "Kofi",
    lastName: "Amponsah",
    email: "",
    role: "student",
    bio: "CS Student, Ashesi",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "v3",
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
  },
  {
    _id: "v5",
    firstName: "Efua",
    lastName: "Asante",
    email: "",
    role: "alumni",
    bio: "Software Engineer at Andela",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "",
    updatedAt: "",
  },
];

export default function ProfilePage() {
  const { id } = useParams<{ id?: string }>();
  const { user: currentUser } = useAuthStore();
  const { createConversation, setActiveConversation } = useChatStore();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AlumniProfile | StudentProfile | null>(
    null,
  );
  const [skills, setSkills] = useState<Skill[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "activity" | "articles"
  >("profile");
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllVisitors, setShowAllVisitors] = useState(false);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [mentorshipOpen, setMentorshipOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [skillManagerOpen, setSkillManagerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwn = !id || id === currentUser?._id;
  const displayUser = isOwn ? currentUser : profileUser;
  const visibleProjects = showAllProjects ? projects : projects.slice(0, 3);
  const visibleVisitors = showAllVisitors
    ? MOCK_VISITORS
    : MOCK_VISITORS.slice(0, 3);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (!isOwn && id) {
          const result = await usersApi.getUserById(id);
          setProfileUser(result.user);
          setProfile(result.profile);
        }
        const [skillsRes, connRes] = await Promise.allSettled([
          skillsApi.getSkills(),
          connectionsApi.getConnections(),
        ]);
        if (skillsRes.status === "fulfilled") {
          const skillsArray = (skillsRes.value as Skill[]) || [];
          setSkills(skillsArray);
        } else {
          setSkills([]);
        }
        if (connRes.status === "fulfilled") {
          const connData = connRes.value as any;
          const connArray = (connData?.data || connData || []) as User[];
          setConnections(connArray);
        } else {
          setConnections([]);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Could not load profile");
        setSkills([]);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  const handleConnect = async () => {
    if (!displayUser) return;
    try {
      await connectionsApi.sendRequest(
        displayUser._id,
        `Hi ${displayUser.firstName}, I'd like to connect!`,
      );
      toast.success("Connection request sent!");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Could not connect");
    }
  };

  const handleMessage = async () => {
    if (!displayUser) return;
    try {
      const conv = await createConversation(displayUser._id);
      setActiveConversation(conv._id);
      navigate("/chat");
    } catch {
      toast.error("Could not open chat");
    }
  };

  if (loading) {
    return (
      <div className="page-container py-6">
        <div className="card animate-pulse">
          <div className="h-40 bg-gray-200 rounded-t-xl" />
          <div className="p-6 space-y-3">
            <div className="skeleton h-5 w-48 rounded" />
            <div className="skeleton h-3 w-64 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!displayUser)
    return (
      <div className="page-container py-6 text-center text-gray-400">
        User not found
      </div>
    );

  return (
    <div className="page-container py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Profile header card */}
        <div className="card overflow-hidden">
          <div className="h-40 relative group">
            {displayUser.coverPhoto ? (
              <img
                src={displayUser.coverPhoto}
                alt="cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
            )}
            {isOwn && (
              <button
                onClick={() => setEditOpen(true)}
                className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
              >
                <span className="text-white text-xs font-semibold">
                  Edit Cover
                </span>
              </button>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className="relative">
                <Avatar
                  user={displayUser}
                  size="2xl"
                  className="ring-4 ring-white"
                />
                {isOwn && (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1">
                {isOwn ? (
                  <>
                    <button
                      onClick={() => setEditOpen(true)}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setShareOpen(true)}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Share Profile
                    </button>
                    <div ref={menuRef} className="relative">
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-float border border-gray-100 py-1.5 z-30 animate-fade-in">
                          <button
                            onClick={() => {
                              setStatsOpen(true);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                            </svg>
                            View Analytics
                          </button>
                          <button
                            onClick={() => {
                              setSkillManagerOpen(true);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Manage Skills
                          </button>
                          <button
                            onClick={() => {
                              navigate("/settings");
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <circle cx="12" cy="12" r="3" />
                              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                            </svg>
                            Settings
                          </button>
                          <button
                            onClick={() => {
                              setAccountMenuOpen(true);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-50"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                            Account Options
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleConnect}
                      className="btn-primary text-xs py-2 px-4"
                    >
                      Connect
                    </button>
                    <button
                      onClick={handleMessage}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Message
                    </button>
                    {displayUser.role === "alumni" && (
                      <button
                        onClick={() => setMentorshipOpen(true)}
                        className="btn-secondary text-xs py-2 px-4 text-brand-blue border-blue-200 hover:bg-blue-50"
                      >
                        Request Mentorship
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <h1
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {getUserDisplayName(displayUser)}
              </h1>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {displayUser.bio || "No bio yet"}
              </p>
              {displayUser.location && (
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {displayUser.location}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={() => setConnectionsOpen(true)}
                  className="text-sm text-gray-700 hover:text-brand-blue transition-colors"
                >
                  <span className="font-bold">{connections.length || 0}</span>{" "}
                  <span className="text-gray-400">connections</span>
                </button>
                <button
                  onClick={() => setContactOpen(true)}
                  className="text-xs text-brand-blue hover:underline"
                >
                  Contact info
                </button>
                {isOwn && (
                  <button
                    onClick={() => setStatsOpen(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                    </svg>
                    Your stats
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-100 grid grid-cols-3">
            {(["profile", "activity", "articles"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                  activeTab === tab
                    ? "text-brand-blue border-b-2 border-brand-blue"
                    : "text-gray-400 hover:text-gray-600",
                )}
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "profile" && (
          <>
            {/* Skills */}
            {skills.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-sm font-bold text-gray-900 uppercase tracking-widest"
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    Skills
                  </h2>
                  {isOwn && (
                    <button
                      onClick={() => setSkillManagerOpen(true)}
                      className="text-xs text-brand-blue hover:underline"
                    >
                      Manage
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div key={skill._id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {skill.name}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          {skill.proficiency}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-blue rounded-full"
                          style={{ width: `${skill.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-sm font-bold text-gray-900 uppercase tracking-widest"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  Projects
                </h2>
                {isOwn && (
                  <button className="btn-primary text-xs py-1.5 px-3">
                    + Add Project
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {visibleProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="border border-gray-100 rounded-xl p-4 text-left hover:border-gray-200 hover:shadow-card transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                          project.status === "active"
                            ? "bg-green-100 text-green-700"
                            : project.status === "completed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700",
                        )}
                      >
                        {project.status}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-brand-blue transition-colors">
                      {project.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              {!showAllProjects && projects.length > 3 && (
                <button
                  onClick={() => setShowAllProjects(true)}
                  className="w-full text-xs font-semibold text-brand-blue mt-4 py-2 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  SHOW MORE PROJECTS ({projects.length - 3} more)
                </button>
              )}
            </div>
          </>
        )}

        {activeTab === "activity" && (
          <div className="card p-6">
            <h2
              className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Recent Activity
            </h2>
            {[
              {
                text: "Published a new post about UX design trends",
                time: "2h ago",
                type: "post",
              },
              {
                text: "Connected with Kwame Asante (Google)",
                time: "1d ago",
                type: "connection",
              },
              {
                text: "Applied for Product Designer at Meta",
                time: "2d ago",
                type: "job",
              },
              {
                text: 'Attended "Tech for Africa" virtual event',
                time: "3d ago",
                type: "event",
              },
              {
                text: "Received mentorship request from 2 students",
                time: "5d ago",
                type: "mentorship",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                  {item.type === "post"
                    ? "📝"
                    : item.type === "connection"
                      ? "🤝"
                      : item.type === "job"
                        ? "💼"
                        : item.type === "event"
                          ? "🎯"
                          : "🎓"}
                </div>
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {item.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "articles" && (
          <div className="card p-6">
            <h2
              className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Published Articles
            </h2>
            {[
              {
                title: "The Future of Product Design in Africa",
                views: 3420,
                likes: 128,
                time: "2 weeks ago",
              },
              {
                title: "From Student to Senior Engineer: My Journey",
                views: 8901,
                likes: 342,
                time: "1 month ago",
              },
              {
                title: "Building Scalable Systems with GraphQL",
                views: 1892,
                likes: 76,
                time: "2 months ago",
              },
            ].map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-4 border-b border-gray-50 last:border-0"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {a.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.views.toLocaleString()} views · {a.likes} likes ·{" "}
                    {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="space-y-4">
        {/* Stats card */}
        {isOwn && (
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
            <div className="grid grid-cols-3 gap-2">
              <StatBox
                label="Views Today"
                value={currentUser?.viewsToday || 0}
                icon={
                  <svg
                    className="w-full"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                }
              />
              <StatBox
                label="Post Views"
                value={currentUser?.postViews || 0}
                icon={
                  <svg
                    className="w-full"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                }
              />
              <StatBox
                label="Searches"
                value={currentUser?.searchAppearances || 0}
                icon={
                  <svg
                    className="w-full"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                }
              />
            </div>
          </div>
        )}

        {/* Visitors */}
        <div className="card p-4">
          <p className="section-title mb-3">Profile Visitors</p>
          <div className="space-y-3">
            {visibleVisitors.map((visitor) => (
              <button
                key={visitor._id}
                onClick={() => setSelectedVisitor(visitor)}
                className="w-full flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-xl transition-colors text-left"
              >
                <Avatar user={visitor} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {getUserDisplayName(visitor)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {visitor.bio}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {!showAllVisitors && MOCK_VISITORS.length > 3 && (
            <button
              onClick={() => setShowAllVisitors(true)}
              className="w-full text-xs font-semibold text-brand-blue mt-3 py-1.5 hover:bg-blue-50 rounded-xl transition-colors"
            >
              VIEW ALL ({MOCK_VISITORS.length} visitors)
            </button>
          )}
        </div>
      </aside>

      {/* Modals */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={displayUser}
        profile={profile}
        onSaved={(u) => setProfileUser(u)}
      />
      <ShareProfileModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        user={displayUser}
      />
      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={{
          viewsToday: currentUser?.viewsToday || 0,
          postViews: currentUser?.postViews || 0,
          searchAppearances: currentUser?.searchAppearances || 0,
          connections: connections.length || 0,
        }}
      />
      <ContactInfoModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        user={displayUser}
        profile={profile}
      />
      <ConnectionsListModal
        open={connectionsOpen}
        onClose={() => setConnectionsOpen(false)}
        connections={connections}
      />
      <MentorshipRequestModal
        open={mentorshipOpen}
        onClose={() => setMentorshipOpen(false)}
        targetUser={!isOwn ? displayUser : null}
      />
      <ProjectViewModal
        project={selectedProject}
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        isOwn={isOwn}
        onDelete={(id) =>
          setProjects((prev) => prev.filter((p) => p.id !== id))
        }
      />
      <VisitorPreviewModal
        user={selectedVisitor}
        open={!!selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />
      <AccountMenu
        open={accountMenuOpen}
        onClose={() => setAccountMenuOpen(false)}
      />
      <SkillManagerModal
        open={skillManagerOpen}
        onClose={() => setSkillManagerOpen(false)}
      />
    </div>
  );
}
