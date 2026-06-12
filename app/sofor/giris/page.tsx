"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch, setToken, setUserType } from "@/lib/api-client";

const STORAGE_KEY = "sofor_remember";

export default function SoforGiris() {
  const router = useRouter();
  const [form, setForm] = useState({ driverCode: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm(parsed);
        setRemember(true);
      }
    } catch {}
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await apiFetch<{ token: string }>(
      "/api/auth/sofor/giris",
      { method: "POST", body: JSON.stringify(form) }
    );
    setLoading(false);
    if (error) return toast.error(error);
    if (data?.token) {
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      setToken(data.token);
      setUserType("DRIVER");
      router.push("/sofor/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-2xl p-3">
            <Bus className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Şoför Girişi</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Firma tarafından verilen bilgilerle giriş yapın</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="driverCode">Şoför ID</Label>
            <Input
              id="driverCode"
              placeholder="Firma tarafından verilen ID"
              value={form.driverCode}
              onChange={(e) => setForm({ ...form, driverCode: e.target.value })}
              required
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="Firmanızdan şifrenizi isteyin"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600"
            />
            <span className="text-sm text-gray-600">Beni hatırla</span>
          </label>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
        <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 text-center">
          <p className="text-xs text-green-700 font-medium">
            Servis firmanızdan Şoför ID ve şifrenizi alın.
          </p>
        </div>
        <div className="mt-3 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← Ana sayfaya dön</Link>
        </div>
      </div>
    </div>
  );
}
