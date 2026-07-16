"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Send, CheckCheck, Trash2, Users, ChevronDown, ChevronUp, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface Message {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readCount: number;
  _count: { recipients: number };
}

interface UnreadUser {
  id: string;
  name: string;
  phone: string;
  type: string;
}

interface UnreadData {
  parents: UnreadUser[];
  drivers: UnreadUser[];
}

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

type Tab = "bildirimler" | "mesajlar";

export default function FirmaMesajlar() {
  const [activeTab, setActiveTab] = useState<Tab>("bildirimler");
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [form, setForm] = useState({ title: "", body: "", target: "all" });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unreadData, setUnreadData] = useState<Record<string, UnreadData>>({});
  const [loadingUnread, setLoadingUnread] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
    loadNotifications();
  }, []);

  async function loadMessages() {
    const { data } = await apiFetch<Message[]>("/api/firma/mesaj");
    if (data) setMessages(data);
  }

  async function loadNotifications() {
    const { data } = await apiFetch<Notification[]>("/api/firma/bildirimler");
    if (data) setNotifications(data);
  }

  async function markAllRead() {
    await apiFetch("/api/firma/bildirimler", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await apiFetch("/api/firma/mesaj", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Mesaj gönderildi!");
    setOpen(false);
    setForm({ title: "", body: "", target: "all" });
    loadMessages();
  }

  async function deleteMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const { error } = await apiFetch(`/api/firma/mesaj/${id}`, { method: "DELETE" });
    if (error) {
      toast.error(error);
      loadMessages();
    } else {
      toast.success("Mesaj silindi.");
    }
  }

  async function toggleUnread(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (unreadData[id]) return;
    setLoadingUnread(id);
    const { data } = await apiFetch<UnreadData>(`/api/firma/mesaj/${id}/okunmayanlar`);
    if (data) setUnreadData((prev) => ({ ...prev, [id]: data }));
    setLoadingUnread(null);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dakika önce`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} saat önce`;
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  }

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Mesaj / Bildirim</h1>
        {activeTab === "mesajlar" && (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setOpen(true)}>
            <Send className="w-4 h-4 mr-1" /> Mesaj Gönder
          </Button>
        )}
        {activeTab === "bildirimler" && unreadNotifCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            Tümünü okundu işaretle
          </button>
        )}
      </div>

      {/* Sekmeler */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("bildirimler")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "bildirimler"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bell className="w-4 h-4" />
          Bildirimler
          {unreadNotifCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {unreadNotifCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mesajlar")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "mesajlar"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Mesajlar
        </button>
      </div>

      {/* Bildirimler */}
      {activeTab === "bildirimler" && (
        <div className="space-y-2">
          {notifications.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <BellOff className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Bildirim yok</p>
            </div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-4 border transition-colors ${
                n.read
                  ? "bg-white border-gray-100"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.read ? "bg-gray-100" : "bg-blue-100"}`}>
                  <Bell className={`w-4 h-4 ${n.read ? "text-gray-400" : "text-blue-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mesajlar */}
      {activeTab === "mesajlar" && (
        <>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Yeni Mesaj</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <Label>Hedef Kitle</Label>
                  <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v ?? "" })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü (Şoför + Veli)</SelectItem>
                      <SelectItem value="drivers">Sadece Şoförler</SelectItem>
                      <SelectItem value="parents">Tüm Veliler</SelectItem>
                      <SelectItem value="parents_anaokulu">Anaokulu Velileri</SelectItem>
                      <SelectItem value="parents_ilkokul">İlkokul Velileri</SelectItem>
                      <SelectItem value="parents_ortaokul">Ortaokul Velileri</SelectItem>
                      <SelectItem value="parents_lise">Lise Velileri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Başlık</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1" />
                </div>
                <div>
                  <Label>Mesaj</Label>
                  <Textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    required rows={4} className="mt-1 resize-none"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Henüz mesaj gönderilmemiş</p>
              </div>
            )}
            {messages.map((m) => {
              const total = m._count.recipients;
              const read = m.readCount;
              const unread = total - read;
              const allRead = total > 0 && read === total;
              const isExpanded = expandedId === m.id;
              const ud = unreadData[m.id];

              return (
                <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{m.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{m.body}</p>
                      </div>
                      <div className="flex items-start gap-2 flex-shrink-0">
                        <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${allRead ? "text-green-600" : "text-orange-500"}`}>
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{read}/{total}</span>
                        </div>
                        <button
                          type="button"
                          title="Mesajı sil"
                          onClick={() => deleteMessage(m.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {new Date(m.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {unread > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleUnread(m.id)}
                          className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-medium transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {unread} okumadı
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-orange-50 px-4 py-3">
                      {loadingUnread === m.id ? (
                        <p className="text-xs text-gray-400 text-center py-2">Yükleniyor...</p>
                      ) : ud && (ud.parents.length + ud.drivers.length) === 0 ? (
                        <p className="text-xs text-green-600 text-center py-1">Tüm alıcılar okudu ✓</p>
                      ) : ud ? (
                        <div className="space-y-1">
                          {[...ud.drivers, ...ud.parents].map((u) => (
                            <div key={u.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700 font-medium">{u.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded-full font-semibold ${u.type === "Şoför" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                                  {u.type}
                                </span>
                                <span className="text-gray-400">{u.phone}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
