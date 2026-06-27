"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { GraduationCap, AlertCircle, MapPin, UserPlus } from "lucide-react";
import { CopyPhone } from "@/components/copy-phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { getActiveStudentId, setActiveStudentId } from "@/lib/active-student";

const DriverTrackingMap = dynamic(() => import("@/components/driver-tracking-map"), { ssr: false });

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  school: string;
  class: string;
  studyTime: string;
  serviceStartDate: string | null;
  monthlyFee?: number | null;
  driver: {
    firstName: string;
    lastName: string;
    phone: string;
    plateNumber: string | null;
    assistantName: string | null;
  } | null;
  firm: {
    name: string | null;
    iban: string | null;
    firmCode: string;
  };
}

interface ParentData {
  firstName: string;
  lastName: string;
  students: StudentInfo[];
}

interface TrackingData {
  tripActive: boolean;
  route?: { id: string; name: string; type: string; startedAt: string };
  driver?: {
    firstName: string;
    lastName: string;
    plateNumber: string | null;
    lat: number | null;
    lng: number | null;
    updatedAt: string | null;
  };
  pickup?: { lat: number | null; lng: number | null };
  eta?: number | null;
  distance?: number | null;
  routeGeometry?: [number, number][] | null;
}

function routeTypeLabel(type: string) {
  switch (type) {
    case "MORNING_PICKUP": return "Sabah Gidiş";
    case "MORNING_DROPOFF": return "Öğlen Çıkış";
    case "AFTERNOON_PICKUP": return "Öğlen Gidiş";
    case "AFTERNOON_DROPOFF": return "Akşam Çıkış";
    default: return type;
  }
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  return `${Math.floor(diff / 3600)} sa önce`;
}

export default function VeliDashboard() {
  const [data, setData] = useState<ParentData | null>(null);
  const [activeStudentId, setActiveLocal] = useState<string>("");
  const [overdueModal, setOverdueModal] = useState(false);
  const [daysLate, setDaysLate] = useState(0);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addForm, setAddForm] = useState({ firmCode: "", studentTcId: "" });
  const [addLoading, setAddLoading] = useState(false);

  // Store current studentId in ref so interval callback doesn't go stale
  const activeIdRef = useRef<string>("");

  function applyStudentId(id: string) {
    setActiveLocal(id);
    activeIdRef.current = id;
  }

  const fetchTracking = useCallback(() => {
    const sid = activeIdRef.current || getActiveStudentId();
    apiFetch<TrackingData>(`/api/veli/sofor-konum?studentId=${sid}`).then(({ data }) => {
      if (data) setTracking(data);
    });
  }, []);

  function checkOverdue(sid: string) {
    apiFetch<{ overdue: boolean; daysLate: number }>(`/api/veli/gecikme-kontrol?studentId=${sid}`).then(({ data }) => {
      if (!data?.overdue) return;
      const key = `odeme-uyari-${new Date().toDateString()}-${sid}`;
      if (!sessionStorage.getItem(key)) {
        setDaysLate(data.daysLate);
        setOverdueModal(true);
        sessionStorage.setItem(key, "1");
      }
    });
  }

  useEffect(() => {
    const sid = getActiveStudentId();
    applyStudentId(sid);

    apiFetch<ParentData>("/api/veli/ogrenci").then(({ data }) => {
      if (data) setData(data);
    });

    checkOverdue(sid);
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000);

    function onStudentChanged(e: Event) {
      const detail = (e as CustomEvent<{ studentId: string }>).detail;
      applyStudentId(detail.studentId);
      checkOverdue(detail.studentId);
      // Re-fetch öğrenci verisi yeni firma/şoför bilgisi için
      apiFetch<ParentData>("/api/veli/ogrenci").then(({ data }) => {
        if (data) setData(data);
      });
      apiFetch<TrackingData>(`/api/veli/sofor-konum?studentId=${detail.studentId}`).then(({ data }) => {
        if (data) setTracking(data);
      });
    }
    window.addEventListener("veli-student-changed", onStudentChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener("veli-student-changed", onStudentChanged);
    };
  }, [fetchTracking]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    const { data: res, error } = await apiFetch<{ studentId: string }>("/api/veli/ogrenci-ekle", {
      method: "POST",
      body: JSON.stringify(addForm),
    });
    setAddLoading(false);
    if (error) return toast.error(error);
    toast.success("Öğrenci hesabınıza eklendi!");
    setAddStudentOpen(false);
    setAddForm({ firmCode: "", studentTcId: "" });
    if (res?.studentId) {
      applyStudentId(res.studentId);
      setActiveStudentId(res.studentId);
      window.dispatchEvent(new CustomEvent("veli-student-changed", { detail: { studentId: res.studentId } }));
    }
    // Öğrenci listesini güncelle
    apiFetch<ParentData>("/api/veli/ogrenci").then(({ data }) => {
      if (data) setData(data);
    });
  }

  if (!data) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;

  const student = data.students.find((s) => s.id === activeStudentId) ?? data.students[0];
  const hasDriver = !!student?.driver;
  const isActive = tracking?.tripActive && tracking.driver;
  const hasLocation = isActive && tracking!.driver!.lat != null && tracking!.driver!.lng != null;

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Gecikmiş ödeme uyarısı */}
      <Dialog open={overdueModal} onOpenChange={setOverdueModal}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="text-center py-2">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Ödeme Gecikti</h2>
            <p className="text-gray-600 text-sm mb-1">
              Ödemeniz <strong>{daysLate} gün</strong> gecikmiştir.
            </p>
            <p className="text-gray-600 text-sm mb-5">
              Lütfen en kısa sürede ödemenizi yapınız.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOverdueModal(false)}>
                Tamam
              </Button>
              <Link href="/veli/odeme" className="flex-1">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Öde</Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Öğrenci Ekle dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Öğrenci Ekle</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Aynı veya farklı firmadan başka bir öğrenci ekleyebilirsiniz.</p>
          <form onSubmit={handleAddStudent} className="space-y-4 mt-2">
            <div>
              <Label>Firma Kodu</Label>
              <Input
                value={addForm.firmCode}
                onChange={(e) => setAddForm({ ...addForm, firmCode: e.target.value.trim() })}
                className="mt-1 font-mono"
                placeholder="Servis firmasının kodu"
                required
              />
            </div>
            <div>
              <Label>Öğrenci TC Kimlik No</Label>
              <Input
                value={addForm.studentTcId}
                onChange={(e) => setAddForm({ ...addForm, studentTcId: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                className="mt-1"
                inputMode="numeric"
                maxLength={11}
                placeholder="11 haneli TC kimlik numarası"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={addLoading}>
              {addLoading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Öğrenci Kartı */}
      {student && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">
                {student.firstName || "—"} {student.lastName}
              </p>
              <p className="text-sm text-gray-500">{student.school || "Okul girilmedi"}</p>
              <p className="text-sm text-gray-500">
                {student.class || "Sınıf girilmedi"} · {student.studyTime === "MORNING" ? "Sabah" : "Öğlen"}
              </p>
            </div>
          </div>

          {student.driver ? (
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-xs font-semibold text-green-700 mb-1.5">SERVİS BİLGİLERİ</p>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>🚌 {student.driver.plateNumber ?? "Plaka yok"}</span>
                  <CopyPhone phone={student.driver.phone} className="text-xs text-green-700" />
                </div>
                <p>👨‍✈️ {student.driver.firstName} {student.driver.lastName}</p>
                {student.driver.assistantName && (
                  <p>👩‍✈️ Hostes: {student.driver.assistantName}</p>
                )}
                {student.serviceStartDate && (
                  <p className="text-xs text-green-600 pt-1 border-t border-green-200 mt-1">
                    📅 Başlangıç: {new Date(student.serviceStartDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100 text-sm text-yellow-700">
              Henüz şoför atanmamış. Firma ile iletişime geçin.
            </div>
          )}
        </div>
      )}

      {/* Servis Takibi */}
      {hasDriver && isActive && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Servis Takibi</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {routeTypeLabel(tracking!.route!.type)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Canlı
            </div>
          </div>

          {hasLocation ? (
            <DriverTrackingMap
              driverLat={tracking!.driver!.lat!}
              driverLng={tracking!.driver!.lng!}
              driverName={`${tracking!.driver!.firstName} ${tracking!.driver!.lastName}`}
              homeLat={tracking!.pickup?.lat}
              homeLng={tracking!.pickup?.lng}
              routeGeometry={tracking!.routeGeometry}
              height={260}
            />
          ) : (
            <div className="mx-4 mb-3 bg-gray-50 rounded-xl flex flex-col items-center justify-center py-10 border border-dashed border-gray-200">
              <MapPin className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 font-medium">Konum bekleniyor…</p>
              <p className="text-xs text-gray-400 mt-1">Şoför konumu kısa süre içinde görünecek</p>
            </div>
          )}

          <div className="px-5 pb-4 pt-3">
            {tracking!.eta != null && tracking!.distance != null ? (
              <div className="flex gap-3">
                <div className="flex-1 bg-blue-50 rounded-xl py-3 text-center border border-blue-100">
                  <p className="text-2xl font-bold text-blue-700 leading-none">{tracking!.eta}</p>
                  <p className="text-xs text-blue-500 mt-1">dakika tahmini</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl py-3 text-center border border-gray-100">
                  <p className="text-2xl font-bold text-gray-700 leading-none">
                    {tracking!.distance! >= 1000
                      ? `${(tracking!.distance! / 1000).toFixed(1)}`
                      : tracking!.distance}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {tracking!.distance! >= 1000 ? "km uzakta" : "m uzakta"}
                  </p>
                </div>
              </div>
            ) : tracking!.driver?.lat == null ? null : (
              <p className="text-xs text-gray-400 text-center">
                Durak konumunuzu profilinizden ekleyin (tahmini süre hesaplanmaz)
              </p>
            )}
            {tracking!.driver?.updatedAt && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Konum {timeAgo(tracking!.driver.updatedAt)} güncellendi
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/veli/profil?edit=true"
          className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 hover:border-purple-200 transition-all">
          <p className="text-sm font-semibold text-gray-900">Bilgileri Düzenle</p>
          <p className="text-xs text-gray-500 mt-0.5">Profil &amp; Öğrenci</p>
        </Link>
        <Link href="/veli/odeme"
          className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 hover:border-purple-200 transition-all">
          <p className="text-sm font-semibold text-gray-900">Ödemeler</p>
          <p className="text-xs text-gray-500 mt-0.5">Ödeme tablosu</p>
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setAddStudentOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-purple-200 text-purple-600 text-sm font-medium hover:bg-purple-50 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Öğrenci Ekle
      </button>
    </div>
  );
}
