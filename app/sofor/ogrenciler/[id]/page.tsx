"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Phone, MapPin } from "lucide-react";
import { CopyPhone } from "@/components/copy-phone";
import { apiFetch } from "@/lib/api-client";

const studyTimeLabel: Record<string, string> = {
  MORNING: "Sabah", AFTERNOON: "Öğleden Sonra",
};

interface StudentDetail {
  id: string;
  firstName: string; lastName: string;
  school: string; class: string; teacher: string | null;
  phone: string | null; studyTime: string; birthDate: string | null;
  parent: {
    firstName: string; lastName: string; phone: string;
    address: string; profession: string | null;
    spouseFirstName: string | null; spouseLastName: string | null;
    spousePhone: string | null; spouseProfession: string | null;
    extraPhone: string | null; extraPhoneRelation: string | null;
  } | null;
}

export default function SoforOgrenciDetay() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<StudentDetail>(`/api/sofor/ogrenciler/${params.id}`)
      .then(({ data }) => { if (data) setStudent(data); })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;
  if (!student) return <div className="text-center py-12 text-gray-400">Öğrenci bulunamadı.</div>;

  return (
    <div className="max-w-md mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 rounded-2xl p-2.5">
            <GraduationCap className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{student.school} · {student.class}</p>
            {student.teacher && <p className="text-xs text-gray-500">Öğretmen: {student.teacher}</p>}
          </div>
        </div>
        <div className="mt-4 space-y-1.5 text-sm text-gray-600">
          <p>Öğrenim: <span className="font-medium">{studyTimeLabel[student.studyTime]}</span></p>
          {student.birthDate && (
            <p>Doğum: {new Date(student.birthDate).toLocaleDateString("tr-TR")}</p>
          )}
          {student.phone && (
            <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> <CopyPhone phone={student.phone} /></p>
          )}
        </div>
      </div>

      {student.parent && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Veli Bilgileri</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p className="font-medium">{student.parent.firstName} {student.parent.lastName}</p>
            <p className="flex items-center gap-1.5 text-gray-600"><Phone className="w-3.5 h-3.5" /> <CopyPhone phone={student.parent.phone} /></p>
            {student.parent.profession && <p>Meslek: {student.parent.profession}</p>}
            {student.parent.address && (
              <p className="flex items-start gap-1.5 text-gray-600"><MapPin className="w-3.5 h-3.5 mt-0.5" /> {student.parent.address}</p>
            )}
          </div>
        </div>
      )}

      {student.parent?.spouseFirstName && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Eş / Diğer Veli</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p className="font-medium">{student.parent.spouseFirstName} {student.parent.spouseLastName}</p>
            {student.parent.spousePhone && (
              <p className="flex items-center gap-1.5 text-gray-600"><Phone className="w-3.5 h-3.5" /> <CopyPhone phone={student.parent.spousePhone} /></p>
            )}
            {student.parent.spouseProfession && <p>{student.parent.spouseProfession}</p>}
          </div>
        </div>
      )}

      {student.parent?.extraPhone && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">
            Ek İletişim{student.parent.extraPhoneRelation ? ` — ${student.parent.extraPhoneRelation}` : ""}
          </h2>
          <p className="flex items-center gap-1.5 text-sm text-gray-700"><Phone className="w-3.5 h-3.5" /> <CopyPhone phone={student.parent.extraPhone} /></p>
        </div>
      )}
    </div>
  );
}
