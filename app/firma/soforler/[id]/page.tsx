"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bus, ArrowLeft, GraduationCap, Phone, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

const studyTimeLabel: Record<string, string> = {
  MORNING: "Sabah",
  AFTERNOON: "Öğleden Sonra",
};

const routeTypeLabel: Record<string, string> = {
  MORNING_PICKUP: "Sabah Alış",
  MORNING_DROPOFF: "Sabah Bırakış",
  AFTERNOON_PICKUP: "Öğle Alış",
  AFTERNOON_DROPOFF: "Öğle Bırakış",
};

interface DriverDetail {
  id: string;
  driverCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  tcId: string;
  plateNumber: string | null;
  assistantName: string | null;
  status: string;
  createdAt: string;
  _count: { students: number; routes: number };
  students: {
    id: string;
    firstName: string;
    lastName: string;
    school: string;
    class: string;
    studyTime: string;
    parent: { firstName: string; lastName: string; phone: string } | null;
  }[];
  routes: { id: string; name: string; type: string }[];
}

export default function SoforDetay() {
  const params = useParams();
  const router = useRouter();
  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DriverDetail>(`/api/firma/soforler/${params.id}`)
      .then(({ data }) => { if (data) setDriver(data); })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;
  if (!driver) return <div className="text-center py-12 text-gray-400">Şoför bulunamadı.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-start gap-4">
          <div className="bg-green-100 rounded-2xl p-3">
            <Bus className="w-7 h-7 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{driver.firstName} {driver.lastName}</h1>
                <span className="font-mono text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                  {driver.driverCode}
                </span>
              </div>
              <Badge variant={driver.status === "ACTIVE" ? "default" : "secondary"}>
                {driver.status === "ACTIVE" ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {driver.phone}</p>
              {driver.plateNumber && <p>🚌 Plaka: {driver.plateNumber}</p>}
              {driver.assistantName && <p>👤 Hostes: {driver.assistantName}</p>}
              <p className="text-xs text-gray-400">
                Kayıt: {new Date(driver.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-center">
          <div className="flex-1">
            <p className="text-2xl font-bold text-gray-900">{driver._count.students}</p>
            <p className="text-xs text-gray-500">Öğrenci</p>
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-gray-900">{driver._count.routes}</p>
            <p className="text-xs text-gray-500">Güzergah</p>
          </div>
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
                <span className="text-gray-800">{r.name}</span>
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                  {routeTypeLabel[r.type] ?? r.type}
                </span>
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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500">{s.school} · {s.class} · {studyTimeLabel[s.studyTime]}</p>
                  </div>
                </div>
                {s.parent && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    👤 {s.parent.firstName} {s.parent.lastName} · {s.parent.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {driver.students.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Bu şoföre henüz öğrenci atanmamış</p>
        </div>
      )}
    </div>
  );
}
