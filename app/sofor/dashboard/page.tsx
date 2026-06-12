"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bus, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface Route {
  id: string;
  name: string;
  type: string;
  _count: { students: number };
}

const routeTypeLabel: Record<string, string> = {
  MORNING_PICKUP: "Sabah Alış",
  MORNING_DROPOFF: "Sabah Bırakış",
  AFTERNOON_PICKUP: "Öğle Alış",
  AFTERNOON_DROPOFF: "Öğle Bırakış",
};

const routeTypeColor: Record<string, string> = {
  MORNING_PICKUP: "bg-blue-100 text-blue-700",
  MORNING_DROPOFF: "bg-green-100 text-green-700",
  AFTERNOON_PICKUP: "bg-orange-100 text-orange-700",
  AFTERNOON_DROPOFF: "bg-purple-100 text-purple-700",
};

export default function SoforDashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    apiFetch<Route[]>("/api/sofor/guzergahlar").then(({ data }) => {
      if (data) setRoutes(data);
    });
  }, []);

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-gray-500 capitalize">{today}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">Bugünkü Turlar</h1>
      </div>

      <div className="space-y-3">
        {routes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bus className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Henüz güzergah eklenmemiş</p>
            <Link href="/sofor/guzergahlar" className="text-green-600 text-sm mt-2 inline-block">
              Güzergah ekle →
            </Link>
          </div>
        )}
        {routes.map((route) => (
          <Link
            key={route.id}
            href={`/sofor/guzergahlar/${route.id}`}
            className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-xl p-2.5">
                <Bus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{route.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${routeTypeColor[route.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {routeTypeLabel[route.type] ?? route.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-sm">{route._count.students} öğrenci</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
