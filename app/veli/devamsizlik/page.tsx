"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Bus, ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface AbsenceReport {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  PICKUP: "Okula Gidiş",
  DROPOFF: "Eve Dönüş",
  BOTH: "Gidiş + Dönüş",
};

const typeColors: Record<string, string> = {
  PICKUP: "bg-orange-50 border-orange-200 text-orange-700",
  DROPOFF: "bg-blue-50 border-blue-200 text-blue-700",
  BOTH: "bg-red-50 border-red-200 text-red-700",
};

function fmt(d: string) {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, "0")}.${(dt.getMonth() + 1).toString().padStart(2, "0")}.${dt.getFullYear()}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function VeliDevamsizlik() {
  const [loading, setLoading] = useState<string | null>(null);
  const [reports, setReports] = useState<AbsenceReport[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    const { data } = await apiFetch<AbsenceReport[]>("/api/veli/devamsizlik");
    if (data) setReports(data);
  }

  async function handleNotify() {
    if (!selectedType) return;
    if (startDate > endDate) return toast.error("Başlangıç tarihi bitiş tarihinden sonra olamaz.");
    setLoading(selectedType);
    const { error } = await apiFetch("/api/veli/devamsizlik", {
      method: "POST",
      body: JSON.stringify({ type: selectedType, startDate, endDate }),
    });
    setLoading(null);
    if (error) return toast.error(error);
    toast.success("Devamsızlık bildirimi şoföre iletildi!");
    setSelectedType(null);
    loadReports();
  }

  const options = [
    { type: "PICKUP", label: "Okula servisle gitmeyecek", icon: <ArrowRight className="w-5 h-5" /> },
    { type: "DROPOFF", label: "Okuldan servisle dönmeyecek", icon: <ArrowLeft className="w-5 h-5" /> },
    { type: "BOTH", label: "Servis kullanmayacak (gidiş + dönüş)", icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Devamsızlık Bildir</h1>
        <p className="text-sm text-gray-500">Tarih aralığı seçip şoföre bildirim gönderin.</p>
      </div>

      {/* Tarih Aralığı */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Calendar className="w-4 h-4" /> Tarih Aralığı
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Başlangıç</Label>
            <Input type="date" value={startDate} min={todayIso()} onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value > endDate) setEndDate(e.target.value);
            }} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Bitiş</Label>
            <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
        </div>
        {startDate === endDate && (
          <p className="text-xs text-purple-600 font-medium">Tek gün devamsızlık ({fmt(startDate)})</p>
        )}
      </div>

      {/* Tür Seçimi */}
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => setSelectedType(selectedType === opt.type ? null : opt.type)}
            className={`w-full rounded-2xl border p-4 text-left transition-all ${
              selectedType === opt.type
                ? typeColors[opt.type] + " ring-2 ring-current ring-offset-1"
                : "bg-white border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={selectedType === opt.type ? "" : "text-gray-400"}>{opt.icon}</div>
              <span className={`font-semibold text-sm ${selectedType === opt.type ? "" : "text-gray-700"}`}>
                {opt.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      <Button
        className="w-full bg-purple-600 hover:bg-purple-700"
        disabled={!selectedType || !!loading}
        onClick={handleNotify}
      >
        {loading ? "Gönderiliyor..." : "Devamsızlık Bildir"}
      </Button>

      {/* Geçmiş Bildirimler */}
      {reports.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3">SON BİLDİRİMLER</p>
          <div className="space-y-2">
            {reports.map((r) => {
              const isSameDay = r.startDate.slice(0, 10) === r.endDate.slice(0, 10);
              const dateStr = isSameDay ? fmt(r.startDate) : `${fmt(r.startDate)} – ${fmt(r.endDate)}`;
              return (
                <div key={r.id} className={`rounded-xl p-3 text-xs ${typeColors[r.type] ?? "bg-gray-50"}`}>
                  <span className="font-semibold">{typeLabels[r.type] ?? r.type}</span>
                  <span className="mx-2">·</span>
                  <span>{dateStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <Bus className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            Bildirimler şoföre iletilir. Belirtilen tarih aralığında şoförün listesinde gelmeyecek olarak görünürsünüz.
          </p>
        </div>
      </div>
    </div>
  );
}
