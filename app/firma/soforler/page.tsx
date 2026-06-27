"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bus, Copy, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

function downloadExcel(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const data = [headers, ...rows.map(r => r.map(v => v ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = headers.map((h, i) => ({
    wch: Math.min(Math.max(h.length, ...rows.map(r => String(r[i] ?? "").length)) + 2, 45),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Şoförler");
  XLSX.writeFile(wb, filename);
}
import { CopyPhone } from "@/components/copy-phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface Driver {
  id: string;
  driverCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  plateNumber: string | null;
  assistantName: string | null;
  assistantPhone: string | null;
  status: string;
  _count: { students: number };
}

interface NewDriverResult extends Driver {
  plainPassword: string;
}

function validatePhone(phone: string) {
  const digits = phone.replace(/[\s\-]/g, "");
  return /^\d{11}$/.test(digits) && digits[0] === "0";
}
function validateTcId(tc: string) {
  return /^\d{11}$/.test(tc.replace(/\s/g, ""));
}

const emptyForm = {
  firstName: "", lastName: "", phone: "", tcId: "",
  plateNumber: "", assistantName: "", assistantPhone: "",
};

export default function FirmaSoforler() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDriver, setNewDriver] = useState<NewDriverResult | null>(null);
  const [justAddedCredentials, setJustAddedCredentials] = useState<{ id: string; password: string } | null>(null);

  useEffect(() => { loadDrivers(); }, []);

  async function loadDrivers() {
    const { data } = await apiFetch<Driver[]>("/api/firma/soforler");
    if (data) setDrivers(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!validateTcId(form.tcId)) return toast.error("TC kimlik numarası tam olarak 11 haneli olmalıdır.");
    if (!validatePhone(form.phone)) return toast.error("Telefon numarası 11 haneli ve 0 ile başlamalıdır.");
    if (form.assistantPhone && !validatePhone(form.assistantPhone)) return toast.error("Hostes telefonu 11 haneli ve 0 ile başlamalıdır.");
    setLoading(true);
    const { data, error } = await apiFetch<NewDriverResult>("/api/firma/soforler", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (error) return toast.error(error);
    if (data) {
      setNewDriver(data);
      setJustAddedCredentials({ id: data.id, password: data.plainPassword });
      setDrivers((prev) => [data, ...prev]);
      setForm(emptyForm);
    }
  }

  function handleClose() {
    setOpen(false);
    setNewDriver(null);
    setForm(emptyForm);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Şoförler</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50"
            onClick={() => {
              const headers = ["Giriş Kodu", "Ad", "Soyad", "Telefon", "Plaka", "Hostes", "Öğrenci Sayısı", "Durum"];
              const rows = drivers.map(d => [
                d.driverCode, d.firstName, d.lastName, d.phone,
                d.plateNumber ?? "", d.assistantName ?? "",
                d._count.students, d.status === "ACTIVE" ? "Aktif" : "Pasif",
              ]);
              downloadExcel(`soforler_${new Date().toISOString().slice(0,10)}.xlsx`, headers, rows);
            }}
          >
            <FileDown className="w-3.5 h-3.5 mr-1" /> Excel
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Şoför Ekle
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Yeni Şoför Ekle</DialogTitle>
          </DialogHeader>

          {newDriver ? (
            <div className="text-center py-4 space-y-4">
              <div className="bg-green-50 rounded-2xl p-4 space-y-3">
                <p className="font-semibold text-gray-900">{newDriver.firstName} {newDriver.lastName}</p>

                <div>
                  <p className="text-xs text-gray-500 mb-1">ŞOFÖR GİRİŞ KODU</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-bold text-xl text-green-700 bg-green-100 px-3 py-1 rounded-xl">
                      {newDriver.driverCode}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(newDriver.driverCode); toast.success("Kopyalandı!"); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Şifre</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-bold text-xl text-blue-700 bg-blue-100 px-3 py-1 rounded-xl">
                      {newDriver.plainPassword}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(newDriver.plainPassword); toast.success("Kopyalandı!"); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">Bu bilgileri şoföre verin. Şifre bir daha gösterilmeyecek.</p>
              </div>
              <Button onClick={handleClose} className="w-full">Tamam</Button>
            </div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ad</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="mt-1" />
                </div>
                <div>
                  <Label>Soyad</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="mt-1" />
                </div>
              </div>
              <div>
                <Label>TC Kimlik No</Label>
                <Input
                  placeholder="11 haneli TC kimlik numarası"
                  value={form.tcId}
                  onChange={(e) => setForm({ ...form, tcId: e.target.value.replace(/\D/g, "") })}
                  required className="mt-1" maxLength={11} inputMode="numeric" />
                <p className="text-xs text-gray-400 mt-1">Tam olarak 11 rakam giriniz.</p>
              </div>
              <div>
                <Label>Telefon</Label>
                <Input type="tel" placeholder="Lütfen başında 0 olacak şekilde yazınız" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} required className="mt-1" maxLength={11} />
                {form.phone.length > 0 && form.phone[0] !== "0" ? (
                  <p className="text-xs text-red-500 mt-1">İlk rakam 0 olmalıdır.</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">11 haneli, başında 0 ile yazınız.</p>
                )}
              </div>
              <div>
                <Label>Araç Plakası</Label>
                <Input placeholder="34 ABC 123" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Hostes Adı Soyadı</Label>
                <Input placeholder="Opsiyonel" value={form.assistantName} onChange={(e) => setForm({ ...form, assistantName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Hostes Telefonu</Label>
                <Input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={form.assistantPhone}
                  onChange={(e) => setForm({ ...form, assistantPhone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                  className="mt-1"
                  inputMode="numeric"
                  maxLength={11}
                />
                {form.assistantPhone.length > 0 && form.assistantPhone[0] !== "0" && (
                  <p className="text-xs text-red-500 mt-1">İlk rakam 0 olmalıdır.</p>
                )}
                {form.assistantPhone.length > 0 && form.assistantPhone[0] === "0" && form.assistantPhone.length < 11 && (
                  <p className="text-xs text-gray-400 mt-1">{11 - form.assistantPhone.length} rakam daha giriniz.</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Ekleniyor..." : "Şoförü Ekle"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {drivers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bus className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Henüz şoför eklenmemiş</p>
          </div>
        )}
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
            onClick={() => router.push(`/firma/soforler/${driver.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 rounded-xl p-2.5">
                  <Bus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {driver.firstName} {driver.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {driver.driverCode}
                    </span>
                    <CopyPhone phone={driver.phone} className="text-xs text-gray-500" />
                  </div>
                  {driver.plateNumber && (
                    <p className="text-xs text-gray-500 mt-0.5">🚌 {driver.plateNumber}</p>
                  )}
                  {justAddedCredentials?.id === driver.id && (
                    <div className="flex items-center gap-1.5 mt-1 bg-blue-50 rounded-lg px-2 py-1 w-fit">
                      <span className="text-xs text-blue-500">Şifre:</span>
                      <span className="font-mono text-xs font-bold text-blue-700">{justAddedCredentials.password}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(justAddedCredentials.password); toast.success("Şifre kopyalandı!"); }}
                        className="text-blue-400 hover:text-blue-600"
                        title="Şifreyi kopyala"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={driver.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                  {driver.status === "ACTIVE" ? "Aktif" : "Pasif"}
                </Badge>
                <span className="text-xs text-gray-500">{driver._count.students} öğrenci</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
