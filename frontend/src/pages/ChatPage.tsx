import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { socketService } from "@/services/socket";
import { connectionsApi, uploadApi, messagesApi } from "@/services/api";
import type { User, Message } from "@/types";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import { getUserDisplayName, formatDate, cn } from "@/utils";
import toast from "react-hot-toast";

// ── Start New Chat Modal ──────────────────────────────────────
function StartChatModal({
  open,
  onClose,
  onStartChat,
}: {
  open: boolean;
  onClose: () => void;
  onStartChat: (user: User) => void;
}) {
  const [connections, setConnections] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const result = await connectionsApi.getConnections();
        // Handle both direct array and paginated response structures
        const connectionsArray = Array.isArray(result)
          ? result
          : result?.data || [];
        setConnections(connectionsArray);
      } catch (err) {
        console.error("Failed to load connections:", err);
        toast.error("Could not load connections");
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const filtered = connections.filter(
    (c) =>
      getUserDisplayName(c).toLowerCase().includes(query.toLowerCase()) ||
      c.bio?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Modal open={open} onClose={onClose} title="Start New Chat" size="md">
      <div className="space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search connections…"
          className="input-field"
          autoFocus
        />
        <div className="max-h-72 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((u) => (
              <button
                key={u._id}
                onClick={() => {
                  onStartChat(u);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
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
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">
                {query
                  ? "No connections match your search"
                  : "No connections yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Shared Media Panel ─────────────────────────────────────────
function SharedMediaPanel({ messages }: { messages: Message[] }) {
  const mediaMessages = messages.filter(
    (m) => m.attachments && m.attachments.length > 0,
  );
  return (
    <div className="p-4">
      <p
        className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        SHARED MEDIA ({mediaMessages.length})
      </p>
      {mediaMessages.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {mediaMessages.slice(0, 12).map((m, i) =>
            m.attachments?.map((att, j) => (
              <a
                key={`${i}-${j}`}
                href={att}
                target="_blank"
                rel="noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={att}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </a>
            )),
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No shared media yet</p>
      )}
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────────
function MessageBubble({
  msg,
  isMine,
  showAvatar,
  onReply,
  isRead,
  conversationMessages,
}: {
  msg: Message;
  isMine: boolean;
  showAvatar: boolean;
  onReply: (msg: Message) => void;
  isRead: boolean;
  conversationMessages: Message[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const replyTo = msg.content.startsWith("@msgId:")
    ? conversationMessages.find((m) => {
        const match = msg.content.match(/^@msgId:(\S+)\s/);
        return match && match[1] === m._id;
      })
    : null;

  // Extract display content without the @msgId: prefix
  const displayContent = msg.content.startsWith("@msgId:")
    ? msg.content.replace(/^@msgId:\S+\s+[^:]+:\s*/, "")
    : msg.content;

  // Determine if this msg got a reply after it
  const hasReplyAfter = conversationMessages.some((m) =>
    m.content.startsWith(`@${getUserDisplayName(msg.sender)} `),
  );

  const tickColor = isMine
    ? isRead || hasReplyAfter
      ? "text-blue-300"
      : "text-gray-400"
    : "text-gray-400";
  const showDoubleTick = isMine && (isRead || hasReplyAfter);

  return (
    <div
      className={cn(
        "flex items-end gap-2 mb-2 group",
        isMine && "flex-row-reverse",
      )}
    >
      {!isMine && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && <Avatar user={msg.sender} size="sm" />}
        </div>
      )}
      <div
        className={cn(
          "max-w-xs lg:max-w-md flex flex-col gap-0.5",
          isMine ? "items-end" : "items-start",
        )}
      >
        {replyTo && (
          <div
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border-l-2 border-brand-blue mb-1 max-w-xs",
              isMine
                ? "bg-gray-100 text-gray-500 ml-6"
                : "bg-gray-50 text-gray-500 mr-6",
            )}
          >
            <p className="font-semibold text-brand-blue text-[10px]">
              {getUserDisplayName(replyTo.sender)}
            </p>
            <p className="truncate">
              {replyTo.content.startsWith("@msgId:")
                ? replyTo.content.replace(/^@msgId:\S+\s+[^:]+:\s*/, "")
                : replyTo.content.slice(0, 60)}
            </p>
          </div>
        )}
        <div
          className={cn(
            "relative",
            isMine
              ? "msg-bubble-sent px-4 py-2.5"
              : "msg-bubble-received px-4 py-2.5 shadow-sm",
          )}
        >
          <p className="text-sm leading-relaxed">{displayContent}</p>
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {msg.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={att}
                    alt="attachment"
                    className="max-w-full rounded-lg max-h-40 object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                </a>
              ))}
            </div>
          )}
          {/* Context menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded",
              isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full",
            )}
          >
            <svg
              className="w-3 h-3 text-gray-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div
              className={cn(
                "absolute bottom-full mb-1 bg-white rounded-xl shadow-float border border-gray-100 py-1 z-30 w-36",
                isMine ? "right-0" : "left-0",
              )}
            >
              <button
                onClick={() => {
                  onReply(msg);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="9,17 4,12 9,7" />
                  <path d="M20 18v-2a4 4 0 00-4-4H4" />
                </svg>
                Reply
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(msg.content);
                  toast.success("Copied");
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy
              </button>
              {isMine && (
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-50">
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
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-1",
            isMine && "flex-row-reverse",
          )}
        >
          {isMine && (
            <svg
              className={cn("w-3 h-3", tickColor)}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              {showDoubleTick ? (
                <>
                  <path d="M1 12l5 5L18 4" />
                  <path d="M7 12l5 5 9-9" />
                </>
              ) : (
                <path d="M4 12l5 5L20 6" />
              )}
            </svg>
          )}
          <span className="text-[10px] text-gray-400">
            {formatDate(msg.createdAt, "time")}
          </span>
        </div>
      </div>
      {isMine && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}

// ── Chat Page ─────────────────────────────────────────────────
export default function ChatPage() {
  const { user: currentUser } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    typingUsers,
    onlineUsers,
    loadConversations,
    setActiveConversation,
    loadMessages,
    sendMessage,
    createConversation,
  } = useChatStore();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [startChatOpen, setStartChatOpen] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{ file: File; url?: string; uploading?: boolean }>
  >([]);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c._id === activeConversationId);
  const activeMessages = activeConversationId
    ? messages[activeConversationId] || []
    : [];
  const otherParticipant = activeConv?.participants.find(
    (p) => p._id !== currentUser?._id,
  );
  const typingList = activeConversationId
    ? typingUsers[activeConversationId] || []
    : [];
  const isOtherOnline = otherParticipant
    ? onlineUsers.has(otherParticipant._id)
    : false;

  useEffect(() => {
    loadConversations();
  }, []);
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, typingList]);

  const handleTyping = (value: string) => {
    setInput(value);
    if (!activeConversationId) return;
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(activeConversationId);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      if (activeConversationId) socketService.stopTyping(activeConversationId);
    }, 1500);
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      setAttachments((p) => [...p, { file, uploading: true }]);
      try {
        const { url } = await uploadApi.uploadImage(file);
        setAttachments((p) =>
          p.map((a) => (a.file === file ? { ...a, url, uploading: false } : a)),
        );
      } catch {
        setAttachments((p) => p.filter((a) => a.file !== file));
        toast.error(`Upload failed: ${file.name}`);
      }
    }
    e.target.value = "";
  };

  const handleSend = async () => {
    if (
      (!input.trim() && attachments.length === 0) ||
      !activeConversationId ||
      sending
    )
      return;
    if (attachments.some((a) => a.uploading)) {
      toast.error("Please wait for uploads");
      return;
    }
    const content = replyTo
      ? `@msgId:${replyTo._id} ${getUserDisplayName(replyTo.sender)}: ${input.trim()}`
      : input.trim();
    const urls = attachments.filter((a) => a.url).map((a) => a.url!);
    setSending(true);
    clearTimeout(typingTimer.current);
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(activeConversationId);
    }
    try {
      const msg = await messagesApi.sendMessage(
        activeConversationId,
        content,
        urls,
      );
      useChatStore.getState().addMessage(msg);
      setInput("");
      setAttachments([]);
      setReplyTo(null);
    } catch {
      toast.error("Failed to send");
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartChat = async (user: User) => {
    try {
      const conv = await createConversation(user._id);
      setActiveConversation(conv._id);
    } catch {
      toast.error("Could not start chat");
    }
  };

  // Group messages by date
  const grouped = activeMessages.reduce<{ date: string; msgs: Message[] }[]>(
    (acc, msg) => {
      const d = new Date(msg.createdAt).toDateString();
      const last = acc[acc.length - 1];
      if (last && last.date === d) last.msgs.push(msg);
      else acc.push({ date: d, msgs: [msg] });
      return acc;
    },
    [],
  );

  return (
    <div className="h-[calc(100vh-56px)] flex bg-white">
      {/* Conversations list */}
      <aside className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-4 py-3.5 border-b border-gray-100">
          <p
            className="text-xs font-bold uppercase tracking-widest text-gray-500"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            CHATS
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-gray-400">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find(
                (p) => p._id !== currentUser?._id,
              );
              const isActive = conv._id === activeConversationId;
              const isOnline = other ? onlineUsers.has(other._id) : false;
              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveConversation(conv._id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left",
                    isActive
                      ? "bg-blue-50 border-r-2 border-brand-blue"
                      : "hover:bg-gray-50",
                  )}
                >
                  <Avatar
                    user={other || undefined}
                    size="md"
                    online={isOnline}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold truncate",
                        isActive ? "text-brand-blue" : "text-gray-900",
                      )}
                    >
                      {other ? getUserDisplayName(other) : "Group Chat"}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {conv.lastMessage
                        ? (conv.lastMessage.sender._id === currentUser?._id
                            ? "✓ "
                            : "") +
                          (conv.lastMessage.content.startsWith("@msgId:")
                            ? conv.lastMessage.content.replace(
                                /^@msgId:\S+\s+[^:]+:\s*/,
                                "",
                              )
                            : conv.lastMessage.content)
                        : "No messages yet"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {conv.lastMessage && (
                      <span className="text-[10px] text-gray-300">
                        {formatDate(conv.lastMessage.createdAt, "time")}
                      </span>
                    )}
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="badge-primary">{conv.unreadCount}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setStartChatOpen(true)}
            className="w-full py-2.5 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            START NEW CHAT
          </button>
        </div>
      </aside>

      {/* Chat area */}
      {activeConversationId && activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <p
                className="text-xs font-bold text-gray-400 uppercase tracking-widest"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                CHAT WITH{" "}
                <button
                  onClick={() =>
                    otherParticipant &&
                    navigate(`/profile/${otherParticipant._id}`)
                  }
                  className="text-brand-blue hover:underline"
                >
                  {otherParticipant
                    ? getUserDisplayName(otherParticipant).toUpperCase()
                    : "GROUP"}
                </button>
              </p>
              <span className="text-xs text-gray-400">
                {isOtherOnline ? "● ONLINE" : "LAST ONLINE: 4 HOURS AGO"}
              </span>
            </div>
            <button
              onClick={() => setShowMedia(!showMedia)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              SHARED MEDIA (
              {activeMessages.filter((m) => m.attachments?.length).length})
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto chat-scroll p-6">
              {grouped.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      {new Date(group.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  {group.msgs.map((msg, i) => {
                    const isMine = msg.sender._id === currentUser?._id;
                    const showAvatar =
                      !isMine &&
                      (i === 0 ||
                        group.msgs[i - 1]?.sender._id !== msg.sender._id);
                    const isRead = msg.readBy.length > 1;
                    return (
                      <MessageBubble
                        key={msg._id}
                        msg={msg}
                        isMine={isMine}
                        showAvatar={showAvatar}
                        onReply={setReplyTo}
                        isRead={isRead}
                        conversationMessages={activeMessages}
                      />
                    );
                  })}
                </div>
              ))}
              {typingList.length > 0 && (
                <div className="flex items-end gap-2 mb-2">
                  <Avatar user={otherParticipant || undefined} size="sm" />
                  <div className="msg-bubble-received px-4 py-2.5">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Shared media panel */}
            {showMedia && (
              <div className="w-64 border-l border-gray-100 flex-shrink-0 overflow-y-auto">
                <SharedMediaPanel messages={activeMessages} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-gray-100">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 text-xs text-brand-blue">
                <svg
                  className="w-3 h-3 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="9,17 4,12 9,7" />
                  <path d="M20 18v-2a4 4 0 00-4-4H4" />
                </svg>
                Replying to{" "}
                <strong>{getUserDisplayName(replyTo.sender)}</strong>:{" "}
                {(replyTo.content.startsWith("@msgId:")
                  ? replyTo.content.replace(/^@msgId:\S+\s+[^:]+:\s*/, "")
                  : replyTo.content
                ).slice(0, 50)}
                <button
                  onClick={() => setReplyTo(null)}
                  className="ml-auto font-bold hover:text-primary-700"
                >
                  ×
                </button>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="relative group bg-gray-100 rounded-lg overflow-hidden w-16 h-16"
                  >
                    {att.url ? (
                      <img
                        src={att.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <button
                      onClick={() =>
                        setAttachments((p) =>
                          p.filter((a) => a.file !== att.file),
                        )
                      }
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-gray-300 focus-within:bg-white transition-colors">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={handleFileAttach}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="text-gray-400 hover:text-brand-blue transition-colors flex-shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your message…"
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              />
              <button
                onClick={handleSend}
                disabled={
                  (!input.trim() && attachments.length === 0) || sending
                }
                className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white hover:bg-primary-700 disabled:opacity-40 transition-all active:scale-95 flex-shrink-0"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p
              className="text-sm font-semibold text-gray-900"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Select a conversation
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              or start a new chat
            </p>
            <button
              onClick={() => setStartChatOpen(true)}
              className="btn-primary text-xs"
            >
              Start New Chat
            </button>
          </div>
        </div>
      )}

      <StartChatModal
        open={startChatOpen}
        onClose={() => setStartChatOpen(false)}
        onStartChat={handleStartChat}
      />
    </div>
  );
}
