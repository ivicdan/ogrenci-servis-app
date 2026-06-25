"use client";
import { useEffect, useState } from "react";
import { Bell, MessageSquare, Send, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  createdAt: string;
}

export default function SoforBildirimler() {
  const [tab, setTab] = useState<"bildirimler" | "mesaj_gonder" | "firma_mesaj">("bildirimler");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [firmaMesajlar, setFirmaMesajlar] = useState<FirmaMessage[]>([]);
  const [form, setForm] = useState({ title: "", body: "", schoolType: "all" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadFirmaMesajlar();
  }, []);

  async function loadNotifications() {
    const { data } = await apiFetch<Notification[]>("/api/sofor/bildirimler");
    if (data) setNotifications(data);
  }

  async function loadFirmaMesajlar() {
    const { data } = await apiFetch<FirmaMessage[]>("/api/sofor/mesaj");
    if (data) setFirmaMesajlar(data);
  }

  async function markAllRead() {
    await apiFetch("/api/sofor/bildirimler", { method: "PUT" });
    toast.success("Tümü okundu işaretlendi.");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.read) return;
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await apiFetch(`/api/sofor/bildirimler/${id}`, { method: "PATCH" });
  }

  async function deleteNotif(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await apiFetch(`/api/sofor/bildirimler/${id}`, { method: "DELETE" });
    toast.success("Bildirim silindi.");
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error("Başlık ve mesaj zorunludur.");
    setSending(true);
    const { data, error } = await apiFetch<{ notified: number }>("/api/sofor/mesaj", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSending(false);
    if (error) return toast.error(error);
    toast.success(`Mesaj gönderildi! ${data?.notified ?? 0} veliye ulaştı.`);
    setForm({ title: "", body: "", schoolType: "all" });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const schoolTypeLabels: Record<string, string> = {
    all: "Tüm Velilerim",
    anaokulu: "Anaokulu Velileri",
    ilkokul: "İlkokul Velileri",
    ortaokul: "Ortaokul Velileri",
    lise: "Lise Velileri",
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Sekme başlıkları */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 gap-1">
        <button
          onClick={() => setTab("bildirimler")}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
            tab === "bildirimler" ? "bg-white shadow-sm text-green-700" : "text-gray-500"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Bildirimler
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("mesaj_gonder")}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
            tab === "mesaj_gonder" ? "bg-white shadow-sm text-green-700" : "text-gray-500"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Mesaj Gönder
        </button>
        <button
          onClick={() => setTab("firma_mesaj")}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
            tab === "firma_mesaj" ? "bg-white shadow-sm text-green-700" : "text-gray-500"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Firma Mesajı
          {firmaMesajlar.length > 0 && (
            <span className="bg-blue-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {firmaMesajlar.length > 9 ? "9+" : firmaMesajlar.length}
            </span>
          )}
        </button>
      </div>

      {/* BİLDİRİMLER */}
      {tab === "bildirimler" && (
        <>
          <div className="flex items-center justify-between mb-3">
            {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} okunmamış</p>}
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

      {/* MESAJ GÖNDER */}
      {tab === "mesaj_gonder" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-4">Öğrencilerinizin velilerine mesaj gönderin.</p>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <Label>Hedef Kitle</Label>
              <Select value={form.schoolType} onValueChange={(v) => setForm({ ...form, schoolType: v ?? "all" })}>
                <SelectTrigger className="mt-1">
                  <SelectValue>{schoolTypeLabels[form.schoolType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Velilerim</SelectItem>
                  <SelectItem value="anaokulu">Anaokulu Velileri</SelectItem>
                  <SelectItem value="ilkokul">İlkokul Velileri</SelectItem>
                  <SelectItem value="ortaokul">Ortaokul Velileri</SelectItem>
                  <SelectItem value="lise">Lise Velileri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Başlık</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Mesaj başlığı"
                required className="mt-1"
              />
            </div>
            <div>
              <Label>Mesaj</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Velilere iletmek istediğiniz mesaj..."
                required rows={4} className="mt-1 resize-none"
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={sending}>
              <Send className="w-4 h-4 mr-1.5" />
              {sending ? "Gönderiliyor..." : "Velilere Gönder"}
            </Button>
          </form>
        </div>
      )}

      {/* FİRMA MESAJLARI */}
      {tab === "firma_mesaj" && (
        <div className="space-y-2">
          {firmaMesajlar.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Firmadan mesaj yok</p>
            </div>
          )}
          {firmaMesajlar.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start gap-3">
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
