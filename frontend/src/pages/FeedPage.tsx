import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { postsApi, uploadApi, connectionsApi } from "@/services/api";
import type { Post, Comment } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import {
  formatRelativeTime,
  getUserDisplayName,
  formatFileSize,
  cn,
} from "@/utils";
import toast from "react-hot-toast";

// ── Article Composer ──────────────────────────────────────────
function ArticleComposer({
  open,
  onClose,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: (p: Post) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      const post = await postsApi.createPost({
        content: `**${title.trim()}**\n\n${content.trim()}`,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onPublish(post);
      toast.success("Article published!");
      onClose();
      setTitle("");
      setContent("");
      setTags("");
    } catch {
      toast.error("Failed to publish");
    }
    setSubmitting(false);
  };
  return (
    <Modal open={open} onClose={onClose} title="Write New Article" size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field font-semibold"
            placeholder="Article headline…"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="input-field resize-none"
            placeholder="Share your knowledge…"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {content.length} chars
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Tags
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input-field"
            placeholder="design, career, tech"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? "Publishing…" : "Publish Article"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Post Composer ──────────────────────────────────────────────
function PostComposer({
  onPostCreated,
  onOpenArticle,
}: {
  onPostCreated: (p: Post) => void;
  onOpenArticle: () => void;
}) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<
    Array<{ file: File; preview?: string; url?: string; uploading?: boolean }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isImage: boolean,
  ) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const preview = isImage ? URL.createObjectURL(file) : undefined;
      setAttachments((p) => [...p, { file, preview, uploading: true }]);
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

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) return;
    if (attachments.some((a) => a.uploading)) {
      toast.error("Please wait for uploads to finish");
      return;
    }
    setSubmitting(true);
    try {
      const images = attachments
        .filter((a) => a.preview && a.url)
        .map((a) => a.url!);
      const files = attachments
        .filter((a) => !a.preview && a.url)
        .map((a) => ({
          name: a.file.name,
          url: a.url!,
          size: a.file.size,
          type: a.file.type,
        }));
      const post = await postsApi.createPost({
        content,
        images,
        ...(files.length ? { files } : {}),
      } as Parameters<typeof postsApi.createPost>[0]);
      onPostCreated(post);
      setContent("");
      setAttachments([]);
      toast.success("Post published!");
    } catch {
      toast.error("Failed to post");
    }
    setSubmitting(false);
  };

  return (
    <div className="card p-4 mb-4">
      <p
        className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        NEW POST
      </p>
      <div className="flex items-start gap-3">
        <Avatar user={user || undefined} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={content || attachments.length > 0 ? 3 : 2}
            className="w-full text-sm text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none resize-none leading-relaxed"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          />
          {attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="relative group rounded-lg overflow-hidden border border-gray-100"
                >
                  {att.preview ? (
                    <img
                      src={att.preview}
                      alt=""
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50">
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {att.file.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {formatFileSize(att.file.size)}
                        </p>
                      </div>
                    </div>
                  )}
                  {att.uploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={() =>
                      setAttachments((p) =>
                        p.filter((a) => a.file !== att.file),
                      )
                    }
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, true)}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, false)}
            />
            {[
              {
                icon: (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                ),
                label: "Image",
                action: () => imgRef.current?.click(),
              },
              {
                icon: (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                ),
                label: "File",
                action: () => fileRef.current?.click(),
              },
              {
                icon: (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                ),
                label: "Article",
                action: onOpenArticle,
              },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                title={btn.label}
                className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
              >
                {btn.icon}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={handleSubmit}
              disabled={
                (!content.trim() && attachments.length === 0) || submitting
              }
              className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Post Card ──────────────────────────────────────────────────
function PostCard({
  post,
  onLike,
  onComment,
  onDelete,
}: {
  post: Post;
  onLike: (id: string) => void;
  onComment: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuthStore();
  const { createConversation, setActiveConversation } = useChatStore();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readArticle, setReadArticle] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const liked = user ? post.likes.includes(user._id) : false;
  const isOwn = user?._id === post.author._id;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(
      post._id,
      replyTo
        ? `@${getUserDisplayName(replyTo.author)} ${commentText}`
        : commentText,
    );
    setCommentText("");
    setReplyTo(null);
  };

  const handleMessage = async () => {
    try {
      const conv = await createConversation(post.author._id);
      setActiveConversation(conv._id);
      navigate("/chat");
    } catch {
      toast.error("Could not open chat");
    }
    setUserMenuOpen(false);
  };

  const handleConnect = async () => {
    try {
      await connectionsApi.sendRequest(
        post.author._id,
        "Hi, I'd like to connect!",
      );
      toast.success("Connection request sent!");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Could not connect");
    }
    setUserMenuOpen(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/feed?post=${post._id}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Article detection
  const isArticle =
    post.content.startsWith("**") && post.content.includes("\n\n");
  const titleLine = isArticle ? post.content.split("\n")[0].slice(2, -2) : null;
  const articleBody = isArticle
    ? post.content.split("\n\n").slice(1).join("\n\n")
    : post.content;
  const preview = articleBody.slice(0, 220);

  return (
    <article className="post-card animate-fade-in">
      {post.tags && post.tags.length > 0 && (
        <p className="text-[11px] text-gray-400 mb-2.5">
          {post.tags.slice(0, 2).join(" · ")}
        </p>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar user={post.author} size="md" />
          <div>
            <button
              onClick={() => navigate(`/profile/${post.author._id}`)}
              className="text-sm font-semibold text-gray-900 hover:text-brand-blue transition-colors text-left"
            >
              {getUserDisplayName(post.author)}
            </button>
            <p className="text-xs text-gray-400">
              {post.author.bio?.slice(0, 40) || post.author.role} ·{" "}
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-float border border-gray-100 z-30 py-1.5 animate-fade-in">
              <button
                onClick={() => {
                  navigate(`/profile/${post.author._id}`);
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
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                View Profile
              </button>
              {!isOwn && (
                <>
                  <button
                    onClick={handleConnect}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Connect
                  </button>
                  <button
                    onClick={handleMessage}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Send Message
                  </button>
                </>
              )}
              {isOwn && (
                <button
                  onClick={() => {
                    onDelete(post._id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
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
                  Delete Post
                </button>
              )}
              {!isOwn && (
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-50">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        {isArticle && titleLine ? (
          <div>
            <h3
              className="font-bold text-gray-900 mb-1"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              {titleLine}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {preview}
              {articleBody.length > 220 && "…"}
            </p>
            {articleBody.length > 220 && !readArticle && (
              <button
                onClick={() => setReadArticle(true)}
                className="text-xs font-semibold text-brand-blue mt-1 hover:underline"
              >
                READ MORE
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div
          className={cn(
            "grid gap-1.5 mb-3 rounded-xl overflow-hidden",
            post.images.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {post.images.slice(0, 4).map((img, i) => (
            <div key={i} className="relative">
              <img
                src={img}
                alt=""
                className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => window.open(img, "_blank")}
              />
              {i === 3 && post.images!.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    +{post.images!.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Files */}
      {post.files && post.files.length > 0 && (
        <div className="mb-3 space-y-2">
          {post.files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-gray-200"
            >
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {file.type?.split("/")[1]?.toUpperCase() || "FILE"} ·{" "}
                  {formatFileSize(file.size)}
                </p>
              </div>
              <a
                href={file.url}
                download={file.name}
                target="_blank"
                rel="noreferrer"
                title="Download"
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="8,17 12,21 16,17" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-5">
          <button
            onClick={() => onLike(post._id)}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-all active:scale-110",
              liked ? "text-brand-blue" : "text-gray-400 hover:text-gray-600",
            )}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
              <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
            {post.likes.length}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {post.comments.length}
          </button>
        </div>
        <button
          onClick={() => setShareOpen(!shareOpen)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider transition-colors"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          <svg
            className="w-4 h-4"
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
          Share
        </button>
      </div>

      {/* Share panel */}
      {shareOpen && (
        <div className="mt-3 pt-3 border-t border-gray-50 animate-fade-in">
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <input
              readOnly
              value={`${window.location.origin}/feed?post=${post._id}`}
              className="flex-1 text-xs text-gray-500 bg-transparent outline-none"
            />
            <button
              onClick={copyLink}
              className={cn(
                "text-xs font-bold px-3 py-1 rounded-lg transition-colors",
                copied
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300",
              )}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-50 space-y-2.5">
          {post.comments.slice(-5).map((c) => (
            <div key={c._id} className="flex items-start gap-2.5 group">
              <Avatar user={c.author} size="xs" />
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-gray-800">
                  {getUserDisplayName(c.author)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  {c.content}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-gray-400">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                  <button
                    onClick={() => setReplyTo(c)}
                    className="text-[10px] font-semibold text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
          {replyTo && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-xs text-brand-blue border border-blue-100">
              <span>
                Replying to{" "}
                <strong>{getUserDisplayName(replyTo.author)}</strong>
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-auto font-bold hover:text-primary-700"
              >
                ×
              </button>
            </div>
          )}
          <form onSubmit={submitComment} className="flex items-center gap-2">
            <Avatar
              user={useAuthStore.getState().user || undefined}
              size="xs"
            />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                replyTo
                  ? `Reply to ${getUserDisplayName(replyTo.author)}…`
                  : "Write a comment…"
              }
              className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-2 outline-none focus:border-gray-300"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2 bg-brand-blue text-white rounded-full hover:bg-primary-700 disabled:opacity-40 transition-colors"
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
          </form>
        </div>
      )}

      {/* Article full reader */}
      <Modal
        open={readArticle}
        onClose={() => setReadArticle(false)}
        title={titleLine || "Article"}
        size="lg"
      >
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <Avatar user={post.author} size="sm" />
          <div>
            <p className="text-sm font-semibold">
              {getUserDisplayName(post.author)}
            </p>
            <p className="text-xs text-gray-400">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {articleBody}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100">
            {post.tags.map((t) => (
              <span key={t} className="chip">
                #{t}
              </span>
            ))}
          </div>
        )}
      </Modal>
    </article>
  );
}

// ── Sidebar ────────────────────────────────────────────────────
function FeedSidebar({ onWriteArticle }: { onWriteArticle: () => void }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [showMoreGroups, setShowMoreGroups] = useState(false);
  const [showAllHashtags, setShowAllHashtags] = useState(false);
  const [articleModal, setArticleModal] = useState<{
    title: string;
    views: string;
    content: string;
  } | null>(null);
  const [showMoreArticles, setShowMoreArticles] = useState(false);

  const groups = [];
  const hashtags = [];
  const articles = [
    {
      title: [],
      views: [],
      content: [],
    },
  ];
  const visibleArticles = showMoreArticles ? articles : articles.slice(0, 3);

  return (
    <>
      <aside className="space-y-4">
        <div className="card overflow-hidden">
          <div
            className="h-20 bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer"
            onClick={() => navigate("/profile")}
          />
          <div className="px-4 pb-4">
            <div
              className="-mt-8 mb-3 cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              <Avatar
                user={user || undefined}
                size="lg"
                className="ring-2 ring-white"
              />
            </div>
            <p
              className="font-semibold text-gray-900 text-sm cursor-pointer hover:text-brand-blue"
              onClick={() => navigate("/profile")}
            >
              {getUserDisplayName(user)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
              {user?.bio || "Complete your profile"}
            </p>
            <button
              onClick={onWriteArticle}
              className="btn-primary w-full mt-3 text-xs py-2"
            >
              WRITE NEW ARTICLE
            </button>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">My Groups</p>
            <button
              onClick={() => setGroupsOpen(true)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider"
            >
              EDIT LIST
            </button>
          </div>
          <div className="space-y-3">
            {groups.slice(0, 3).map((g, i) => (
              <div
                key={i}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex-shrink-0 ${["bg-blue-500", "bg-purple-500", "bg-green-500"][i]}`}
                />
                <p className="text-xs font-medium text-gray-700 group-hover:text-brand-blue transition-colors">
                  {g}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setGroupsOpen(true)}
            className="text-xs text-gray-400 hover:text-gray-600 mt-3"
          >
            SHOW ALL ({groups.length})
          </button>
        </div>

        <div className="card p-4">
          <p className="section-title mb-3">Followed Hashtags</p>
          <div className="flex flex-wrap gap-2">
            {(showAllHashtags ? hashtags : hashtags.slice(0, 8)).map((tag) => (
              <span
                key={tag}
                className="chip cursor-pointer hover:bg-blue-50 hover:text-brand-blue hover:border-blue-200 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
          {!showAllHashtags && (
            <button
              onClick={() => setShowAllHashtags(true)}
              className="text-xs text-brand-blue mt-2 hover:underline"
            >
              Show all ({hashtags.length})
            </button>
          )}
        </div>

        <div className="card p-4">
          <p className="section-title mb-3">Trending Articles</p>
          <div className="space-y-3">
            {visibleArticles.map((a, i) => (
              <button
                key={i}
                onClick={() => setArticleModal(a)}
                className="w-full flex items-center gap-3 group text-left"
              >
                <div className="w-10 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800 group-hover:text-brand-blue transition-colors leading-tight">
                    {a.title}
                  </p>
                  <p className="text-[11px] text-gray-400">{a.views}</p>
                </div>
              </button>
            ))}
          </div>
          {!showMoreArticles && articles.length > 3 && (
            <button
              onClick={() => setShowMoreArticles(true)}
              className="w-full text-xs font-semibold text-brand-blue mt-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
            >
              VIEW MORE ({articles.length - 3})
            </button>
          )}
        </div>
      </aside>

      {/* Groups modal */}
      <Modal
        open={groupsOpen}
        onClose={() => setGroupsOpen(false)}
        title="My Groups"
      >
        <div className="space-y-2">
          {(showMoreGroups ? groups : groups.slice(0, 5)).map((g, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-blue-500", "bg-teal-500", "bg-red-500", "bg-indigo-500"][i % 8]}`}
              >
                {g[0]}
              </div>
              <p className="text-sm font-medium text-gray-800 flex-1">{g}</p>
              <button className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 hover:bg-red-50 rounded-lg">
                Leave
              </button>
            </div>
          ))}
          {!showMoreGroups && groups.length > 5 && (
            <button
              onClick={() => setShowMoreGroups(true)}
              className="w-full text-xs font-semibold text-brand-blue py-2 hover:bg-blue-50 rounded-xl"
            >
              Show {groups.length - 5} more
            </button>
          )}
        </div>
      </Modal>

      {/* Article reader */}
      <Modal
        open={!!articleModal}
        onClose={() => setArticleModal(null)}
        title={articleModal?.title || ""}
        size="lg"
      >
        {articleModal && (
          <>
            <p className="text-xs text-gray-400 mb-4">
              📊 {articleModal.views}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {articleModal.content}
            </p>
          </>
        )}
      </Modal>
    </>
  );
}

// ── Feed Page ──────────────────────────────────────────────────
export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<"trending" | "latest" | "top" | "following">(
    "trending",
  );
  const [sortOpen, setSortOpen] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const SORT_OPTIONS = [
    { value: "trending", label: "Trending" },
    { value: "latest", label: "Latest" },
    { value: "top", label: "Top Rated" },
    { value: "following", label: "Following" },
  ] as const;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchPosts = useCallback(
    async (p = 1, reset = false) => {
      setLoading(true);
      try {
        const result = await postsApi.getPosts({ page: p, limit: 10, sort });
        // Handle both direct array and paginated response structures
        const postsArray = Array.isArray(result) ? result : result?.data || [];
        setPosts((prev) => (reset ? postsArray : [...prev, ...postsArray]));

        if (result && typeof result === "object" && "pagination" in result) {
          setHasMore(result.pagination?.hasNext ?? false);
        } else {
          setHasMore(false);
        }
        setPage(p);
      } catch (err) {
        console.error("Failed to load posts:", err);
        toast.error("Failed to load posts");
        if (reset) setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [sort],
  );

  useEffect(() => {
    fetchPosts(1, true);
  }, [sort]);

  const handleLike = async (postId: string) => {
    try {
      const result = await postsApi.likePost(postId);
      const { liked, count } = result;
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likes: liked
                  ? [...(p.likes || []), "x"]
                  : (p.likes || []).slice(0, count),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Could not like post:", err);
      toast.error("Could not like post");
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      const c = await postsApi.commentOnPost(postId, content);
      if (!c) {
        toast.error("Failed to post comment");
        return;
      }
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: [...(p.comments || []), c] } : p,
        ),
      );
    } catch (err) {
      console.error("Could not comment:", err);
      toast.error("Could not post comment");
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await postsApi.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success("Post deleted");
    } catch (err) {
      console.error("Could not delete post:", err);
      toast.error("Could not delete post");
    }
  };

  return (
    <div className="page-container py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <PostComposer
          onPostCreated={(post) => setPosts((prev) => [post, ...prev])}
          onOpenArticle={() => setShowArticle(true)}
        />
        <div
          className="flex items-center justify-center mb-4 relative"
          ref={sortRef}
        >
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider hover:text-gray-900 transition-colors"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            SORT BY: {SORT_OPTIONS.find((s) => s.value === sort)?.label}
            <svg
              className={cn(
                "w-3 h-3 transition-transform",
                sortOpen && "rotate-180",
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {sortOpen && (
            <div className="absolute top-full mt-2 bg-white rounded-xl shadow-float border border-gray-100 py-1.5 w-40 z-30 animate-fade-in">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSort(opt.value);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-xs font-medium text-left transition-colors",
                    sort === opt.value
                      ? "text-brand-blue bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-2.5 w-24 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && !loading && (
              <div className="flex justify-center py-4">
                <button
                  onClick={() => fetchPosts(page + 1)}
                  className="btn-secondary text-xs"
                >
                  Load more
                </button>
              </div>
            )}
            {loading && posts.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
      <FeedSidebar onWriteArticle={() => setShowArticle(true)} />
      <ArticleComposer
        open={showArticle}
        onClose={() => setShowArticle(false)}
        onPublish={(post) => setPosts((prev) => [post, ...prev])}
      />
    </div>
  );
}
