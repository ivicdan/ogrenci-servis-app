"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, AlertCircle } from "lucide-react";
import { CopyPhone } from "@/components/copy-phone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [overdueModal, setOverdueModal] = useState(false);
  const [daysLate, setDaysLate] = useState(0);

  useEffect(() => {
    apiFetch<ParentData>("/api/veli/ogrenci").then(({ data }) => {
      if (data) setData(data);
    });

    apiFetch<{ overdue: boolean; daysLate: number }>("/api/veli/gecikme-kontrol").then(({ data }) => {
      if (!data?.overdue) return;
      const key = `odeme-uyari-${new Date().toDateString()}`;
      if (!sessionStorage.getItem(key)) {
        setDaysLate(data.daysLate);
        setOverdueModal(true);
        sessionStorage.setItem(key, "1");
      }
    });
  }, []);

  if (!data) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;

  const { student } = data;

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
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100 text-sm text-yellow-700">
            Henüz şoför atanmamış. Firma ile iletişime geçin.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/veli/profil?edit=true"
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
