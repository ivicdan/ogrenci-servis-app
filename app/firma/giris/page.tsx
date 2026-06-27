"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch, setToken, setUserType, getToken, getUserType } from "@/lib/api-client";

const STORAGE_KEY = "firma_remember";

// Şifremi unuttum: 3 adım
// 1 → TC gir, OTP gönder
// 2 → OTP gir
// 3 → Yeni şifre belirle
type ForgotStep = 1 | 2 | 3;

function FirmaGirisInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ taxOrTcId: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>(1);
  const [forgotTc, setForgotTc] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotNewPassConfirm, setForgotNewPassConfirm] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!searchParams.get("reason") && getToken() && getUserType() === "FIRM") {
      router.replace("/firma/dashboard");
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { setForm(JSON.parse(saved)); setRemember(true); }
    } catch {}
    if (searchParams.get("reason") === "session") {
      toast.error("Başka bir cihazdan giriş yapıldı. Oturumunuz kapatıldı.", { duration: 6000 });
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await apiFetch<{ token: string; firm: { status: string } }>(
      "/api/auth/firma/giris",
      { method: "POST", body: JSON.stringify(form) }
    );
    setLoading(false);
    if (error) return toast.error(error);
    if (data?.token) {
      remember ? localStorage.setItem(STORAGE_KEY, JSON.stringify(form)) : localStorage.removeItem(STORAGE_KEY);
      setToken(data.token);
      setUserType("FIRM");
      router.push("/firma/dashboard");
    }
  }

  function openForgot() {
    setForgotStep(1);
    setForgotTc("");
    setForgotOtp("");
    setForgotNewPass("");
    setForgotNewPassConfirm("");
    setForgotOpen(true);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{11}$/.test(forgotTc)) return toast.error("TC kimlik no 11 rakam olmalıdır.");
    setForgotLoading(true);
    const { error } = await apiFetch("/api/auth/firma/otp-gonder", {
      method: "POST",
      body: JSON.stringify({ taxOrTcId: forgotTc }),
    });
    setForgotLoading(false);
    if (error) return toast.error(error);
    toast.success("SMS gönderildi. Lütfen telefonunuzu kontrol edin.");
    setForgotStep(2);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (forgotNewPass !== forgotNewPassConfirm) return toast.error("Şifreler eşleşmiyor.");
    if (forgotNewPass.length < 6) return toast.error("Şifre en az 6 karakter olmalıdır.");
    setForgotLoading(true);
    const { error } = await apiFetch("/api/auth/firma/sifre-sifirla", {
      method: "POST",
      body: JSON.stringify({ taxOrTcId: forgotTc, otpCode: forgotOtp, newPassword: forgotNewPass }),
    });
    setForgotLoading(false);
    if (error) return toast.error(error);
    toast.success("Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
    setForgotOpen(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="ogrenciservisi.online" className="w-32 h-auto" />
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Firma Girişi</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Hesabınıza giriş yapın</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="taxOrTcId">TC Kimlik No</Label>
            <Input
              id="taxOrTcId"
              placeholder="11 haneli TC kimlik numaranız"
              value={form.taxOrTcId}
              onChange={(e) => setForm({ ...form, taxOrTcId: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              inputMode="numeric"
              maxLength={11}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <div className="relative mt-1">
              <Input id="password" type={showPass ? "text" : "password"} placeholder="Şifreniz"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-600">Beni hatırla</span>
            </label>
            <button type="button" onClick={openForgot} className="text-sm text-blue-600 hover:underline">
              Şifremi Unuttum
            </button>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Hesabınız yok mu?{" "}
          <Link href="/firma/kayit" className="text-blue-600 font-medium">Kayıt Ol</Link>
        </div>
      </div>

      {/* Şifremi Unuttum Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Şifre Sıfırlama</DialogTitle>
          </DialogHeader>

          {/* Adım göstergesi */}
          <div className="flex items-center gap-1 mb-2">
            {([1, 2, 3] as ForgotStep[]).map((step) => (
              <div key={step} className="flex items-center gap-1 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  forgotStep >= step ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {step}
                </div>
                {step < 3 && <div className={`h-0.5 flex-1 ${forgotStep > step ? "bg-blue-600" : "bg-gray-100"}`} />}
              </div>
            ))}
          </div>

          {forgotStep === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4 mt-1">
              <p className="text-sm text-gray-500">Hesabınıza kayıtlı telefona doğrulama kodu göndereceğiz.</p>
              <div>
                <Label>TC Kimlik No</Label>
                <Input
                  className="mt-1"
                  placeholder="11 haneli TC kimlik numaranız"
                  value={forgotTc}
                  onChange={(e) => setForgotTc(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  inputMode="numeric"
                  maxLength={11}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={forgotLoading}>
                {forgotLoading ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
              </Button>
            </form>
          )}

          {forgotStep === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); if (forgotOtp.length === 6) setForgotStep(3); else toast.error("6 haneli kodu girin."); }} className="space-y-4 mt-1">
              <p className="text-sm text-gray-500">Telefonunuza gelen 6 haneli kodu girin.</p>
              <div>
                <Label>Doğrulama Kodu</Label>
                <Input
                  className="mt-1 text-center tracking-widest text-lg font-mono"
                  placeholder="000000"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep(1)}>
                  Geri
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Devam
                </Button>
              </div>
              <button
                type="button"
                onClick={handleSendOtp as any}
                className="w-full text-xs text-blue-600 hover:underline"
              >
                Kodu tekrar gönder
              </button>
            </form>
          )}

          {forgotStep === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4 mt-1">
              <p className="text-sm text-gray-500">Yeni şifrenizi belirleyin.</p>
              <div>
                <Label>Yeni Şifre</Label>
                <div className="relative mt-1">
                  <Input
                    type={showForgotPass ? "text" : "password"}
                    placeholder="En az 6 karakter"
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    required
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowForgotPass(!showForgotPass)}>
                    {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Yeni Şifre (Tekrar)</Label>
                <Input
                  className="mt-1"
                  type={showForgotPass ? "text" : "password"}
                  placeholder="Şifreyi tekrar girin"
                  value={forgotNewPassConfirm}
                  onChange={(e) => setForgotNewPassConfirm(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep(2)}>
                  Geri
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={forgotLoading}>
                  {forgotLoading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FirmaGiris() {
  return (
    <Suspense>
      <FirmaGirisInner />
    </Suspense>
  );
}
