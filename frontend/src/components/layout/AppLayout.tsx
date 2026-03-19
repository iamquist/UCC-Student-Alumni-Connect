import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuthStore } from "@/store/authStore";
import { useChatStore, useNotificationStore } from "@/store/chatStore";
import { socketService } from "@/services/socket";

export default function AppLayout() {
  const { isAuthenticated, fetchCurrentUser, isLoading } = useAuthStore();
  const { addMessage, setTyping, setUserOnline, loadConversations } =
    useChatStore();
  const { addNotification, loadNotifications } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load initial data with error handling
    Promise.all([
      loadConversations().catch((err) =>
        console.error("Failed to load conversations:", err),
      ),
      loadNotifications().catch((err) =>
        console.error("Failed to load notifications:", err),
      ),
    ]);

    // Socket listeners
    const unsubMsg = socketService.onNewMessage((msg) => {
      addMessage(msg);
    });
    const unsubTypingStart = socketService.onTypingStart(
      ({ conversationId, userId }) => {
        setTyping(conversationId, userId, true);
      },
    );
    const unsubTypingStop = socketService.onTypingStop(
      ({ conversationId, userId }) => {
        setTyping(conversationId, userId, false);
      },
    );
    const unsubNotif = socketService.onNewNotification((notif) => {
      addNotification(notif);
    });
    const unsubOnline = socketService.onUserOnline(({ userId }) => {
      setUserOnline(userId, true);
    });
    const unsubOffline = socketService.onUserOffline(({ userId }) => {
      setUserOnline(userId, false);
    });

    return () => {
      unsubMsg();
      unsubTypingStart();
      unsubTypingStop();
      unsubNotif();
      unsubOnline();
      unsubOffline();
    };
  }, [
    isAuthenticated,
    addMessage,
    setTyping,
    addNotification,
    setUserOnline,
    loadConversations,
    loadNotifications,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 relative">
            <svg viewBox="0 0 32 32" fill="none" className="animate-pulse">
              <path
                d="M16 2L4 8v6c0 8 5.5 14.5 12 16 6.5-1.5 12-8 12-16V8L16 2z"
                stroke="#e8457a"
                strokeWidth="2"
              />
              <circle cx="8" cy="16" r="3" fill="#ff6b9d" opacity="0.6" />
              <circle cx="24" cy="16" r="3" fill="#e8457a" opacity="0.6" />
              <circle cx="16" cy="24" r="3" fill="#c0325e" opacity="0.6" />
            </svg>
          </div>
          <p
            className="text-sm text-gray-400"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Loading UniAlum…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-brand-gray">
      <Navbar />
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}
