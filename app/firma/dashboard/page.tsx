"use client";
import { useEffect, useState } from "react";
import { Bus, Users, GraduationCap, CreditCard, Bell } from "lucide-react";
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

export default function FirmaDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [firm, setFirm] = useState<FirmProfile | null>(null);

  useEffect(() => {
    apiFetch<Stats>("/api/firma/dashboard").then(({ data }) => {
      if (data) setStats(data);
    });
    apiFetch<FirmProfile>("/api/firma/profil").then(({ data }) => {
      if (data) setFirm(data);
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

      <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}
