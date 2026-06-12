"use client";
import { useState } from "react";
import { AlertTriangle, Bus, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const options = [
  {
    type: "PICKUP",
    label: "Okula servisle gitmeyecek",
    desc: "Sabah servisi kullanmayacak",
    color: "bg-orange-50 border-orange-200 text-orange-700",
    icon: <ArrowRight className="w-5 h-5" />,
  },
  {
    type: "DROPOFF",
    label: "Okuldan servisle dönmeyecek",
    desc: "Öğle/öğleden sonra servisi kullanmayacak",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    icon: <ArrowLeft className="w-5 h-5" />,
  },
  {
    type: "BOTH",
    label: "Okula hiç gitmeyecek",
    desc: "Bugün okula gitmeyecek (gidiş + dönüş)",
    color: "bg-red-50 border-red-200 text-red-700",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
];

export default function VeliDevamsizlik() {
  const [loading, setLoading] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  async function handleNotify(type: string) {
    setLoading(type);
    const { error } = await apiFetch("/api/veli/devamsizlik", {
      method: "POST",
      body: JSON.stringify({ type }),
    });
    setLoading(null);
    if (error) return toast.error(error);
    setSent((prev) => [...prev, type]);
    toast.success("Devamsızlık bildirimi şoföre iletildi!");
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Devamsızlık Bildir</h1>
      <p className="text-sm text-gray-500 mb-6">
        Bugün için şoföre bildirim gönderin.
      </p>

      <div className="space-y-3">
        {options.map((opt) => {
          const isSent = sent.includes(opt.type);
          return (
            <div
              key={opt.type}
              className={`rounded-2xl border p-4 ${opt.color} ${isSent ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{opt.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-3 bg-white/80 hover:bg-white border border-current text-inherit"
                disabled={!!loading || isSent}
                onClick={() => handleNotify(opt.type)}
              >
                {loading === opt.type ? "Gönderiliyor..." : isSent ? "Gönderildi ✓" : "Bildir"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-gray-50 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <Bus className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            Bildirimler anlık olarak şoföre iletilir. Şoför listesinde öğrenciniz turuncu renkte görünecek.
          </p>
        </div>
      </div>
    </div>
  );
}
