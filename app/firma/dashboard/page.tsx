"use client";
import { useEffect, useState } from "react";
import { Bus, GraduationCap, CreditCard, Bell, Copy, Check, Clock, MessageCircle, Mail } from "lucide-react";
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

const WHATSAPP = "905444475096";
const EMAIL = "info@ogrenciservisi.online";

const PENDING_STATUSES = ["PRE_REGISTERED", "PENDING_APPROVAL"];

export default function FirmaDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [firm, setFirm] = useState<FirmProfile | null>(null);
  const [copied, setCopied] = useState(false);

  function copyFirmCode() {
    if (!firm) return;
    navigator.clipboard.writeText(firm.firmCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    apiFetch<Stats>("/api/firma/dashboard").then(({ data }) => {
      if (data) setStats(data);
    });
    apiFetch<FirmProfile>("/api/firma/profil").then(({ data }) => {
      if (data) setFirm(data);
    });
  }, []);

  const isPending = firm ? PENDING_STATUSES.includes(firm.status) : false;

  const cards = [
    { label: "Aktif Şoför", value: stats?.driverCount ?? "-", icon: Bus, color: "bg-blue-100 text-blue-600" },
    { label: "Aktif Öğrenci", value: stats?.studentCount ?? "-", icon: GraduationCap, color: "bg-green-100 text-green-600" },
    { label: "Bekleyen Ödeme", value: stats?.pendingPayments ?? "-", icon: CreditCard, color: "bg-yellow-100 text-yellow-600" },
    { label: "Okunmamış Bildirim", value: stats?.unreadNotifs ?? "-", icon: Bell, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {firm?.name ?? "Firma Paneli"}
        </h1>
        {firm && !isPending && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">FİRMA KODU:</span>
            <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-sm">
              {firm.firmCode}
            </span>
            <button
              type="button"
              onClick={copyFirmCode}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Kopyala"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
        {firm && isPending && (
          <p className="text-sm text-gray-400 mt-1">Hesabınız onaylandıktan sonra firma kodunuz oluşturulacak.</p>
        )}
      </div>

      {/* Onay Bekliyor Banner + İletişim Kartı */}
      {isPending && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-amber-800 text-base">Hesabınız Onay Bekliyor</h2>
              <p className="text-sm text-amber-700 mt-0.5">
                Kaydınız alındı. Ekibimiz en kısa sürede hesabınızı inceleyecek ve onaylayacak.
                Onay alındıktan sonra tüm özellikler aktif hale gelecek.
              </p>
            </div>
          </div>

          {/* İletişim Kartı */}
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">Evraklarınızı bize gönderin</p>
            <p className="text-xs text-gray-500 mb-3">
              İmza Sirküsü · Vergi Levhası · Kimlik Fotokopisi
            </p>
            <div className="space-y-2">
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors w-full justify-center"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp ile Gönder
              </a>
              <a
                href={`mailto:${EMAIL}?subject=Firma%20Evrakları`}
                className="flex items-center gap-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 transition-colors w-full justify-center"
              >
                <Mail className="w-4 h-4" />
                {EMAIL}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* İstatistik Kartları (onay bekleyenler için pasif) */}
      <div className={`grid grid-cols-2 gap-3 ${isPending ? "opacity-30 pointer-events-none select-none" : ""}`}>
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
