import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationsContext = createContext(null);

// Polls a single lightweight summary endpoint every 15s so the navbar bell
// and any per-row chat/request dots across the app stay in sync without
// each page running its own polling loop.
export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadChats, setUnreadChats] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/notifications/summary");
      setPendingRequests(data.data.pendingRequests);
      setUnreadChats(data.data.unreadChats);
    } catch {
      // silent — notifications are best-effort, never block the UI
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPendingRequests([]);
      setUnreadChats([]);
      return;
    }
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [user, refresh]);

  const hasUnreadChat = (bookingId) =>
    unreadChats.some((c) => String(c.bookingId) === String(bookingId));

  const totalCount = pendingRequests.length + unreadChats.length;

  return (
    <NotificationsContext.Provider
      value={{ pendingRequests, unreadChats, totalCount, hasUnreadChat, refresh }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
