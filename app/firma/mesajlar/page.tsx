"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Send, CheckCheck, Trash2 } from "lucide-react";
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

export default function FirmaMesajlar() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [form, setForm] = useState({ title: "", body: "", target: "all" });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMessages();
    apiFetch("/api/firma/bildirimler", { method: "PUT" });
  }, []);

  async function loadMessages() {
    const { data } = await apiFetch<Message[]>("/api/firma/mesaj");
    if (data) setMessages(data);
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mesajlar</h1>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setOpen(true)}>
          <Send className="w-4 h-4 mr-1" /> Mesaj Gönder
        </Button>
      </div>

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
                  <SelectItem value="parents">Sadece Veliler</SelectItem>
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
                required
                rows={4}
                className="mt-1 resize-none"
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
          const allRead = total > 0 && read === total;
          return (
            <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{m.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{m.body}</p>
                </div>
                <div className="flex items-start gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${allRead ? "text-green-600" : "text-gray-400"}`}>
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{read}/{total}</span>
                  </div>
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(m.createdAt).toLocaleDateString("tr-TR", {
                  day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
