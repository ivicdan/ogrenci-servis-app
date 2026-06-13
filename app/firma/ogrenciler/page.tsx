"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Search } from "lucide-react";
import { CopyPhone } from "@/components/copy-phone";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  tcId: string;
  school: string;
  class: string;
  teacher: string | null;
  studyTime: string;
  status: string;
  driver: { firstName: string; lastName: string; plateNumber: string | null } | null;
  parent: {
    firstName: string;
    lastName: string;
    phone: string;
    spouseName: string | null;
    spousePhone: string | null;
    address: string;
  } | null;
}

export default function FirmaOgrenciler() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<Student[]>(`/api/firma/ogrenciler${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then(({ data }) => { if (data) setStudents(data); })
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Öğrenciler</h1>
        <span className="text-sm text-gray-500">{students.length} öğrenci</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Ad, soyad veya TC ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {loading && <p className="text-center text-gray-400 py-8">Yükleniyor...</p>}
        {!loading && students.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Öğrenci bulunamadı</p>
          </div>
        )}
        {students.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
            onClick={() => router.push(`/firma/ogrenciler/${s.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.school} · {s.class}
                  {s.teacher && ` · ${s.teacher}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                  {s.status === "ACTIVE" ? "Aktif" : "Pasif"}
                </Badge>
                <span className="text-xs text-gray-500">
                  {s.studyTime === "MORNING" ? "Sabah" : "Öğleden Sonra"}
                </span>
              </div>
            </div>

            {s.driver ? (
              <div className="bg-gray-50 rounded-xl p-2.5 mb-2 text-xs text-gray-600">
                🚌 {s.driver.firstName} {s.driver.lastName}
                {s.driver.plateNumber && ` · ${s.driver.plateNumber}`}
              </div>
            ) : (
              <div className="bg-orange-50 rounded-xl p-2.5 mb-2 text-xs text-orange-600">
                ⚠ Şoför atanmamış
              </div>
            )}

            {s.parent && (
              <div className="border-t border-gray-100 pt-2 mt-2 text-xs text-gray-600 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>👤 {s.parent.firstName} {s.parent.lastName} ·</span>
                  <CopyPhone phone={s.parent.phone} />
                </div>
                {s.parent.spousePhone && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>👤</span>
                    <CopyPhone phone={s.parent.spousePhone} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
