"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bus, ArrowLeft, GraduationCap, Phone, Route, Pencil, Trash2, Copy, KeyRound } from "lucide-react";
import { CopyPhone } from "@/components/copy-phone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { formatSinif } from "@/lib/utils";

const studyTimeLabel: Record<string, string> = {
  MORNING: "Sabah", AFTERNOON: "Öğleden Sonra",
};
const routeTypeLabel: Record<string, string> = {
  MORNING_PICKUP: "Sabah Gidiş", MORNING_DROPOFF: "Öğlen Çıkış",
  AFTERNOON_PICKUP: "Öğlen Gidiş", AFTERNOON_DROPOFF: "Akşam Çıkış",
};

interface DriverDetail {
  id: string; driverCode: string; firstName: string; lastName: string;
  phone: string; tcId: string; plateNumber: string | null;
  assistantName: string | null; assistantPhone: string | null; status: string; createdAt: string;
  _count: { students: number; routes: number };
  students: {
    id: string; firstName: string; lastName: string; school: string;
    class: string; studyTime: string;
    parent: { firstName: string; lastName: string; phone: string } | null;
  }[];
  routes: { id: string; name: string; type: string }[];
}

export default function SoforDetay() {
  const params = useParams();
  const router = useRouter();
  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "", plateNumber: "", assistantName: "", assistantPhone: "" });
  const [saving, setSaving] = useState(false);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    apiFetch<DriverDetail>(`/api/firma/soforler/${params.id}`)
      .then(({ data }) => {
        if (data) {
          setDriver(data);
          setEditForm({
            firstName: data.firstName, lastName: data.lastName,
            phone: data.phone, plateNumber: data.plateNumber ?? "",
            assistantName: data.assistantName ?? "",
            assistantPhone: data.assistantPhone ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await apiFetch(`/api/firma/soforler/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...editForm, status: driver?.status }),
    });
    setSaving(false);
    if (error) return toast.error(error);
    toast.success("Bilgiler güncellendi!");
    setEditOpen(false);
    if (driver) setDriver({ ...driver, ...editForm, plateNumber: editForm.plateNumber || null, assistantName: editForm.assistantName || null, assistantPhone: editForm.assistantPhone || null });
  }

  async function handleResetPassword() {
    setResetting(true);
    const { data, error } = await apiFetch<{ plainPassword: string }>(`/api/firma/soforler/${params.id}`, { method: "PATCH" });
    setResetting(false);
    if (error) return toast.error(error);
    if (data) {
      setResetPassword(data.plainPassword);
    }
  }

  async function handleDelete() {
    const { error } = await apiFetch(`/api/firma/soforler/${params.id}`, { method: "DELETE" });
    if (error) return toast.error(error);
    toast.success("Şoför pasife alındı.");
    router.push("/firma/soforler");
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;
  if (!driver) return <div className="text-center py-12 text-gray-400">Şoför bulunamadı.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={handleResetPassword} disabled={resetting}>
            <KeyRound className="w-3.5 h-3.5 mr-1" /> {resetting ? "..." : "Şifreyi Sıfırla"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Düzenle
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteConfirm(true)}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Sil
          </Button>
        </div>
      </div>

      {/* Düzenle Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Şoförü Düzenle</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ad</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <Label>Soyad</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Telefon</Label>
              <Input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label>Araç Plakası</Label>
              <Input value={editForm.plateNumber} onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Hostes Adı</Label>
              <Input value={editForm.assistantName} onChange={(e) => setEditForm({ ...editForm, assistantName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Hostes Telefonu</Label>
              <Input type="tel" placeholder="05XX XXX XX XX" value={editForm.assistantPhone} onChange={(e) => setEditForm({ ...editForm, assistantPhone: e.target.value })} className="mt-1" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>İptal</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Şifre Sıfırlama Sonuç Dialog */}
      <Dialog open={!!resetPassword} onOpenChange={(v) => { if (!v) setResetPassword(null); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Şifre Oluşturuldu</DialogTitle></DialogHeader>
          <div className="bg-green-50 rounded-2xl p-4 space-y-3 text-center">
            <p className="text-sm text-gray-600">{driver.firstName} {driver.lastName} için yeni giriş bilgileri:</p>
            <div>
              <p className="text-xs text-gray-500 mb-1">ŞOFÖR GİRİŞ KODU</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-bold text-lg text-green-700 bg-green-100 px-3 py-1 rounded-xl">{driver.driverCode}</span>
                <button onClick={() => { navigator.clipboard.writeText(driver.driverCode); toast.success("Kopyalandı!"); }} className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Yeni Şifre</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-bold text-lg text-blue-700 bg-blue-100 px-3 py-1 rounded-xl">{resetPassword}</span>
                <button onClick={() => { navigator.clipboard.writeText(resetPassword!); toast.success("Kopyalandı!"); }} className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">Bu bilgileri şoföre verin. Şifre bir daha gösterilmeyecek.</p>
          </div>
          <Button onClick={() => setResetPassword(null)} className="w-full">Tamam</Button>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Şoförü Sil</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            <strong>{driver.firstName} {driver.lastName}</strong> adlı şoför pasife alınacak ve sisteme giriş yapamayacak. Emin misiniz?
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>İptal</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDelete}>Evet, Sil</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-start gap-4">
          <div className="bg-green-100 rounded-2xl p-3">
            <Bus className="w-7 h-7 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{driver.firstName} {driver.lastName}</h1>
                <span className="font-mono text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">{driver.driverCode}</span>
              </div>
              <Badge variant={driver.status === "ACTIVE" ? "default" : "secondary"}>
                {driver.status === "ACTIVE" ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> <CopyPhone phone={driver.phone} /></p>
              {driver.plateNumber && <p>🚌 Plaka: {driver.plateNumber}</p>}
              {driver.assistantName && (
                <p className="flex items-center gap-2">
                  👤 Hostes: {driver.assistantName}
                  {driver.assistantPhone && (
                    <> · <CopyPhone phone={driver.assistantPhone} /></>
                  )}
                </p>
              )}
              <p className="text-xs text-gray-400">Kayıt: {new Date(driver.createdAt).toLocaleDateString("tr-TR")}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Giriş Bilgileri</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">ŞOFÖR GİRİŞ KODU</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-lg text-sm">{driver.driverCode}</span>
                <button onClick={() => { navigator.clipboard.writeText(driver.driverCode); toast.success("Kopyalandı!"); }} className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Şifre</p>
              {resetPassword ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg text-sm">{resetPassword}</span>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(resetPassword); toast.success("Kopyalandı!"); }} className="text-gray-400 hover:text-gray-600">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5 italic">"Şifreyi Sıfırla" ile yenile</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-center">
          <div className="flex-1"><p className="text-2xl font-bold text-gray-900">{driver._count.students}</p><p className="text-xs text-gray-500">Öğrenci</p></div>
          <div className="flex-1"><p className="text-2xl font-bold text-gray-900">{driver._count.routes}</p><p className="text-xs text-gray-500">Güzergah</p></div>
        </div>
      </div>

      {driver.routes.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <Route className="w-4 h-4" /> Güzergahlar
          </h2>
          <div className="space-y-2">
            {driver.routes.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.name}</span>
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{routeTypeLabel[r.type] ?? r.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {driver.students.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Öğrenciler ({driver.students.length})
          </h2>
          <div className="space-y-3">
            {driver.students.map((s) => (
              <div key={s.id} className="border border-gray-100 rounded-xl p-3">
                <p className="font-medium text-gray-900 text-sm">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-gray-500">{s.school} · {formatSinif(s.class)} · {studyTimeLabel[s.studyTime]}</p>
                {s.parent && <p className="text-xs text-gray-500 mt-1">👤 {s.parent.firstName} {s.parent.lastName} · <CopyPhone phone={s.parent.phone} /></p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
