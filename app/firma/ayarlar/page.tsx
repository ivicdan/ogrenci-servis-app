"use client";
import { useEffect, useState } from "react";
import { Copy, Pencil } from "lucide-react";
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
  const [savedForm, setSavedForm] = useState({ name: "", address: "", iban: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<FirmProfile>("/api/firma/profil").then(({ data }) => {
      if (data) {
        setFirm(data);
        const rawIban = data.iban ?? "";
        const digits = rawIban.startsWith("TR")
          ? rawIban.slice(2).replace(/\D/g, "").slice(0, 16)
          : rawIban.replace(/\D/g, "").slice(0, 16);
        const initial = { name: data.name ?? "", address: data.address ?? "", iban: digits };
        setForm(initial);
        setSavedForm(initial);
      }
    });
  }, []);

  function handleEdit() {
    setForm(savedForm);
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(savedForm);
    setIsEditing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.iban && form.iban.length !== 16) {
      return toast.error("IBAN 16 rakam olmalıdır.");
    }
    setLoading(true);
    const ibanFull = form.iban ? "TR" + form.iban : "";
    const { error } = await apiFetch("/api/firma/profil", {
      method: "PUT",
      body: JSON.stringify({ name: form.name, address: form.address, iban: ibanFull, documents: { submitted: true } }),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Ayarlar kaydedildi!");
    setSavedForm(form);
    setIsEditing(false);
  }

  const displayIban = savedForm.iban ? `TR${savedForm.iban}` : "—";

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Ayarlar</h1>

      {firm && (
        <div className="bg-blue-50 rounded-2xl p-4 mb-6">
          <p className="text-xs text-blue-600 font-medium mb-1">FİRMA ID</p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-2xl text-blue-700">{firm.firmCode}</span>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(firm.firmCode); toast.success("Kopyalandı!"); }}
              className="text-blue-400 hover:text-blue-600"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-blue-500 mt-1">Velilerin kayıt için kullanacağı ID</p>
        </div>
      )}

      {!isEditing ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-700 text-sm">FİRMA BİLGİLERİ</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleEdit} className="gap-1.5 text-xs h-8">
              <Pencil className="w-3.5 h-3.5" /> Düzenle
            </Button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Firma Adı</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{savedForm.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Adres</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{savedForm.address || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">IBAN</p>
              <p className="text-sm font-mono font-medium text-gray-800 mt-0.5">{displayIban}</p>
            </div>
          </div>
        </div>
      ) : (
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
            <div className="flex mt-1">
              <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-input rounded-l-md text-sm font-mono font-semibold text-gray-700 select-none">TR</span>
              <Input
                placeholder="16 haneli numara"
                value={form.iban}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setForm({ ...form, iban: digits });
                }}
                className="rounded-l-none font-mono"
                maxLength={16}
                inputMode="numeric"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Veliler bu IBAN'a ödeme yapacak. (TR + 16 rakam)</p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleCancel} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
