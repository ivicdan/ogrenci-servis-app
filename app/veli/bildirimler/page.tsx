"use client";
import { useEffect, useState } from "react";
import { Bell, MessageSquare, CheckCheck, Trash2 } from "lucide-react";
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

interface FirmaMessage {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export default function VeliBildirimler() {
  const [tab, setTab] = useState<"bildirimler" | "mesajlar">("bildirimler");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<FirmaMessage[]>([]);

  useEffect(() => {
    loadNotifications();
    loadMessages();
  }, []);

  async function loadNotifications() {
    const { data } = await apiFetch<Notification[]>("/api/veli/bildirimler");
    if (data) setNotifications(data);
  }

  async function loadMessages() {
    const { data } = await apiFetch<FirmaMessage[]>("/api/veli/mesaj");
    if (data) setMessages(data);
  }

  async function markAllNotifsRead() {
    await apiFetch("/api/veli/bildirimler", { method: "PUT" });
    toast.success("Tümü okundu işaretlendi.");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markAllMsgsRead() {
    await apiFetch("/api/veli/mesaj", { method: "PUT" });
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  }

  async function markNotifRead(id: string) {
    const n = notifications.find((n) => n.id === id);
    if (!n || n.read) return;
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await apiFetch(`/api/veli/bildirimler/${id}`, { method: "PATCH" });
  }

  async function deleteNotif(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await apiFetch(`/api/veli/bildirimler/${id}`, { method: "DELETE" });
    toast.success("Bildirim silindi.");
  }

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const unreadMsgs = messages.filter((m) => !m.read).length;

  return (
    <div className="max-w-md mx-auto">
      {/* Sekme başlıkları */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
        <button
          onClick={() => setTab("bildirimler")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "bildirimler" ? "bg-white shadow-sm text-purple-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bell className="w-4 h-4" />
          Bildirimler
          {unreadNotifs > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadNotifs > 9 ? "9+" : unreadNotifs}
            </span>
          )}
        </button>
        <button
          onClick={() => { setTab("mesajlar"); if (unreadMsgs > 0) markAllMsgsRead(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "mesajlar" ? "bg-white shadow-sm text-purple-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Firma Mesajları
          {unreadMsgs > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadMsgs > 9 ? "9+" : unreadMsgs}
            </span>
          )}
        </button>
      </div>

      {/* BİLDİRİMLER sekmesi */}
      {tab === "bildirimler" && (
        <>
          <div className="flex items-center justify-between mb-3">
            {unreadNotifs > 0 && <p className="text-sm text-gray-500">{unreadNotifs} okunmamış</p>}
            {unreadNotifs > 0 && (
              <Button size="sm" variant="outline" onClick={markAllNotifsRead}>
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
                onClick={() => markNotifRead(n.id)}
                className={`bg-white rounded-2xl p-4 border cursor-pointer transition-all ${
                  !n.read ? "border-purple-200 bg-purple-50 hover:bg-purple-100" : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FİRMA MESAJLARI sekmesi */}
      {tab === "mesajlar" && (
        <div className="space-y-2">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Henüz mesaj yok</p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 transition-all"
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mt-0.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{m.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(m.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
