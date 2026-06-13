"use client";
import { useEffect, useState } from "react";
import { Bus, GraduationCap, CreditCard, Bell, AlertCircle } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

interface Stats {
  driverCount: number;
  studentCount: number;
  pendingPayments: number;
  unreadNotifs: number;
}

interface FirmProfile {
  firmCode: string;
  name: string | null;
  status: string;
}

interface OverdueParent {
  parentId: string;
  parentName: string;
  studentId: string;
  studentName: string;
  paymentDay: number;
  daysLate: number;
}

export default function FirmaDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [firm, setFirm] = useState<FirmProfile | null>(null);
  const [overdue, setOverdue] = useState<OverdueParent[]>([]);

  useEffect(() => {
    apiFetch<Stats>("/api/firma/dashboard").then(({ data }) => {
      if (data) setStats(data);
    });
    apiFetch<FirmProfile>("/api/firma/profil").then(({ data }) => {
      if (data) setFirm(data);
    });
    apiFetch<OverdueParent[]>("/api/firma/odemesi-gecikenler").then(({ data }) => {
      if (data) setOverdue(data);
    });
  }, []);

  const cards = [
    { label: "Aktif Şoför", value: stats?.driverCount ?? "-", icon: Bus, color: "bg-blue-100 text-blue-600" },
    { label: "Aktif Öğrenci", value: stats?.studentCount ?? "-", icon: GraduationCap, color: "bg-green-100 text-green-600" },
    { label: "Bekleyen Ödeme", value: stats?.pendingPayments ?? "-", icon: CreditCard, color: "bg-yellow-100 text-yellow-600" },
    { label: "Okunmamış Bildirim", value: stats?.unreadNotifs ?? "-", icon: Bell, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {firm?.name ?? "Firma Paneli"}
        </h1>
        {firm && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">Firma ID:</span>
            <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-sm">
              {firm.firmCode}
            </span>
            {firm.status === "PRE_REGISTERED" && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Evrak Bekleniyor
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color} mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Ödemesi Gecikenler</h2>
            <span className="ml-auto text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
              {overdue.length}
            </span>
          </div>
          <div className="space-y-2">
            {overdue.map((o) => (
              <Link
                key={o.studentId}
                href={`/firma/ogrenciler/${o.studentId}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.studentName}</p>
                  <p className="text-xs text-gray-500">{o.parentName} · Her ayın {o.paymentDay}. günü</p>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-lg flex-shrink-0">
                  {o.daysLate} gün geç
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
