"use client";
import { useEffect, useState } from "react";
import { Settings, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface FirmProfile {
  id: string;
  firmCode: string;
  name: string | null;
  address: string | null;
  iban: string | null;
  phone: string;
  status: string;
}

export default function FirmaAyarlar() {
  const [firm, setFirm] = useState<FirmProfile | null>(null);
  const [form, setForm] = useState({ name: "", address: "", iban: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<FirmProfile>("/api/firma/profil").then(({ data }) => {
      if (data) {
        setFirm(data);
        setForm({ name: data.name ?? "", address: data.address ?? "", iban: data.iban ?? "" });
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const ibanDigits = form.iban.replace(/\D/g, "");
    if (form.iban && ibanDigits.length !== 16) {
      return toast.error("Lütfen 16 haneli ibanınızı yazınız.");
    }
    setLoading(true);
    const { error } = await apiFetch("/api/firma/profil", {
      method: "PUT",
      body: JSON.stringify({ ...form, documents: { submitted: true } }),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Ayarlar kaydedildi!");
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Ayarlar</h1>

      {firm && (
        <div className="bg-blue-50 rounded-2xl p-4 mb-6">
          <p className="text-xs text-blue-600 font-medium mb-1">FİRMA ID</p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-2xl text-blue-700">{firm.firmCode}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(firm.firmCode); toast.success("Kopyalandı!"); }}
              className="text-blue-400 hover:text-blue-600"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-blue-500 mt-1">Velilerin kayıt için kullanacağı ID</p>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div>
          <Label>Firma Adı</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Adres</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>IBAN</Label>
          <Input
            placeholder="16 haneli IBAN numaranız"
            value={form.iban}
            onChange={(e) => setForm({ ...form, iban: e.target.value })}
            className="mt-1 font-mono"
            maxLength={26}
          />
          <p className="text-xs text-gray-400 mt-1">Lütfen 16 haneli ibanınızı yazınız. Veliler bu IBAN'a ödeme yapacak.</p>
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>
    </div>
  );
}
