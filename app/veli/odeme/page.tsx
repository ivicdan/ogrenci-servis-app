"use client";
import { useEffect, useState } from "react";
import { CreditCard, Calendar, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface Payment {
  id: string;
  amount: string;
  dueDate: string;
  paidDate: string | null;
  method: string | null;
  status: string;
}

const statusLabel: Record<string, { label: string; color: "default" | "secondary" }> = {
  PENDING: { label: "Bekliyor", color: "secondary" },
  SUBMITTED: { label: "Onay Bekliyor", color: "secondary" },
  APPROVED: { label: "Onaylandı", color: "default" },
};

const methodLabel: Record<string, string> = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT" };

export default function VeliOdeme() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentDay, setPaymentDay] = useState<number | null>(null);
  const [newDay, setNewDay] = useState("");
  const [iban, setIban] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", paidDate: new Date().toISOString().slice(0, 10), method: "BANK_TRANSFER" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPayments();
    apiFetch<any>("/api/veli/ogrenci").then(({ data }) => {
      if (data) {
        if (data.paymentDay) setPaymentDay(data.paymentDay);
        if (data.student?.firm?.iban) setIban(data.student.firm.iban);
      }
    });
  }, []);

  async function loadPayments() {
    const { data } = await apiFetch<Payment[]>("/api/veli/odeme");
    if (data) setPayments(data);
  }

  async function handleSetDay(e: React.FormEvent) {
    e.preventDefault();
    const day = parseInt(newDay);
    if (!day || day < 1 || day > 28) return toast.error("1-28 arası bir gün girin.");
    const { error } = await apiFetch("/api/veli/odeme-gunu", {
      method: "PUT",
      body: JSON.stringify({ paymentDay: day }),
    });
    if (error) return toast.error(error);
    setPaymentDay(day);
    toast.success(`Ödeme günü ayın ${day}'i olarak ayarlandı.`);
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await apiFetch("/api/veli/odeme", {
      method: "POST",
      body: JSON.stringify(payForm),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Ödeme bildirimi gönderildi! Firma onayı bekleniyor.");
    setOpen(false);
    setPayForm({ amount: "", paidDate: new Date().toISOString().slice(0, 10), method: "BANK_TRANSFER" });
    loadPayments();
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Ödemelerim</h1>

      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-1">ÖDEME YAPILACAK IBAN</p>
        {iban ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-blue-900 font-bold">{iban}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(iban); toast.success("IBAN kopyalandı!"); }}
              className="text-blue-400 hover:text-blue-600 flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Firma tarafından henüz girilmedi.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-purple-500" />
          <p className="font-semibold text-gray-900 text-sm">Ödeme Günüm</p>
        </div>
        {paymentDay ? (
          <p className="text-gray-600 text-sm mb-3">
            Her ayın <strong className="text-purple-700">{paymentDay}.</strong> günü ödeme yapıyorsunuz.
          </p>
        ) : (
          <p className="text-gray-500 text-sm mb-3">Ödeme gününüz belirlenmemiş.</p>
        )}
        <form onSubmit={handleSetDay} className="flex gap-2">
          <Input type="number" min={1} max={28} placeholder="Gün (1-28)"
            value={newDay} onChange={(e) => setNewDay(e.target.value)} className="flex-1" />
          <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700">Ayarla</Button>
        </form>
      </div>

      <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setOpen(true)}>
        <CreditCard className="w-4 h-4 mr-2" /> Ödeme Bildir
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Ödeme Bildir</DialogTitle></DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <Label>Ödeme Tutarı (TL)</Label>
              <Input
                type="number" min="1" step="0.01"
                placeholder="Örn: 1500"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                required className="mt-1"
              />
            </div>
            <div>
              <Label>Ödeme Tarihi</Label>
              <Input type="date" value={payForm.paidDate}
                onChange={(e) => setPayForm({ ...payForm, paidDate: e.target.value })}
                required className="mt-1" />
            </div>
            <div>
              <Label>Ödeme Yöntemi</Label>
              <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v ?? "" })}>
                <SelectTrigger className="mt-1">
                  <SelectValue>{methodLabel[payForm.method] || "Seçin"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Havale / EFT</SelectItem>
                  <SelectItem value="CASH">Nakit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              Ödemeniz firma tarafından onaylandıktan sonra onaylı görünecek.
            </p>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? "Gönderiliyor..." : "Bildir"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Henüz ödeme bildirimi yok</p>
          </div>
        )}
        {payments.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-1">
              <p className="font-bold text-gray-900">{Number(p.amount).toLocaleString("tr-TR")} TL</p>
              <Badge variant={statusLabel[p.status]?.color ?? "secondary"} className="text-xs">
                {statusLabel[p.status]?.label}
              </Badge>
            </div>
            {p.paidDate && (
              <p className="text-xs text-gray-500">
                Tarih: {new Date(p.paidDate).toLocaleDateString("tr-TR")}
                {p.method && ` · ${methodLabel[p.method]}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
