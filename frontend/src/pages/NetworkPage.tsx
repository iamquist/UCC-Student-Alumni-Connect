import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { connectionsApi, usersApi } from "@/services/api";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import type { Connection, User } from "@/types";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import { getUserDisplayName, formatRelativeTime, cn } from "@/utils";
import toast from "react-hot-toast";

type Section =
  | "CONNECTIONS"
  | "INVITATIONS"
  | "TEAMMATES"
  | "GROUPS"
  | "PAGES"
  | "HASHTAGS";

// ── Create Group Modal ────────────────────────────────────────
function CreateGroupModal({
  open,
  onClose,
  connections,
}: {
  open: boolean;
  onClose: () => void;
  connections: User[];
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    toast.success(`Group "${name}" created with ${selected.length} members!`);
    onClose();
    setName("");
    setDesc("");
    setSelected([]);
  };
  return (
    <Modal open={open} onClose={onClose} title="Create New Group" size="md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Group Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="e.g. Ghana Tech Alumni Network"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="input-field resize-none"
            placeholder="What is this group about?"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Add Members from Connections
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {connections.map((c) => (
              <label
                key={c._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(c._id)}
                  onChange={(e) =>
                    setSelected((s) =>
                      e.target.checked
                        ? [...s, c._id]
                        : s.filter((x) => x !== c._id),
                    )
                  }
                  className="rounded accent-brand-blue"
                />
                <Avatar user={c} size="xs" />
                <span className="text-sm text-gray-700">
                  {getUserDisplayName(c)}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCreate} className="btn-primary flex-1">
            Create Group
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Create Teammates Modal ─────────────────────────────────────
function CreateTeammatesModal({
  open,
  onClose,
  connections,
}: {
  open: boolean;
  onClose: () => void;
  connections: User[];
}) {
  const [projectName, setProjectName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const handleCreate = () => {
    if (!projectName.trim()) {
      toast.error("Project name required");
      return;
    }
    toast.success(`Team "${projectName}" assembled!`);
    onClose();
    setProjectName("");
    setSelected([]);
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Teammates" size="md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Project / Team Name *
          </label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="input-field"
            placeholder="e.g. Mobile App Redesign"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Select Teammates ({selected.length} selected)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {connections.map((c) => (
              <label
                key={c._id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-colors",
                  selected.includes(c._id)
                    ? "border-brand-blue bg-blue-50"
                    : "border-gray-100 hover:bg-gray-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(c._id)}
                  onChange={(e) =>
                    setSelected((s) =>
                      e.target.checked
                        ? [...s, c._id]
                        : s.filter((x) => x !== c._id),
                    )
                  }
                  className="hidden"
                />
                <Avatar user={c} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {getUserDisplayName(c)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {c.bio?.slice(0, 30) || c.role}
                  </p>
                </div>
                {selected.includes(c._id) && (
                  <svg
                    className="w-4 h-4 text-brand-blue flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCreate} className="btn-primary flex-1">
            Create Team ({selected.length})
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Profile Preview Modal ──────────────────────────────────────
function ProfilePreviewModal({
  user,
  open,
  onClose,
  showAccept,
  onAccept,
  onDecline,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  showAccept?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const navigate = useNavigate();
  const { createConversation, setActiveConversation } = useChatStore();

  const handleMessage = async () => {
    if (!user) return;
    try {
      const conv = await createConversation(user._id);
      setActiveConversation(conv._id);
      navigate("/chat");
      onClose();
    } catch {
      toast.error("Could not open chat");
    }
  };

  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title="Profile" size="md">
      <div>
        <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-4 relative">
          <div className="absolute -bottom-6 left-4">
            <Avatar user={user} size="xl" className="ring-4 ring-white" />
          </div>
        </div>
        <div className="pt-8 pb-4">
          <h2
            className="text-lg font-bold text-gray-900"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            {getUserDisplayName(user)}
          </h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {user.bio || "No bio available"}
          </p>
          {user.location && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
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
              {user.location}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {showAccept ? (
            <>
              <button
                onClick={() => {
                  onAccept?.();
                  onClose();
                }}
                className="btn-primary flex-1"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  onDecline?.();
                  onClose();
                }}
                className="btn-secondary flex-1 text-red-500 border-red-200 hover:bg-red-50"
              >
                Decline
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate(`/profile/${user._id}`);
                  onClose();
                }}
                className="btn-secondary flex-1"
              >
                View Full Profile
              </button>
              <button onClick={handleMessage} className="btn-primary flex-1">
                Send Message
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Invitation Card ────────────────────────────────────────────
function InvitationCard({
  connection,
  onAccept,
  onDecline,
  onViewProfile,
}: {
  connection: Connection;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onViewProfile: (user: User) => void;
}) {
  return (
    <div className="py-5 border-b border-gray-50 last:border-0 flex items-start gap-4">
      <button
        onClick={() => onViewProfile(connection.requester)}
        className="flex-shrink-0"
      >
        <Avatar
          user={connection.requester}
          size="lg"
          className="hover:ring-2 hover:ring-brand-blue transition-all"
        />
      </button>
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onViewProfile(connection.requester)}
          className="text-sm font-bold text-gray-900 hover:text-brand-blue transition-colors text-left"
        >
          {getUserDisplayName(connection.requester)}
        </button>
        <p className="text-xs text-gray-400">
          {connection.requester.bio?.slice(0, 40) || connection.requester.role}
        </p>
        {connection.message && (
          <div className="border-l-2 border-gray-200 pl-3 mt-1.5">
            <p className="text-xs text-gray-500 italic">{connection.message}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onAccept(connection._id)}
          className="btn-primary text-xs px-4 py-2"
        >
          ACCEPT
        </button>
        <button
          onClick={() => onDecline(connection._id)}
          className="btn-secondary text-xs px-4 py-2"
        >
          DECLINE
        </button>
      </div>
    </div>
  );
}

// ── Groups section ─────────────────────────────────────────────
function GroupsSection({ onCreateGroup }: { onCreateGroup: () => void }) {
  const groups = [
    {
      name: [],
      members: [],
      color: [],
    },
  ];
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-sm font-bold text-gray-900"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          Your Groups
        </h2>
        <button
          onClick={onCreateGroup}
          className="btn-primary text-xs px-4 py-2"
        >
          + Create Group
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {groups.map((g, i) => (
          <div
            key={i}
            className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-card transition-all cursor-pointer"
          >
            <div
              className={`w-10 h-10 ${g.color} rounded-xl mb-3 flex items-center justify-center text-white font-bold`}
            >
              {g.name[0]}
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {g.name}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {g.members.toLocaleString()} members
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hashtags section ───────────────────────────────────────────
function HashtagsSection() {
  const tags = [];
  const [following, setFollowing] = useState(["#design"]);
  const toggle = (tag: string) =>
    setFollowing((f) =>
      f.includes(tag) ? f.filter((t) => t !== tag) : [...f, tag],
    );
  return (
    <div className="card p-6">
      <h2
        className="text-sm font-bold text-gray-900 mb-4"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        Manage Hashtags
      </h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={cn(
              "chip transition-all",
              following.includes(tag)
                ? "bg-blue-100 text-brand-blue border-blue-200"
                : "hover:bg-gray-200",
            )}
          >
            {tag} {following.includes(tag) ? "✓" : "+"}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Following {following.length} hashtags
      </p>
    </div>
  );
}

// ── Pages section ──────────────────────────────────────────────
function PagesSection() {
  const pages = [{ name: [], followers: [], color: [] }];
  return (
    <div className="card p-6">
      <h2
        className="text-sm font-bold text-gray-900 mb-4"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        Pages You Follow
      </h2>
      <div className="space-y-3">
        {pages.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-gray-50 transition-colors"
          >
            <div
              className={`w-10 h-10 ${p.color} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
            >
              {p.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-400">{p.followers} followers</p>
            </div>
            <button className="text-xs text-gray-400 hover:text-red-500 font-medium">
              Unfollow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Network Page ───────────────────────────────────────────────
export default function NetworkPage() {
  const [section, setSection] = useState<Section>("INVITATIONS");
  const [inviteTab, setInviteTab] = useState<"received" | "sent">("received");
  const [received, setReceived] = useState<Connection[]>([]);
  const [sent, setSent] = useState<Connection[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileConn, setProfileConn] = useState<Connection | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, s, c] = await Promise.all([
        connectionsApi.getRequests("received"),
        connectionsApi.getRequests("sent"),
        connectionsApi.getConnections(),
      ]);
      const receivedArray = Array.isArray(r) ? r : r?.data || [];
      const sentArray = Array.isArray(s) ? s : s?.data || [];
      const connArray = Array.isArray(c) ? c : c?.data || [];
      setReceived(receivedArray);
      setSent(sentArray);
      setConnections(connArray);
    } catch (err) {
      console.error("Failed to load network data:", err);
      toast.error("Failed to load network data");
      setReceived([]);
      setSent([]);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await connectionsApi.acceptRequest(requestId);
      setReceived((p) => p.filter((r) => r._id !== requestId));
      toast.success("Connected!");
    } catch {
      toast.error("Failed to accept");
    }
  };
  const handleDecline = async (requestId: string) => {
    try {
      await connectionsApi.declineRequest(requestId);
      setReceived((p) => p.filter((r) => r._id !== requestId));
      toast.success("Declined");
    } catch {
      toast.error("Failed to decline");
    }
  };

  const SIDEBAR = [
    {
      key: "CONNECTIONS" as Section,
      label: "CONNECTIONS",
      icon: "🔗",
      count: connections.length,
    },
    {
      key: "INVITATIONS" as Section,
      label: "INVITATIONS",
      icon: "📬",
      count: received.length,
      badge: received.length > 0,
    },
    {
      key: "TEAMMATES" as Section,
      label: "TEAMMATES",
      icon: "🗂️",
      count: null,
    },
    {
      key: "GROUPS" as Section,
      label: "GROUPS",
      icon: "👥",
      count: null,
    },
    { key: "PAGES" as Section, label: "PAGES", icon: "📄", count: null },
    {
      key: "HASHTAGS" as Section,
      label: "HASHTAGS",
      icon: "#",
      count: null,
    },
  ];

  return (
    <div className="page-container py-6 flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0">
        <div className="card py-2">
          {SIDEBAR.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                section === item.key
                  ? "border-l-2 border-brand-blue bg-blue-50"
                  : "hover:bg-gray-50",
              )}
            >
              <span className="text-sm">{item.icon}</span>
              <span
                className={cn(
                  "flex-1 text-xs font-bold uppercase tracking-wider",
                  section === item.key ? "text-brand-blue" : "text-gray-500",
                )}
              >
                {item.label}
              </span>
              {item.count != null && (
                <span
                  className={cn(
                    "text-xs font-bold",
                    item.badge ? "text-brand-blue" : "text-gray-400",
                  )}
                >
                  {item.count}
                  {item.badge && (
                    <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full ml-1 align-middle pulse-dot" />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {section === "INVITATIONS" && (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-2">
              {(["received", "sent"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInviteTab(tab)}
                  className={cn(
                    "py-3.5 text-xs font-bold uppercase tracking-widest transition-colors",
                    inviteTab === tab
                      ? "bg-brand-blue text-white"
                      : "bg-gray-50 text-gray-400 hover:text-gray-600",
                  )}
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="p-6">
              {inviteTab === "received" ? (
                received.length > 0 ? (
                  <>
                    <p
                      className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-4"
                      style={{ fontFamily: "Sora, sans-serif" }}
                    >
                      YOU HAVE {received.length} NEW CONNECTION
                      {received.length !== 1 ? "S" : ""}
                    </p>
                    {received.map((req) => (
                      <InvitationCard
                        key={req._id}
                        connection={req}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        onViewProfile={(u) => {
                          setProfileUser(u);
                          setProfileConn(req);
                        }}
                      />
                    ))}
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm text-gray-400">
                      No pending invitations
                    </p>
                  </div>
                )
              ) : sent.length > 0 ? (
                <div className="space-y-3">
                  {sent.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0"
                    >
                      <Avatar user={req.recipient} size="md" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {getUserDisplayName(req.recipient)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {req.recipient.role}
                        </p>
                      </div>
                      <span className="text-xs text-yellow-500 font-semibold bg-yellow-50 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400">No sent invitations</p>
                </div>
              )}

              {/* Recent connections */}
              {inviteTab === "received" && connections.length > 0 && (
                <>
                  <p
                    className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center my-6"
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    RECENT CONNECTIONS
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {connections.slice(0, 4).map((u) => (
                      <button
                        key={u._id}
                        onClick={() => {
                          setProfileUser(u);
                          setProfileConn(null);
                        }}
                        className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left"
                      >
                        <Avatar user={u} size="lg" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {getUserDisplayName(u)}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {u.bio?.slice(0, 30) || u.role}
                          </p>
                          <p className="text-[11px] text-gray-300 mt-0.5">
                            Yesterday
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {section === "CONNECTIONS" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-sm font-bold text-gray-900 uppercase tracking-widest"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Connections ({connections.length})
              </h2>
              <button
                onClick={() => navigate("/network?search=true")}
                className="btn-secondary text-xs"
              >
                Find People
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : connections.length > 0 ? (
              <div className="space-y-3">
                {connections.map((u) => (
                  <div key={u._id} className="card p-4 flex items-center gap-4">
                    <button
                      onClick={() => {
                        setProfileUser(u);
                        setProfileConn(null);
                      }}
                    >
                      <Avatar
                        user={u}
                        size="lg"
                        className="hover:ring-2 hover:ring-brand-blue transition-all"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => {
                          setProfileUser(u);
                          setProfileConn(null);
                        }}
                        className="text-sm font-semibold text-gray-900 hover:text-brand-blue transition-colors"
                      >
                        {getUserDisplayName(u)}
                      </button>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {u.bio?.slice(0, 50) || u.role}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const conv = await useChatStore
                            .getState()
                            .createConversation(u._id);
                          useChatStore
                            .getState()
                            .setActiveConversation(conv._id);
                          navigate("/chat");
                        } catch {
                          toast.error("Could not open chat");
                        }
                      }}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Message
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card py-16 text-center">
                <p className="text-sm text-gray-400">
                  No connections yet. Start networking!
                </p>
              </div>
            )}
          </div>
        )}

        {section === "TEAMMATES" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-sm font-bold text-gray-900 uppercase tracking-widest"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Teammates
              </h2>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="btn-primary text-xs"
              >
                + Add Teammates
              </button>
            </div>
            <div className="card py-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">No teammates yet</p>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="btn-primary text-xs mt-3"
              >
                Create a Team
              </button>
            </div>
          </div>
        )}

        {section === "GROUPS" && (
          <GroupsSection onCreateGroup={() => setShowCreateGroup(true)} />
        )}
        {section === "PAGES" && <PagesSection />}
        {section === "HASHTAGS" && <HashtagsSection />}
      </div>

      {/* Modals */}
      <ProfilePreviewModal
        user={profileUser}
        open={!!profileUser}
        onClose={() => {
          setProfileUser(null);
          setProfileConn(null);
        }}
        showAccept={!!profileConn}
        onAccept={profileConn ? () => handleAccept(profileConn._id) : undefined}
        onDecline={
          profileConn ? () => handleDecline(profileConn._id) : undefined
        }
      />
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        connections={connections}
      />
      <CreateTeammatesModal
        open={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        connections={connections}
      />
    </div>
  );
}
