"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { KvkkDialog } from "@/components/kvkk-dialog";

function validatePhone(phone: string) {
  const digits = phone.replace(/[\s\-]/g, "");
  return /^\d{11}$/.test(digits) && digits[0] === "0";
}
function validateTcId(tc: string) {
  return /^\d{11}$/.test(tc.replace(/\s/g, ""));
}

export default function VeliKayit() {
  const router = useRouter();
  const [form, setForm] = useState({ firmCode: "", studentTcId: "", phone: "", password: "", passwordConfirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validateTcId(form.studentTcId)) return toast.error("Öğrenci TC kimlik numarası 11 haneli olmalıdır.");
    if (!validatePhone(form.phone)) return toast.error("Telefon numarası 11 haneli ve 0 ile başlamalıdır.");
    if (form.password !== form.passwordConfirm) return toast.error("Şifreler eşleşmiyor.");
    if (!kvkkChecked) return toast.error("Devam etmek için KVKK metnini onaylamanız gerekmektedir.");
    setLoading(true);
    const { data, error } = await apiFetch<{ token: string }>("/api/auth/veli/kayit", {
      method: "POST",
      body: JSON.stringify(form),
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-violet-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-4">
          <img src="/logo.svg" alt="ogrenciservisi.online" className="w-32 h-auto" />
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Veli Kaydı</h1>
        <p className="text-center text-gray-500 text-sm mb-5">Firma Kodunuzu hazır bulundurun</p>

        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <Label>Firma Kodu <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Servis firmanızın kodu (zorunlu)"
              value={form.firmCode}
              onChange={(e) => setForm({ ...form, firmCode: e.target.value })}
              required className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label>Öğrenci TC Kimlik No <span className="text-red-500">*</span></Label>
            <Input
              placeholder="11 haneli TC kimlik numarası"
              value={form.studentTcId}
              onChange={(e) => setForm({ ...form, studentTcId: e.target.value.replace(/\D/g, "") })}
              required className="mt-1" maxLength={11} inputMode="numeric" />
            <p className="text-xs text-gray-400 mt-1">Tam olarak 11 rakam giriniz.</p>
          </div>
          <div>
            <Label>Cep Telefonu <span className="text-red-500">*</span></Label>
            <Input type="tel" placeholder="Lütfen başında 0 olacak şekilde yazınız"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
              required className="mt-1" maxLength={11} />
            {form.phone.length > 0 && form.phone[0] !== "0" ? (
              <p className="text-xs text-red-500 mt-1">İlk rakam 0 olmalıdır.</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">11 haneli, başında 0 ile yazınız.</p>
            )}
          </div>
          <div>
            <Label>Şifre <span className="text-red-500">*</span></Label>
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
            <Label>Şifre Tekrar <span className="text-red-500">*</span></Label>
            <Input type="password" placeholder="Şifrenizi tekrar girin"
              value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              required className="mt-1" />
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="kvkk"
              checked={kvkkChecked}
              onChange={(e) => setKvkkChecked(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-purple-600 flex-shrink-0 cursor-pointer"
            />
            <label htmlFor="kvkk" className="text-sm text-gray-600 leading-snug cursor-pointer">
              <button
                type="button"
                onClick={() => setKvkkOpen(true)}
                className="text-purple-600 font-medium hover:underline"
              >
                Kişisel Verilerin Korunması (KVKK) Aydınlatma Metni
              </button>
              {"'ni okudum ve kişisel verilerimin işlenmesine onay veriyorum."}
            </label>
          </div>

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 mt-1" disabled={loading || !kvkkChecked}>
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Hesabınız var mı?{" "}
          <Link href="/veli/giris" className="text-purple-600 font-medium">Giriş Yap</Link>
        </div>
        <div className="mt-2 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← Ana sayfaya dön</Link>
        </div>
      </div>

      <KvkkDialog open={kvkkOpen} onClose={() => setKvkkOpen(false)} />
    </div>
  );
}
