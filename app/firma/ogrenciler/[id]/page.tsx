"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Bus, Phone, MapPin, CreditCard, Trash2, KeyRound, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const studyTimeLabel: Record<string, string> = {
  MORNING: "Sabah",
  AFTERNOON: "Öğleden Sonra",
};

const paymentStatusLabel: Record<string, { label: string; color: "default" | "secondary" }> = {
  PENDING: { label: "Bekliyor", color: "secondary" },
  SUBMITTED: { label: "Onay Bekliyor", color: "secondary" },
  APPROVED: { label: "Onaylandı", color: "default" },
};

interface Driver {
  id: string;
  driverCode: string;
  firstName: string;
  lastName: string;
  plateNumber: string | null;
}

interface StudentDetail {
  id: string;
  firstName: string;
  lastName: string;
  tcId: string;
  school: string;
  class: string;
  teacher: string | null;
  phone: string | null;
  studyTime: string;
  status: string;
  driver: { id: string; firstName: string; lastName: string; driverCode: string; plateNumber: string | null } | null;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    profession: string | null;
    spouseFirstName: string | null;
    spouseLastName: string | null;
    spousePhone: string | null;
    spouseProfession: string | null;
    plainPassword: string | null;
    paymentDay: number | null;
  } | null;
  payments: {
    id: string;
    amount: string;
    paidDate: string | null;
    status: string;
    method: string | null;
  }[];
}

export default function OgrenciDetay() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [resettingPass, setResettingPass] = useState(false);
  const [newPass, setNewPass] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<StudentDetail>(`/api/firma/ogrenciler/${params.id}`),
      apiFetch<Driver[]>("/api/firma/soforler"),
    ]).then(([{ data: s }, { data: d }]) => {
      if (s) {
        setStudent(s);
        setSelectedDriver(s.driver?.id ?? "");
      }
      if (d) setDrivers(d);
    }).finally(() => setLoading(false));
  }, [params.id]);

  async function handleDelete() {
    const { error } = await apiFetch(`/api/firma/ogrenciler/${params.id}`, { method: "DELETE" });
    if (error) return toast.error(error);
    toast.success("Öğrenci pasife alındı.");
    router.push("/firma/ogrenciler");
  }

  async function handleResetPassword() {
    setResettingPass(true);
    const { data, error } = await apiFetch<{ plainPassword: string }>(
      `/api/firma/ogrenciler/${params.id}/sifre-sifirla`,
      { method: "POST" }
    );
    setResettingPass(false);
    if (error) return toast.error(error);
    if (data?.plainPassword) {
      setNewPass(data.plainPassword);
      if (student?.parent) {
        setStudent({ ...student, parent: { ...student.parent, plainPassword: data.plainPassword } });
      }
    }
  }

  async function handleAssignDriver() {
    setSaving(true);
    const { error } = await apiFetch(`/api/firma/ogrenciler/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({ driverId: selectedDriver || null }),
    });
    setSaving(false);
    if (error) return toast.error(error);
    toast.success("Şoför ataması güncellendi!");
    if (student) {
      const driver = drivers.find((d) => d.id === selectedDriver) ?? null;
      setStudent({
        ...student,
        driver: driver ? { ...driver, driverCode: driver.driverCode } : null,
      });
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;
  if (!student) return <div className="text-center py-12 text-gray-400">Öğrenci bulunamadı.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteConfirm(true)}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Sil
        </Button>
      </div>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Öğrenciyi Sil</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            <strong>{student.firstName} {student.lastName}</strong> adlı öğrenci pasife alınacak ve velisi sisteme giriş yapamayacak. Emin misiniz?
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>İptal</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDelete}>Evet, Sil</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 rounded-2xl p-3">
            <GraduationCap className="w-7 h-7 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h1 className="text-xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
              <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
                {student.status === "ACTIVE" ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>{student.school} · {student.class}</p>
              {student.teacher && <p>Öğretmen: {student.teacher}</p>}
              <p>Öğrenim: {studyTimeLabel[student.studyTime]}</p>
              <p className="text-xs text-gray-400">TC: {student.tcId}</p>
              {student.phone && (
                <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {student.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <Bus className="w-4 h-4" /> Şoför Ataması
        </h2>
        <Select value={selectedDriver} onValueChange={(v) => setSelectedDriver(v ?? "")}>
          <SelectTrigger>
            <SelectValue>
              {selectedDriver
                ? (() => {
                    const d = drivers.find((dr) => dr.id === selectedDriver);
                    return d ? `${d.firstName} ${d.lastName} (${d.driverCode})` : "Seçin";
                  })()
                : "Şoför seçin"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Şoför atamasını kaldır —</SelectItem>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.firstName} {d.lastName} — {d.driverCode}
                {d.plateNumber && ` · ${d.plateNumber}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
          onClick={handleAssignDriver}
          disabled={saving}
        >
          {saving ? "Kaydediliyor..." : "Şoförü Ata"}
        </Button>
      </div>

      {student.parent && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Veli Bilgileri</h2>
          <div className="space-y-1.5 text-sm text-gray-700">
            <p className="font-medium">{student.parent.firstName} {student.parent.lastName}</p>
            <p className="flex items-center gap-1.5 text-gray-600"><Phone className="w-3.5 h-3.5" /> {student.parent.phone}</p>
            {student.parent.profession && <p>Meslek: {student.parent.profession}</p>}
            {student.parent.paymentDay != null && (
              <p className="text-blue-700 font-medium">Ödeme Günü: Her ayın {student.parent.paymentDay}. günü</p>
            )}
            {student.parent.address && (
              <p className="flex items-start gap-1.5 text-gray-600"><MapPin className="w-3.5 h-3.5 mt-0.5" /> {student.parent.address}</p>
            )}
            {student.parent.spouseFirstName && (
              <div className="pt-2 border-t border-gray-100 mt-2">
                <p className="font-medium text-xs text-gray-500 mb-1">Eş / Diğer Veli</p>
                <p>{student.parent.spouseFirstName} {student.parent.spouseLastName}</p>
                {student.parent.spousePhone && (
                  <p className="flex items-center gap-1.5 text-gray-600"><Phone className="w-3.5 h-3.5" /> {student.parent.spousePhone}</p>
                )}
                {student.parent.spouseProfession && <p>{student.parent.spouseProfession}</p>}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Veli Giriş Şifresi
            </h3>
            {student.parent.plainPassword ? (
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg text-sm">
                  {newPass ?? student.parent.plainPassword}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(newPass ?? student.parent!.plainPassword!); toast.success("Kopyalandı!"); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic mb-2">"Şifre Sıfırla" ile yeni şifre oluşturun.</p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-purple-700 border-purple-200 hover:bg-purple-50"
              onClick={handleResetPassword}
              disabled={resettingPass}
            >
              <KeyRound className="w-3.5 h-3.5 mr-1" />
              {resettingPass ? "Sıfırlanıyor..." : "Şifre Sıfırla"}
            </Button>
            {newPass && (
              <p className="text-xs text-green-600 mt-1">Yeni şifre oluşturuldu. Veliye iletmeyi unutmayın.</p>
            )}
          </div>
        </div>
      )}

      {student.payments.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Son Ödemeler
          </h2>
          <div className="space-y-2">
            {student.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{Number(p.amount).toLocaleString("tr-TR")} TL</span>
                  {p.paidDate && (
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(p.paidDate).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </div>
                <Badge variant={paymentStatusLabel[p.status]?.color ?? "secondary"} className="text-xs">
                  {paymentStatusLabel[p.status]?.label}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
