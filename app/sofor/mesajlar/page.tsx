"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Building2, Bus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

interface Message {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  senderType: "FIRM" | "DRIVER";
  driverName: string | null;
}

const schoolTypeLabels: Record<string, string> = {
  all: "Tüm Velilerim",
  anaokulu: "Anaokulu Velileri",
  ilkokul: "İlkokul Velileri",
  ortaokul: "Ortaokul Velileri",
  lise: "Lise Velileri",
};

export default function SoforMesajlar() {
  const [tab, setTab] = useState<"gelen" | "gonder">("gelen");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "", schoolType: "all" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    const { data } = await apiFetch<Message[]>("/api/sofor/mesaj");
    if (data) setMessages(data);
    setLoading(false);
    // Okundu işaretle ve badge güncelle
    await apiFetch("/api/sofor/mesaj", { method: "PUT" });
    window.dispatchEvent(new Event("badge-refresh"));
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

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="max-w-md mx-auto">
      {/* Sekmeler */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 gap-1">
        <button
          type="button"
          onClick={() => setTab("gelen")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "gelen" ? "bg-white shadow-sm text-green-700" : "text-gray-500"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Gelen Mesajlar
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("gonder")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "gonder" ? "bg-white shadow-sm text-green-700" : "text-gray-500"
          }`}
        >
          <Send className="w-4 h-4" />
          Mesaj Gönder
        </button>
      </div>

      {/* GELEN MESAJLAR */}
      {tab === "gelen" && (
        <>
          {loading && <p className="text-center text-gray-400 py-8">Yükleniyor...</p>}
          {!loading && messages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Henüz mesaj yok</p>
            </div>
          )}
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 ${
                    m.senderType === "DRIVER" ? "bg-green-100" : "bg-blue-100"
                  }`}>
                    {m.senderType === "DRIVER"
                      ? <Bus className="w-4 h-4 text-green-600" />
                      : <Building2 className="w-4 h-4 text-blue-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        m.senderType === "DRIVER" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {m.senderType === "DRIVER" ? `Şoför${m.driverName ? ` · ${m.driverName}` : ""}` : "Firma"}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{m.body}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(m.createdAt).toLocaleString("tr-TR", {
                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MESAJ GÖNDER */}
      {tab === "gonder" && (
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
    </div>
  );
}
