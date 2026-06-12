"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, CheckCircle, XCircle, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  parent: {
    firstName: string;
    lastName: string;
    phone: string;
    spouseName: string | null;
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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadRoute(); }, [id]);

  async function loadRoute() {
    const { data } = await apiFetch<Route>(`/api/sofor/guzergahlar/${id}`);
    if (data) setRoute(data);
    setLoading(false);
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
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sofor/guzergahlar" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{route.name}</h1>
          <p className="text-sm text-gray-500">{route.students.length} öğrenci</p>
        </div>
      </div>

      <div className="space-y-3">
        {route.students.map((student) => {
          const todayAttendance = student.attendances[0];
          const isAbsent = todayAttendance?.status === "NOTIFIED_ABSENT";
          const isPickedUp = todayAttendance?.status === "PICKED_UP";

          return (
            <div
              key={student.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                isAbsent
                  ? "border-orange-300 bg-orange-50"
                  : isPickedUp
                  ? "border-green-300 bg-green-50"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </p>
                    {isAbsent && (
                      <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        Gelmeyecek
                      </span>
                    )}
                    {isPickedUp && (
                      <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Alındı
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {student.class}
                    {student.teacher && ` · ${student.teacher}`}
                    {" · "}
                    {student.studyTime === "MORNING" ? "Sabah" : "Öğlen"}
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
                  {student.parent.spouseName && (
                    <div className="flex items-center gap-1">
                      <span>👤 {student.parent.spouseName}</span>
                      {student.parent.spousePhone && (
                        <a href={`tel:${student.parent.spousePhone}`} className="text-blue-500">
                          <Phone className="w-3 h-3" />
                        </a>
                      )}
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
