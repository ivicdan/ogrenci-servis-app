"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch, setToken, setUserType } from "@/lib/api-client";

export default function FirmaKayit() {
  const router = useRouter();
  const [form, setForm] = useState({ taxOrTcId: "", phone: "", password: "", passwordConfirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) {
      return toast.error("Şifreler eşleşmiyor.");
    }
    setLoading(true);
    const { data, error } = await apiFetch<{ token: string }>(
      "/api/auth/firma/kayit",
      { method: "POST", body: JSON.stringify(form) }
    );
    setLoading(false);

    if (error) return toast.error(error);
    if (data?.token) {
      setToken(data.token);
      setUserType("FIRM");
      toast.success("Ön kayıt tamamlandı! Şirket evraklarınızı yükleyin.");
      router.push("/firma/evrak");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 rounded-2xl p-3">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Firma Kaydı</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Yeni hesap oluşturun</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="taxOrTcId">Vergi No / TC Kimlik No</Label>
            <Input
              id="taxOrTcId"
              placeholder="Vergi veya TC numaranız"
              value={form.taxOrTcId}
              onChange={(e) => setForm({ ...form, taxOrTcId: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Cep Telefonu</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="05XX XXX XX XX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="En az 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="passwordConfirm">Şifre Tekrar</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={form.passwordConfirm}
              onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Zaten hesabınız var mı?{" "}
          <Link href="/firma/giris" className="text-blue-600 font-medium">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
