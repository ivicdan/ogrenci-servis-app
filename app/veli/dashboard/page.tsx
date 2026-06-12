"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Bus, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface ParentData {
  firstName: string;
  lastName: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    school: string;
    class: string;
    studyTime: string;
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
    };
  };
}

export default function VeliDashboard() {
  const [data, setData] = useState<ParentData | null>(null);

  useEffect(() => {
    apiFetch<ParentData>("/api/veli/ogrenci").then(({ data }) => {
      if (data) setData(data);
    });
  }, []);

  if (!data) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;

  const { student } = data;

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Öğrenci Kartı */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-sm text-gray-500">{student.school}</p>
            <p className="text-sm text-gray-500">
              {student.class} · {student.studyTime === "MORNING" ? "Sabah" : "Öğlen"}
            </p>
          </div>
        </div>

        {/* Şoför Bilgisi */}
        {student.driver ? (
          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <p className="text-xs font-semibold text-green-700 mb-1.5">SERVİS BİLGİLERİ</p>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>🚌 {student.driver.plateNumber ?? "Plaka yok"}</span>
                <a href={`tel:${student.driver.phone}`} className="flex items-center gap-1 text-green-600">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-xs">{student.driver.phone}</span>
                </a>
              </div>
              <p>👨‍✈️ {student.driver.firstName} {student.driver.lastName}</p>
              {student.driver.assistantName && (
                <p>👩‍✈️ Hostes: {student.driver.assistantName}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100 text-sm text-yellow-700">
            Henüz şoför atanmamış. Firma ile iletişime geçin.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/veli/profil"
          className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 hover:border-purple-200 transition-all">
          <p className="text-sm font-semibold text-gray-900">Bilgileri Düzenle</p>
          <p className="text-xs text-gray-500 mt-0.5">Profil & Öğrenci</p>
        </Link>
        <Link href="/veli/odeme"
          className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 hover:border-purple-200 transition-all">
          <p className="text-sm font-semibold text-gray-900">Ödemeler</p>
          <p className="text-xs text-gray-500 mt-0.5">Ödeme tablosu</p>
        </Link>
      </div>
    </div>
  );
}
