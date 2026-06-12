"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Bus, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  const [sending, setSending] = useState<"PICKUP" | "DROPOFF" | null>(null);

  useEffect(() => {
    apiFetch<ParentData>("/api/veli/ogrenci").then(({ data }) => {
      if (data) setData(data);
    });
  }, []);

  async function handleAbsence(type: "PICKUP" | "DROPOFF") {
    setSending(type);
    const { error } = await apiFetch("/api/veli/devamsizlik", {
      method: "POST",
      body: JSON.stringify({ type }),
    });
    setSending(null);
    if (error) return toast.error(error);
    toast.success(
      type === "PICKUP"
        ? "Sabah devamsızlığı bildirildi."
        : "Öğleden dönüş devamsızlığı bildirildi."
    );
  }

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

      {/* Devamsızlık Bildirimi */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <p className="font-semibold text-gray-900 text-sm">Devamsızlık Bildir</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Çocuğunuz bugün servise binmeyecekse şoföre bildirim gönderin.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
            onClick={() => handleAbsence("PICKUP")}
            disabled={sending !== null}
          >
            {sending === "PICKUP" ? "Gönderiliyor..." : "Sabah Gitmeyecek"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
            onClick={() => handleAbsence("DROPOFF")}
            disabled={sending !== null}
          >
            {sending === "DROPOFF" ? "Gönderiliyor..." : "Öğleden Dönmeyecek"}
          </Button>
        </div>
      </div>

      {/* Firma IBAN */}
      {student.firm.iban && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-1">ÖDEME İBANI</p>
          <p className="font-mono text-sm text-gray-800 break-all">{student.firm.iban}</p>
          <p className="text-xs text-blue-500 mt-1">{student.firm.name ?? "Firma"}</p>
        </div>
      )}

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
