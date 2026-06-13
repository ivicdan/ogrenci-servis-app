"use client";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export default function SoforBildirimler() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    const { data } = await apiFetch<Notification[]>("/api/sofor/bildirimler");
    if (data) setNotifications(data);
  }

  async function markAllRead() {
    await apiFetch("/api/sofor/bildirimler", { method: "PUT" });
    toast.success("Tümü okundu olarak işaretlendi.");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.read) return;
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await apiFetch(`/api/sofor/bildirimler/${id}`, { method: "PATCH" });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bildirimler</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} okunmamış</p>}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> Tümünü Oku
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Bildirim yok</p>
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
              !n.read ? "border-green-200 bg-green-50 hover:bg-green-100" : "border-gray-100 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-2">
              {!n.read && <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString("tr-TR", {
                    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
