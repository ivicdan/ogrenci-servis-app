"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

type Step = "form" | "otp";

export default function VeliKayit() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ firmCode: "", studentTcId: "", phone: "", password: "", passwordConfirm: "" });
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) return toast.error("Şifreler eşleşmiyor.");
    setLoading(true);
    const { error } = await apiFetch("/api/auth/veli/kayit", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Doğrulama kodu gönderildi!");
    setStep("otp");
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await apiFetch<{ token: string }>("/api/auth/veli/otp-dogrula", {
      method: "POST",
      body: JSON.stringify({ phone: form.phone, otpCode: otp }),
    });
    setLoading(false);
    if (error) return toast.error(error);
    if (data?.token) {
      if (typeof window !== "undefined") localStorage.setItem("token", data.token);
      if (typeof window !== "undefined") localStorage.setItem("userType", "PARENT");
      toast.success("Kayıt tamamlandı!");
      router.push("/veli/profil");
    }
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-violet-100">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
          <h1 className="text-xl font-bold text-center text-gray-900 mb-2">Telefon Doğrulama</h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            <strong>{form.phone}</strong> numarasına gönderilen 6 haneli kodu girin
          </p>
          <form onSubmit={handleOtp} className="space-y-4">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              required
            />
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? "Doğrulanıyor..." : "Doğrula"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-violet-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 rounded-2xl p-3">
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Veli Kaydı</h1>
        <p className="text-center text-gray-500 text-sm mb-5">Firma ID'nizi hazır bulundurun</p>

        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <Label>Firma ID <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Servis firmanızın ID'si (zorunlu)"
              value={form.firmCode}
              onChange={(e) => setForm({ ...form, firmCode: e.target.value })}
              required className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label>Öğrenci TC Kimlik No</Label>
            <Input placeholder="Çocuğunuzun TC kimlik numarası"
              value={form.studentTcId} onChange={(e) => setForm({ ...form, studentTcId: e.target.value })}
              required className="mt-1" />
          </div>
          <div>
            <Label>Cep Telefonu</Label>
            <Input type="tel" placeholder="05XX XXX XX XX"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required className="mt-1" />
          </div>
          <div>
            <Label>Şifre</Label>
            <div className="relative mt-1">
              <Input type={showPass ? "text" : "password"} placeholder="En az 6 karakter"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Şifre Tekrar</Label>
            <Input type="password" placeholder="Şifrenizi tekrar girin"
              value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              required className="mt-1" />
          </div>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 mt-1" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Hesabınız var mı?{" "}
          <Link href="/veli/giris" className="text-purple-600 font-medium">Giriş Yap</Link>
        </div>
      </div>
    </div>
  );
}
