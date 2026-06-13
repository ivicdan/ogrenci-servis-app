"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, CheckCircle, XCircle, Phone, UserPlus, ChevronUp, ChevronDown, CheckCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface Attendance {
  status: string;
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
  routeOrder: number;
  parent: {
    firstName: string;
    lastName: string;
    phone: string;
    spouseFirstName: string | null;
    spouseLastName: string | null;
    spousePhone: string | null;
  } | null;
  attendances: Attendance[];
}

interface Route {
  id: string;
  name: string;
  type: string;
  students: Student[];
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

  useEffect(() => { loadRoute(); }, [id]);

  async function loadRoute() {
    const [{ data: r }, { data: s }] = await Promise.all([
      apiFetch<Route>(`/api/sofor/guzergahlar/${id}`),
      apiFetch<Student[]>("/api/sofor/ogrenciler"),
    ]);
    if (r) setRoute(r);
    if (s) setAllStudents(s);
    setLoading(false);
  }

  function openEdit() {
    if (!route) return;
    // Güzergahtaki öğrencileri mevcut sıraya göre başlat
    setOrderedStudents(route.students.map((s) => s.id));
    setEditOpen(true);
  }

  function toggleStudent(sid: string) {
    setOrderedStudents((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setOrderedStudents((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    setOrderedStudents((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  async function saveStudents() {
    setSaving(true);
    const { error } = await apiFetch(`/api/sofor/guzergahlar/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        students: orderedStudents.map((sid, i) => ({ id: sid, order: i + 1 })),
      }),
    });
    setSaving(false);
    if (error) return toast.error(error);
    toast.success("Güzergah öğrencileri güncellendi!");
    setEditOpen(false);
    loadRoute();
  }

  async function completeTrip() {
    setCompleting(true);
    const { error } = await apiFetch(`/api/sofor/guzergahlar/${id}/tamamla`, { method: "POST" });
    setCompleting(false);
    if (error) return toast.error(error);
    toast.success("Sefer tamamlandı! Velilere bildirim gönderildi.");
  }

  async function markAttendance(studentId: string, status: "PICKED_UP" | "ABSENT") {
    setProcessing(studentId);
    const type = route?.type?.includes("PICKUP") ? "PICKUP" : "DROPOFF";
    const { error } = await apiFetch("/api/sofor/yoklama", {
      method: "POST",
      body: JSON.stringify({ studentId, type, status }),
    });
    setProcessing(null);
    if (error) return toast.error(error);
    toast.success(status === "PICKED_UP" ? "✓ Alındı işaretlendi" : "Devamsız işaretlendi");
    loadRoute();
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;
  if (!route) return <div className="text-center py-12 text-gray-400">Güzergah bulunamadı</div>;

  const studentMap = Object.fromEntries(allStudents.map((s) => [s.id, s]));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/sofor/guzergahlar" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{route.name}</h1>
            <p className="text-sm text-gray-500">{route.students.length} öğrenci</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={completeTrip}
            disabled={completing}
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            {completing ? "..." : "Sefer Tamamlandı"}
          </Button>
          <Button size="sm" variant="outline" onClick={openEdit} className="border-green-200 text-green-700 hover:bg-green-50">
            <UserPlus className="w-4 h-4 mr-1" /> Öğrenci Düzenle
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Güzergah Öğrencileri</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 -mt-2">Öğrenci ekleyin, çıkarın ve sıralarını düzenleyin.</p>

          {/* Seçilmiş öğrenciler — sıralı */}
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
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="disabled:opacity-30 text-gray-500 hover:text-green-600"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === orderedStudents.length - 1}
                        className="disabled:opacity-30 text-gray-500 hover:text-green-600"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => toggleStudent(sid)}
                      className="text-xs text-red-400 hover:text-red-600 px-1"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tüm öğrenciler — checkbox seçim */}
          <div className="flex-1 overflow-y-auto space-y-1 mt-3">
            <p className="text-xs font-semibold text-gray-600 mb-1">Tüm Öğrenciler</p>
            {allStudents.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Henüz atanmış öğrenci yok.</p>
            )}
            {allStudents.map((s) => {
              const selected = orderedStudents.includes(s.id);
              return (
                <label key={s.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  selected ? "border-green-200 bg-green-50 opacity-50" : "border-gray-100 hover:bg-gray-50"
                }`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleStudent(s.id)}
                    className="w-4 h-4 rounded text-green-600"
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500">{s.class} · {s.studyTime === "MORNING" ? "Sabah" : "Öğlen"}</p>
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

      <div className="space-y-3">
        {route.students.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Bu güzergahta öğrenci yok.</p>
            <p className="text-xs mt-1">"Öğrenci Düzenle" ile öğrenci ekleyin.</p>
          </div>
        )}
        {route.students.map((student, idx) => {
          const todayAttendance = student.attendances[0];
          const isAbsent = todayAttendance?.status === "NOTIFIED_ABSENT";
          const isPickedUp = todayAttendance?.status === "PICKED_UP";

          return (
            <div
              key={student.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                isAbsent ? "border-orange-300 bg-orange-50" : isPickedUp ? "border-green-300 bg-green-50" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 text-right">{idx + 1}.</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                      {isAbsent && (
                        <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-medium">Gelmeyecek</span>
                      )}
                      {isPickedUp && (
                        <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">Alındı</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {student.class}{student.teacher && ` · ${student.teacher}`}{" · "}{student.studyTime === "MORNING" ? "Sabah" : "Öğlen"}
                    </p>
                  </div>
                </div>
              </div>

              {student.parent && (
                <div className="text-xs text-gray-500 space-y-0.5 mb-3 ml-7">
                  <div className="flex items-center gap-1">
                    <span>👤 {student.parent.firstName} {student.parent.lastName}</span>
                    <a href={`tel:${student.parent.phone}`} className="text-blue-500 hover:text-blue-700">
                      <Phone className="w-3 h-3" />
                    </a>
                    <span>{student.parent.phone}</span>
                  </div>
                  {student.parent.spouseFirstName && (
                    <div className="flex items-center gap-1">
                      <span>👤 {student.parent.spouseFirstName} {student.parent.spouseLastName}</span>
                      {student.parent.spousePhone && (
                        <a href={`tel:${student.parent.spousePhone}`} className="text-blue-500">
                          <Phone className="w-3 h-3" />
                        </a>
                      )}
                      {student.parent.spousePhone && <span>{student.parent.spousePhone}</span>}
                    </div>
                  )}
                </div>
              )}

              {!isPickedUp && !isAbsent && (
                <div className="flex gap-2 ml-7">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => markAttendance(student.id, "PICKED_UP")}
                    disabled={processing === student.id}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    {processing === student.id ? "..." : "Alındı"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => markAttendance(student.id, "ABSENT")}
                    disabled={processing === student.id}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Yok
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
