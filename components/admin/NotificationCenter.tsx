"use client";

import { useEffect, useState } from "react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for "real-time" feel without web-sockets if they aren't fully ready
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  if (loading && notifications.length === 0) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔔</span>
          <h2 className="text-[13px] font-bold tracking-widest uppercase text-white">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded-full">
              {unreadCount} NEW
            </span>
          )}
        </div>
      </div>
      <div className="max-h-[300px] overflow-y-auto divide-y divide-white/[0.04]">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[13px] text-gray-700 font-medium tracking-tight">
              All caught up! No notifications yet.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 transition-colors hover:bg-white/[0.02] ${!n.isRead ? "bg-amber-500/[0.02]" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className={`text-[13px] font-bold ${!n.isRead ? "text-amber-400" : "text-gray-400"}`}>
                    {n.title}
                  </h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed font-medium">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-gray-800 font-bold block mt-1 uppercase tracking-tighter">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="text-[10px] font-black text-gray-700 hover:text-white uppercase tracking-widest"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
