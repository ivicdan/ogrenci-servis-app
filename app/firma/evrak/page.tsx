"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

export default function FirmaEvrak() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", iban: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await apiFetch("/api/firma/profil", {
      method: "PUT",
      body: JSON.stringify({ ...form, documents: { submitted: true } }),
    });
    setLoading(false);

    if (error) return toast.error(error);
    toast.success("Evraklar tamamlandı. Hesabınız aktif edildi!");
    router.push("/firma/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 rounded-2xl p-3">
            <FileText className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Şirket Bilgileri</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Kesin kaydı tamamlayın</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Firma Adı</Label>
            <Input
              id="name"
              placeholder="ABC Öğrenci Servisleri Ltd."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="address">Firma Adresi</Label>
            <Input
              id="address"
              placeholder="İl, İlçe, Mahalle..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="iban">IBAN (Ödeme için)</Label>
            <Input
              id="iban"
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value })}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydı Tamamla"}
          </Button>
        </form>
      </div>
    </div>
  );
}
