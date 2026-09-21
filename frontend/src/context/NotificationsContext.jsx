import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadChats, setUnreadChats] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setPendingRequests([]);
      setUnreadChats([]);
      return;
    }
    try {
      const { data } = await api.get("/notifications/summary");
      setPendingRequests(data.data.pendingRequests || []);
      setUnreadChats(data.data.unreadChats || []);
    } catch {}
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [user, refresh]);

  const hasUnreadChat = (bookingId) =>
    unreadChats.some((c) => String(c.bookingId) === String(bookingId));

  const totalCount = pendingRequests.length + unreadChats.length;

  return (
    <NotificationsContext.Provider value={{
      pendingRequests, unreadChats, totalCount, hasUnreadChat, refresh,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
