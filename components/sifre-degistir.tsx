"use client";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

export default function SifreDegistir({ endpoint }: { endpoint: string }) {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", newPasswordConfirm: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.newPasswordConfirm) {
      return toast.error("Yeni şifreler eşleşmiyor.");
    }
    if (form.newPassword.length < 6) {
      return toast.error("Yeni şifre en az 6 karakter olmalıdır.");
    }
    setLoading(true);
    const { error } = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ oldPassword: form.oldPassword, newPassword: form.newPassword }),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Şifreniz başarıyla güncellendi.");
    setForm({ oldPassword: "", newPassword: "", newPasswordConfirm: "" });
    setOpen(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Şifre Değiştir</span>
        </div>
        <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <div>
            <Label>Mevcut Şifre</Label>
            <div className="relative mt-1">
              <Input
                type={show.old ? "text" : "password"}
                placeholder="Mevcut şifreniz"
                value={form.oldPassword}
                onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShow({ ...show, old: !show.old })}>
                {show.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Yeni Şifre</Label>
            <div className="relative mt-1">
              <Input
                type={show.new ? "text" : "password"}
                placeholder="En az 6 karakter"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
                autoComplete="new-password"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShow({ ...show, new: !show.new })}>
                {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Yeni Şifre (Tekrar)</Label>
            <div className="relative mt-1">
              <Input
                type={show.confirm ? "text" : "password"}
                placeholder="Yeni şifreyi tekrar girin"
                value={form.newPasswordConfirm}
                onChange={(e) => setForm({ ...form, newPasswordConfirm: e.target.value })}
                required
                autoComplete="new-password"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShow({ ...show, confirm: !show.confirm })}>
                {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </Button>
        </form>
      )}
    </div>
  );
}
