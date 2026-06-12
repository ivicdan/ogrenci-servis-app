"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch, setToken, setUserType } from "@/lib/api-client";

export default function VeliGiris() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await apiFetch<{ token: string }>(
      "/api/auth/veli/giris",
      { method: "POST", body: JSON.stringify(form) }
    );
    setLoading(false);
    if (error) return toast.error(error);
    if (data?.token) {
      setToken(data.token);
      setUserType("PARENT");
      router.push("/veli/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-violet-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-6">
          <div className="bg-purple-100 rounded-2xl p-3">
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Veli Girişi</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Kayıtlı telefonunuzla giriş yapın</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Telefon Numarası</Label>
            <Input id="phone" type="tel" placeholder="05XX XXX XX XX"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <div className="relative mt-1">
              <Input id="password" type={showPass ? "text" : "password"} placeholder="Şifreniz"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Kayıtlı değil misiniz?{" "}
          <Link href="/veli/kayit" className="text-purple-600 font-medium">Kayıt Ol</Link>
        </div>
        <div className="mt-3 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← Ana sayfaya dön</Link>
        </div>
      </div>
    </div>
  );
}
