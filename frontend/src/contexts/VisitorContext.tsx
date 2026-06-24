import React, { createContext, useContext, useEffect, useState } from 'react';
import { visitorApi } from '@/api/visitor';
import { analyticsApi } from '@/api/analytics';

interface VisitorContextType {
  sessionId: string;
  isActivated: boolean;
  expiresAt: string | null;
  bookmarks: number[];
  loading: boolean;
  refreshStatus: () => Promise<void>;
  toggleBookmark: (poiId: number) => Promise<void>;
}

const VisitorContext = createContext<VisitorContextType | null>(null);

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState('');
  const [isActivated, setIsActivated] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sessId = localStorage.getItem('vk_session_id');
    if (!sessId) {
      sessId = `vk_sess_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
      localStorage.setItem('vk_session_id', sessId);
    }
    setSessionId(sessId);
  }, []);

  const refreshStatus = async () => {
    if (!sessionId) return;
    try {
      const { data } = await visitorApi.getStatus(sessionId);
      setIsActivated(data.isActivated);
      setExpiresAt(data.expiresAt);
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      console.error('Failed to load visitor status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      refreshStatus();
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    // Send initial heartbeat
    analyticsApi.ping(sessionId).catch((err) => {
      console.warn('Failed to send initial heartbeat:', err);
    });

    const interval = setInterval(() => {
      analyticsApi.ping(sessionId).catch((err) => {
        console.warn('Failed to send heartbeat:', err);
      });
    }, 5000); // ping every 5 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  const toggleBookmark = async (poiId: number) => {
    if (!sessionId) return;
    const isBookmarked = bookmarks.includes(poiId);
    try {
      if (isBookmarked) {
        await visitorApi.unbookmark(sessionId, poiId);
        setBookmarks((prev) => prev.filter((id) => id !== poiId));
      } else {
        await visitorApi.bookmark(sessionId, poiId);
        setBookmarks((prev) => [...prev, poiId]);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  return (
    <VisitorContext.Provider
      value={{
        sessionId,
        isActivated,
        expiresAt,
        bookmarks,
        loading,
        refreshStatus,
        toggleBookmark,
      }}
    >
      {children}
    </VisitorContext.Provider>
  );
}

export function useVisitor() {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitor must be used within VisitorProvider');
  }
  return context;
}
