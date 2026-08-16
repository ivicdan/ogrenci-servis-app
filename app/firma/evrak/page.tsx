"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const WHATSAPP = "905444475096";
const EMAIL = "info@ogrenciservisi.online";

export default function FirmaEvrak() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", iban: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.iban && form.iban.length !== 24) {
      return toast.error("IBAN 24 rakam olmalıdır.");
    }

    setLoading(true);
    const ibanFull = form.iban ? "TR" + form.iban : "";
    const { error } = await apiFetch("/api/firma/profil", {
      method: "PUT",
      body: JSON.stringify({ name: form.name, address: form.address, iban: ibanFull }),
    });
    setLoading(false);

    if (error) return toast.error(error);
    router.push("/firma/onay-bekleniyor");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-4">
          <img src="/logo.svg" alt="Logo" className="w-24 h-auto" />
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Firma Bilgileri</h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Bilgileri doldurun, ardından evraklarınızı WhatsApp veya e-posta ile gönderin.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Firma Adı</Label>
            <Input
              id="name"
              placeholder="ABC Öğrenci Servisleri"
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
            <div className="flex mt-1">
              <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-input rounded-l-md text-sm font-mono font-semibold text-gray-700 select-none">
                TR
              </span>
              <Input
                id="iban"
                placeholder="24 haneli numara"
                value={form.iban}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 24);
                  setForm({ ...form, iban: digits });
                }}
                className="rounded-l-none font-mono"
                maxLength={24}
                inputMode="numeric"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Sadece 16 rakam girin. (TR + 16 rakam)</p>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Kaydediliyor..." : "Kaydet ve Devam Et"}
          </Button>
        </form>

        {/* Evrak gönderme bilgisi */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm font-semibold text-blue-800 mb-3">
            Evraklarınızı bize gönderin
          </p>
          <p className="text-xs text-blue-700 mb-3">
            Aşağıdaki belgeler gereklidir: İmza Sirküsü · Vergi Levhası · Kimlik Fotokopisi
          </p>
          <div className="space-y-2">
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors w-full justify-center"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp ile Gönder
            </a>
            <a
              href={`mailto:${EMAIL}?subject=Firma%20Evrakları`}
              className="flex items-center gap-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 transition-colors w-full justify-center"
            >
              <Mail className="w-4 h-4" />
              E-posta ile Gönder
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
