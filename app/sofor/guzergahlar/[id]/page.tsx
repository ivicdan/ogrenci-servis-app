"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, CheckCircle, XCircle, Phone, UserPlus } from "lucide-react";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

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
    setSelectedIds(new Set(route.students.map((s) => s.id)));
    setEditOpen(true);
  }

  function toggleStudent(sid: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(sid) ? next.delete(sid) : next.add(sid);
      return next;
    });
  }

  async function saveStudents() {
    setSaving(true);
    const { error } = await apiFetch(`/api/sofor/guzergahlar/${id}`, {
      method: "PUT",
      body: JSON.stringify({ studentIds: Array.from(selectedIds) }),
    });
    setSaving(false);
    if (error) return toast.error(error);
    toast.success("Güzergah öğrencileri güncellendi!");
    setEditOpen(false);
    loadRoute();
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
        <Button size="sm" variant="outline" onClick={openEdit} className="border-green-200 text-green-700 hover:bg-green-50">
          <UserPlus className="w-4 h-4 mr-1" /> Öğrenci Düzenle
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm mx-auto max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Güzergah Öğrencileri</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 -mt-2">Güzergaha eklemek istediğiniz öğrencileri seçin.</p>
          <div className="flex-1 overflow-y-auto space-y-2 mt-3">
            {allStudents.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Henüz atanmış öğrenci yok.</p>
            )}
            {allStudents.map((s) => (
              <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(s.id)}
                  onChange={() => toggleStudent(s.id)}
                  className="w-4 h-4 rounded text-green-600"
                />
                <div>
                  <p className="font-medium text-sm text-gray-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-500">{s.class} · {s.studyTime === "MORNING" ? "Sabah" : "Öğlen"}</p>
                </div>
              </label>
            ))}
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
        {route.students.map((student) => {
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

              {student.parent && (
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
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
                <div className="flex gap-2">
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
