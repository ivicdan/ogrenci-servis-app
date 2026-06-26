"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch, setToken, setUserType } from "@/lib/api-client";
import { KvkkDialog } from "@/components/kvkk-dialog";

function validatePhone(phone: string) {
  const digits = phone.replace(/[\s\-]/g, "");
  return /^\d{11}$/.test(digits) && digits[0] === "0";
}

export default function FirmaKayit() {
  const router = useRouter();
  const [form, setForm] = useState({ taxOrTcId: "", phone: "", password: "", passwordConfirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);

  function validateTcId(val: string) {
    return /^\d{11}$/.test(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateTcId(form.taxOrTcId)) {
      return toast.error("TC Kimlik No tam olarak 11 rakam olmalıdır.");
    }
    if (!validatePhone(form.phone)) {
      return toast.error("Telefon numarası 11 haneli ve 0 ile başlamalıdır.");
    }
    if (form.password.length < 6) {
      return toast.error("Şifre en az 6 karakter olmalıdır.");
    }
    if (form.password !== form.passwordConfirm) {
      return toast.error("Şifreler eşleşmiyor.");
    }
    if (!kvkkChecked) {
      return toast.error("Devam etmek için KVKK metnini onaylamanız gerekmektedir.");
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
      router.push("/firma/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="ogrenciservisi.online" className="w-32 h-auto" />
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Firma Kaydı</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Yeni hesap oluşturun</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="taxOrTcId">TC Kimlik No</Label>
            <Input
              id="taxOrTcId"
              placeholder="11 haneli TC kimlik numarası"
              value={form.taxOrTcId}
              onChange={(e) => setForm({ ...form, taxOrTcId: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              required
              className="mt-1"
              maxLength={11}
              inputMode="numeric"
            />
            {form.taxOrTcId.length > 0 && form.taxOrTcId.length !== 11 ? (
              <p className="text-xs text-red-500 mt-1">{form.taxOrTcId.length}/11 hane girildi.</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Tam 11 rakam giriniz.</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Cep Telefonu</Label>
            <Input id="phone" type="tel" placeholder="Lütfen başında 0 olacak şekilde yazınız"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
              required className="mt-1" maxLength={11} />
            {form.phone.length > 0 && form.phone[0] !== "0" ? (
              <p className="text-xs text-red-500 mt-1">İlk rakam 0 olmalıdır.</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">11 haneli, başında 0 ile yazınız.</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <div className="relative mt-1">
              <Input id="password" type={showPass ? "text" : "password"} placeholder="En az 6 karakter"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="passwordConfirm">Şifre Tekrar</Label>
            <Input id="passwordConfirm" type="password" placeholder="Şifrenizi tekrar girin"
              value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              required className="mt-1" />
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="kvkk"
              checked={kvkkChecked}
              onChange={(e) => setKvkkChecked(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 flex-shrink-0 cursor-pointer"
            />
            <label htmlFor="kvkk" className="text-sm text-gray-600 leading-snug cursor-pointer">
              <button
                type="button"
                onClick={() => setKvkkOpen(true)}
                className="text-blue-600 font-medium hover:underline"
              >
                Kişisel Verilerin Korunması (KVKK) Aydınlatma Metni
              </button>
              {"'ni okudum ve kişisel verilerimin işlenmesine onay veriyorum."}
            </label>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !kvkkChecked}>
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Zaten hesabınız var mı?{" "}
          <Link href="/firma/giris" className="text-blue-600 font-medium">Giriş Yap</Link>
        </div>
      </div>

      <KvkkDialog open={kvkkOpen} onClose={() => setKvkkOpen(false)} />
    </div>
  );
}
