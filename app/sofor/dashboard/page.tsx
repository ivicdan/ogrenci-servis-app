"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bus, ArrowRight, School, Home } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface Route {
  id: string;
  name: string;
  type: string;
  _count: { students: number };
}

const routeTypeLabel: Record<string, string> = {
  MORNING_PICKUP: "Sabah Gidiş",
  AFTERNOON_PICKUP: "Öğlen Gidiş",
  MORNING_DROPOFF: "Öğlen Çıkış",
  AFTERNOON_DROPOFF: "Akşam Çıkış",
};

const routeTypeColor: Record<string, string> = {
  MORNING_PICKUP: "bg-blue-100 text-blue-700",
  MORNING_DROPOFF: "bg-green-100 text-green-700",
  AFTERNOON_PICKUP: "bg-orange-100 text-orange-700",
  AFTERNOON_DROPOFF: "bg-purple-100 text-purple-700",
};

const OKULA_GIDIS = ["MORNING_PICKUP", "AFTERNOON_PICKUP"];
const EVE_DONUS = ["MORNING_DROPOFF", "AFTERNOON_DROPOFF"];

function RouteList({ routes }: { routes: Route[] }) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Bus className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Bu kategoride güzergah yok</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
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
  );
}

export default function SoforDashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [tab, setTab] = useState<"gidis" | "donus">("gidis");

  useEffect(() => {
    apiFetch<Route[]>("/api/sofor/guzergahlar").then(({ data }) => {
      if (data) setRoutes(data);
    });
  }, []);

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const gidisRoutes = routes.filter((r) => OKULA_GIDIS.includes(r.type));
  const donusRoutes = routes.filter((r) => EVE_DONUS.includes(r.type));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <p className="text-sm text-gray-500 capitalize">{today}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">Bugünkü Turlar</h1>
      </div>

      {/* Sekmeler */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 gap-1">
        <button
          type="button"
          onClick={() => setTab("gidis")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "gidis"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <School className="w-4 h-4" />
          Okula Gidiş
          {gidisRoutes.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === "gidis" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
              {gidisRoutes.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("donus")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "donus"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Home className="w-4 h-4" />
          Eve Dönüş
          {donusRoutes.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === "donus" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-500"}`}>
              {donusRoutes.length}
            </span>
          )}
        </button>
      </div>

      <RouteList routes={tab === "gidis" ? gidisRoutes : donusRoutes} />
    </div>
  );
}
