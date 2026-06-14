import { useState, useEffect, useCallback, useRef } from 'react';
import { ownerApi } from '@/api/owner';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationItem {
  id: number;
  ownerId: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(pollIntervalMs = 30000) {
  const { isAuthenticated, role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // We only pull notifications if logged in as owner
  const isOwner = isAuthenticated && role === 'owner';

  const fetchUnreadCount = useCallback(async () => {
    if (!isOwner) return;
    try {
      const { data } = await ownerApi.getUnreadCount();
      // data might be a number or { count: number }
      const count = typeof data === 'number' ? data : (data as any).count ?? 0;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  }, [isOwner]);

  const fetchNotifications = useCallback(async () => {
    if (!isOwner) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await ownerApi.getNotifications();
      setNotifications(data);
      // Re-fetch unread count as well to stay sync
      await fetchUnreadCount();
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isOwner, fetchUnreadCount]);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await ownerApi.markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    []
  );

  // Setup polling
  const savedPoll = useRef<() => void>(undefined);
  useEffect(() => {
    savedPoll.current = fetchUnreadCount;
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!isOwner) return;

    // Fetch immediately
    fetchUnreadCount();

    const interval = setInterval(() => {
      if (savedPoll.current) {
        savedPoll.current();
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [isOwner, pollIntervalMs]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
  };
}

export default useNotifications;
