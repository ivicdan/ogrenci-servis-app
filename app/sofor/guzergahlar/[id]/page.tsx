"use client";
import { useEffect, useState, use, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, CheckCircle, XCircle, ChevronUp, ChevronDown, UserPlus, CheckCheck, RotateCcw, Map, Play, Undo2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { CopyPhone } from "@/components/copy-phone";
import type { StudentMapPoint } from "@/components/route-map";

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false });

interface Attendance { status: string; type: string; }

interface AbsenceReport {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  class: string;
  teacher: string | null;
  studyTime: string;
  routeId: string | null;
  dropoffRouteId: string | null;
  routeOrder: number;
  dropoffRouteOrder: number;
  parent: {
    firstName: string;
    lastName: string;
    phone: string;
    spouseFirstName: string | null;
    spouseLastName: string | null;
    spousePhone: string | null;
    pickupLat: number | null;
    pickupLng: number | null;
  } | null;
  attendances: Attendance[];
  absenceReports: AbsenceReport[];
}

interface Route {
  id: string;
  name: string;
  type: string;
  tripStartedAt: string | null;
  students: Student[];
}

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, "0")}.${(dt.getMonth() + 1).toString().padStart(2, "0")}.${dt.getFullYear()}`;
}

export default function GuzergahDetay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [route, setRoute] = useState<Route | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [orderedStudents, setOrderedStudents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const [osrmRoute, setOsrmRoute] = useState<[number, number][] | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeRef = useRef<Route | null>(null);
  const osrmRouteRef = useRef<[number, number][] | null>(null);
  const rerouting = useRef(false);
  const deviationToastRef = useRef(false);
  const sendLocationRef = useRef<(() => void) | null>(null);

  useEffect(() => { loadRoute(); }, [id]);

  // routeRef'i güncel tut
  useEffect(() => { routeRef.current = route; }, [route]);

  const fetchOsrmToStudent = useCallback(async (
    fromLat: number, fromLng: number,
    toLat: number, toLng: number
  ): Promise<[number, number][] | null> => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
        { signal: ctrl.signal }
      );
      clearTimeout(t);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes?.[0]) return null;
      return data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      );
    } catch { return null; }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    function minDistToRoute(lat: number, lng: number, coords: [number, number][]): number {
      let min = Infinity;
      const R = 6371000;
      for (const [clat, clng] of coords) {
        const dLat = (clat - lat) * Math.PI / 180;
        const dLng = (clng - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(clat*Math.PI/180)*Math.sin(dLng/2)**2;
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (d < min) min = d;
      }
      return min;
    }

    async function handleLocation(lat: number, lng: number) {
      setDriverLat(lat);
      setDriverLng(lng);
      apiFetch("/api/sofor/konum", { method: "POST", body: JSON.stringify({ lat, lng }) });

      const cur = routeRef.current;
      if (!cur || rerouting.current) return;

      const isPickup = cur.type.includes("PICKUP");
      const attType = isPickup ? "PICKUP" : "DROPOFF";

      // Sıradaki bekleyen öğrenciyi bul
      const nextStudent = [...cur.students]
        .sort((a, b) => (isPickup ? a.routeOrder - b.routeOrder : (a as unknown as {dropoffRouteOrder: number}).dropoffRouteOrder - (b as unknown as {dropoffRouteOrder: number}).dropoffRouteOrder))
        .find(s => {
          const att = s.attendances.find(a => a.type === attType);
          return (!att || att.status === "PENDING") && s.parent?.pickupLat && s.parent?.pickupLng;
        });

      if (!nextStudent?.parent?.pickupLat || !nextStudent?.parent?.pickupLng) return;

      const currentOsrm = osrmRouteRef.current;
      const THRESHOLD = 200; // metre

      let needsReroute = !currentOsrm || currentOsrm.length === 0;
      if (!needsReroute && currentOsrm) {
        const dist = minDistToRoute(lat, lng, currentOsrm);
        if (dist > THRESHOLD) {
          needsReroute = true;
          if (!deviationToastRef.current) {
            toast.info("Güzergahtan çıkıldı — alternatif rota hesaplanıyor", { duration: 2500 });
            deviationToastRef.current = true;
            setTimeout(() => { deviationToastRef.current = false; }, 60000);
          }
        }
      }

      if (needsReroute) {
        rerouting.current = true;
        const coords = await fetchOsrmToStudent(lat, lng, nextStudent.parent.pickupLat, nextStudent.parent.pickupLng);
        rerouting.current = false;
        if (coords) {
          osrmRouteRef.current = coords;
          setOsrmRoute(coords);
        }
      }
    }

    function sendLocation() {
      navigator.geolocation.getCurrentPosition((pos) => {
        handleLocation(pos.coords.latitude, pos.coords.longitude);
      });
    }
    sendLocationRef.current = sendLocation;
    sendLocation();
    locationIntervalRef.current = setInterval(sendLocation, 15000);
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, [fetchOsrmToStudent]);

  async function loadRoute() {
    const [{ data: r }, { data: s }] = await Promise.all([
      apiFetch<Route>(`/api/sofor/guzergahlar/${id}`),
      apiFetch<Student[]>("/api/sofor/ogrenciler"),
    ]);
    if (r) {
      setRoute(r);
      routeRef.current = r; // ref'i anında güncelle, state bekleme
    }
    if (s) setAllStudents(s);
    setLoading(false);
  }

  function openEdit() {
    if (!route) return;
    setOrderedStudents(route.students.map((s) => s.id));
    setEditOpen(true);
  }

  function toggleStudent(sid: string) {
    setOrderedStudents((prev) => prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]);
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setOrderedStudents((prev) => { const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; });
  }

  function moveDown(idx: number) {
    setOrderedStudents((prev) => {
      if (idx === prev.length - 1) return prev;
      const n = [...prev]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n;
    });
  }

  async function saveStudents() {
    setSaving(true);
    const { error } = await apiFetch(`/api/sofor/guzergahlar/${id}`, {
      method: "PUT",
      body: JSON.stringify({ students: orderedStudents.map((sid, i) => ({ id: sid, order: i + 1 })) }),
    });
    setSaving(false);
    if (error) return toast.error(error);
    toast.success("Güzergah öğrencileri güncellendi!");
    setEditOpen(false);
    loadRoute();
  }

  async function startTrip() {
    setStarting(true);
    const { error } = await apiFetch(`/api/sofor/guzergahlar/${id}/baslat`, { method: "POST" });
    setStarting(false);
    if (error) return toast.error(error);
    toast.success("Sefer başlatıldı!");
    loadRoute();
  }

  async function cancelTrip() {
    setCanceling(true);
    const { error } = await apiFetch(`/api/sofor/guzergahlar/${id}/baslat`, { method: "DELETE" });
    setCanceling(false);
    if (error) return toast.error(error);
    toast.success("Sefer iptal edildi.");
    loadRoute();
  }

  async function completeTrip() {
    setCompleting(true);
    const { data, error } = await apiFetch<{ notified: number }>(`/api/sofor/guzergahlar/${id}/tamamla`, { method: "POST" });
    setCompleting(false);
    if (error) return toast.error(error);
    toast.success(`Sefer tamamlandı! ${data?.notified ?? 0} veliye bildirim gönderildi.`);
    loadRoute();
  }

  async function resetAttendance(studentId: string, type: "PICKUP" | "DROPOFF") {
    setProcessing(studentId + type + "reset");
    await apiFetch("/api/sofor/yoklama/sifirla", { method: "POST", body: JSON.stringify({ studentId, type }) });
    setProcessing(null);
    loadRoute();
  }

  async function markAttendance(studentId: string, status: "PICKED_UP" | "ABSENT") {
    const attendType = route?.type.includes("PICKUP") ? "PICKUP" : "DROPOFF";
    setProcessing(studentId + attendType);
    const { error } = await apiFetch("/api/sofor/yoklama", {
      method: "POST",
      body: JSON.stringify({ studentId, type: attendType, status }),
    });
    setProcessing(null);
    if (error) return toast.error(error);
    toast.success(status === "PICKED_UP" ? "✓ Alındı işaretlendi" : "Devamsız işaretlendi");
    await loadRoute();
    sendLocationRef.current?.(); // sıradaki öğrenci için hemen rota oluştur
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;
  if (!route) return <div className="text-center py-12 text-gray-400">Güzergah bulunamadı</div>;

  const isDropoffRoute = route.type.includes("DROPOFF");
  const tripStarted = !!route.tripStartedAt;
  const backHref = `/sofor/guzergahlar?tab=${isDropoffRoute ? "donus" : "gidis"}`;

  const routeTypeLabel: Record<string, string> = {
    MORNING_PICKUP: "Sabah Gidiş",
    AFTERNOON_PICKUP: "Öğlen Gidiş",
    MORNING_DROPOFF: "Öğlen Çıkış",
    AFTERNOON_DROPOFF: "Akşam Çıkış",
  };
  const studentMap = Object.fromEntries(allStudents.map((s) => [s.id, s]));

  // Start point only makes sense for pickup routes
  const startStudent = !isDropoffRoute ? route.students.find(
    (s) => s.parent?.pickupLat && s.parent?.pickupLng && s.absenceReports.length === 0
      && !s.attendances.find((a) => a.type === "PICKUP" && (a.status === "NOTIFIED_ABSENT" || a.status === "ABSENT"))
  ) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{route.name}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDropoffRoute ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                {isDropoffRoute ? "Eve Dönüş" : "Okula Gidiş"}
              </span>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              {routeTypeLabel[route.type] ?? route.type} · {route.students.length} öğrenci
              {tripStarted && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDropoffRoute ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>Sefer Aktif</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {!tripStarted ? (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={startTrip} disabled={starting}>
                <Play className="w-3.5 h-3.5 mr-1" /> {starting ? "..." : "Sefere Başla"}
              </Button>
              <Button size="sm" variant="outline" onClick={openEdit} className="border-green-200 text-green-700 hover:bg-green-50">
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Düzenle
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setMapOpen((v) => !v)}>
                <Map className="w-3.5 h-3.5 mr-1" /> Harita
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={completeTrip} disabled={completing}>
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> {completing ? "..." : "Sefer Tamamlandı"}
              </Button>
              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={cancelTrip} disabled={canceling}>
                <Undo2 className="w-3.5 h-3.5 mr-1" /> {canceling ? "..." : "Geri Al"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Başlangıç noktası — sadece gidiş seferlerinde */}
      {tripStarted && startStudent && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4 text-sm text-blue-800 flex items-center gap-2">
          <Play className="w-4 h-4 flex-shrink-0" />
          <span>
            <span className="font-semibold">Başlangıç:</span> {startStudent.firstName} {startStudent.lastName} konumu
            {startStudent.parent?.pickupLat && (
              <span className="text-xs ml-1 text-blue-500">
                ({startStudent.parent.pickupLat.toFixed(5)}, {startStudent.parent.pickupLng?.toFixed(5)})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Öğrenci Düzenleme Dialogu */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>Güzergah Öğrencileri</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 -mt-2">Öğrenci ekleyin, çıkarın ve sıralarını düzenleyin.</p>

          {orderedStudents.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-xs font-semibold text-gray-600 mb-1">Sıralama</p>
              {orderedStudents.map((sid, idx) => {
                const s = studentMap[sid] ?? allStudents.find((x) => x.id === sid);
                if (!s) return null;
                return (
                  <div key={sid} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                    <span className="text-xs font-bold text-green-700 w-5 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">{s.class}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0} className="disabled:opacity-30 text-gray-500 hover:text-green-600">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => moveDown(idx)} disabled={idx === orderedStudents.length - 1} className="disabled:opacity-30 text-gray-500 hover:text-green-600">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => toggleStudent(sid)} className="text-xs text-red-400 hover:text-red-600 px-1">✕</button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1 mt-3">
            <p className="text-xs font-semibold text-gray-600 mb-1">Tüm Öğrenciler</p>
            {allStudents.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Henüz atanmış öğrenci yok.</p>
            )}
            {allStudents.map((s) => {
              const selected = orderedStudents.includes(s.id);
              return (
                <label key={s.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${selected ? "border-green-200 bg-green-50 opacity-50" : "border-gray-100 hover:bg-gray-50"}`}>
                  <input type="checkbox" checked={selected} onChange={() => toggleStudent(s.id)} className="w-4 h-4 rounded text-green-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500">{s.class}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>İptal</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={saveStudents} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Güzergah Haritası */}
      {mapOpen && (() => {
        const mapPoints: StudentMapPoint[] = route.students
          .filter((s) => s.parent?.pickupLat && s.parent?.pickupLng)
          .map((s) => {
            const pickupAtt = s.attendances.find((a) => a.type === "PICKUP");
            const dropoffAtt = s.attendances.find((a) => a.type === "DROPOFF");
            const relevantAtt = isDropoffRoute ? dropoffAtt : pickupAtt;
            const hasAbsenceReport = s.absenceReports.some((r) =>
              isDropoffRoute ? r.type === "DROPOFF" || r.type === "BOTH" : r.type === "PICKUP" || r.type === "BOTH"
            );
            let status: StudentMapPoint["status"] = "pending";
            if (!isDropoffRoute && dropoffAtt?.status === "PICKED_UP") status = "dropped_off";
            else if (relevantAtt?.status === "PICKED_UP") status = "picked_up";
            else if (relevantAtt?.status === "ABSENT") status = "absent";
            else if (relevantAtt?.status === "NOTIFIED_ABSENT" || hasAbsenceReport) status = "notified_absent";
            return {
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              lat: s.parent!.pickupLat!,
              lng: s.parent!.pickupLng!,
              status,
              routeOrder: s.routeOrder,
            };
          });

        if (mapPoints.length === 0) {
          return (
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-center text-sm text-gray-400">
              Haritada gösterilecek konum girilmemiş.
            </div>
          );
        }

        return (
          <div className="mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="bg-white px-4 py-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 border-b border-gray-100">
              <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Bekliyor
              <span className="w-3 h-3 rounded-full bg-green-600 inline-block ml-1" /> {isDropoffRoute ? "Servise Bindi" : "Alındı"}
              {!isDropoffRoute && <><span className="w-3 h-3 rounded-full bg-blue-600 inline-block ml-1" /> İndirildi</>}
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block ml-1" /> Gelmeyecek
            </div>
            <RouteMap students={mapPoints} driverLat={driverLat} driverLng={driverLng} osrmRoute={osrmRoute} height={300} />
          </div>
        );
      })()}

      {/* Öğrenci Kartları */}
      <div className="space-y-3">
        {route.students.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Bu güzergahta öğrenci yok.</p>
            <p className="text-xs mt-1">"Düzenle" ile öğrenci ekleyin.</p>
          </div>
        )}
        {route.students.map((student, idx) => {
          const pickupAtt = student.attendances.find((a) => a.type === "PICKUP");
          const dropoffAtt = student.attendances.find((a) => a.type === "DROPOFF");

          // State depends on route type
          const relevantAtt = isDropoffRoute ? dropoffAtt : pickupAtt;
          const isPickedUp = relevantAtt?.status === "PICKED_UP";
          const isMarkedAbsent = relevantAtt?.status === "ABSENT";
          const isNotifiedAbsent = relevantAtt?.status === "NOTIFIED_ABSENT";

          // Absence reports: filter by route type
          const activeAbsence = student.absenceReports.find((r) =>
            isDropoffRoute
              ? r.type === "DROPOFF" || r.type === "BOTH"
              : r.type === "PICKUP" || r.type === "BOTH"
          );
          const isAbsent = !!activeAbsence || isNotifiedAbsent;

          // "Okula İndirildi" only for pickup routes (from sefer tamamlandı)
          const isDroppedOff = !isDropoffRoute && dropoffAtt?.status === "PICKED_UP";

          const processingKey = processing?.startsWith(student.id);

          const cardColor = isAbsent
            ? "border-orange-300 bg-orange-50"
            : isMarkedAbsent
            ? "border-red-200 bg-red-50"
            : isPickedUp
            ? "border-green-200 bg-green-50"
            : "border-gray-100";

          return (
            <div key={student.id} className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${cardColor}`}>
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 text-right flex-shrink-0">{idx + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>

                    {/* Yoklama / devamsızlık rozetleri */}
                    {isAbsent && !isPickedUp && (
                      <>
                        <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          Gelmeyecek
                          {activeAbsence && (() => {
                            const s = fmtDate(activeAbsence.startDate);
                            const e = fmtDate(activeAbsence.endDate);
                            return s === e ? ` (${s})` : ` (${s}–${e})`;
                          })()}
                        </span>
                        {!activeAbsence && (
                          <button
                            onClick={() => resetAttendance(student.id, isDropoffRoute ? "DROPOFF" : "PICKUP")}
                            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-0.5 border border-gray-200 rounded-full px-1.5 py-0.5 bg-white"
                          >
                            <RotateCcw className="w-3 h-3" /> Düzenle
                          </button>
                        )}
                      </>
                    )}

                    {isMarkedAbsent && (
                      <>
                        <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          {isDropoffRoute ? "Okulda Değil" : "Servise Binmedi"}
                        </span>
                        <button
                          onClick={() => resetAttendance(student.id, isDropoffRoute ? "DROPOFF" : "PICKUP")}
                          className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-0.5 border border-gray-200 rounded-full px-1.5 py-0.5 bg-white"
                        >
                          <RotateCcw className="w-3 h-3" /> Düzenle
                        </button>
                      </>
                    )}

                    {isPickedUp && !isDroppedOff && (
                      <>
                        <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          {isDropoffRoute ? "Servise Bindi" : "Alındı"}
                        </span>
                        <button
                          onClick={() => resetAttendance(student.id, isDropoffRoute ? "DROPOFF" : "PICKUP")}
                          className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-0.5 border border-gray-200 rounded-full px-1.5 py-0.5 bg-white"
                        >
                          <RotateCcw className="w-3 h-3" /> Düzenle
                        </button>
                      </>
                    )}

                    {isDroppedOff && (
                      <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium">Okula İndirildi</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {student.class}{student.teacher && ` · ${student.teacher}`}
                  </p>
                </div>
              </div>

              {student.parent && (
                <div className="text-xs text-gray-500 space-y-0.5 mb-3 ml-7">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>👤 {student.parent.firstName} {student.parent.lastName}</span>
                    <CopyPhone phone={student.parent.phone} className="text-blue-500" />
                  </div>
                  {student.parent.spouseFirstName && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>👤 {student.parent.spouseFirstName} {student.parent.spouseLastName}</span>
                      {student.parent.spousePhone && <CopyPhone phone={student.parent.spousePhone} className="text-blue-500" />}
                    </div>
                  )}
                </div>
              )}

              {/* Alındı / Yok butonları — sadece sefer aktifken ve daha önce işaretlenmemişse */}
              {tripStarted && !isAbsent && !isMarkedAbsent && !isPickedUp && (
                <div className="flex gap-2 ml-7 flex-wrap">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 min-w-[80px]"
                    onClick={() => markAttendance(student.id, "PICKED_UP")}
                    disabled={!!processingKey}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    {processingKey ? "..." : (isDropoffRoute ? "Servise Bindi" : "Alındı")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 min-w-[80px]"
                    onClick={() => markAttendance(student.id, "ABSENT")}
                    disabled={!!processingKey}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    {isDropoffRoute ? "Okulda Yok" : "Yok"}
                  </Button>
                </div>
              )}

              {!tripStarted && !isAbsent && !isMarkedAbsent && !isPickedUp && (
                <p className="ml-7 text-xs text-gray-400 italic">Sefere başlamak için "Sefere Başla" butonuna basın.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
