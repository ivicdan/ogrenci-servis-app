"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

const studyTimeLabel: Record<string, string> = {
  MORNING: "Sabah", AFTERNOON: "Öğleden Sonra",
};

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  school: string;
  class: string;
  studyTime: string;
  teacher: string | null;
  parent: { firstName: string; lastName: string; phone: string } | null;
}

export default function SoforOgrenciler() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Student[]>("/api/sofor/ogrenciler")
      .then(({ data }) => { if (data) setStudents(data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.school}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Öğrencilerim</h1>
        <span className="text-sm text-gray-500">{students.length} öğrenci</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Ada veya okula göre ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {loading && <p className="text-center text-gray-400 py-8">Yükleniyor...</p>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Kayıtlı öğrenci yok</p>
          </div>
        )}
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => router.push(`/sofor/ogrenciler/${s.id}`)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-green-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="font-semibold text-gray-900">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.school} · {s.class}
                  {s.teacher && ` · ${s.teacher}`}
                </p>
              </div>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {studyTimeLabel[s.studyTime]}
              </span>
            </div>
            {s.parent && (
              <p className="text-xs text-gray-500 mt-2">
                👤 {s.parent.firstName} {s.parent.lastName} · {s.parent.phone}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
