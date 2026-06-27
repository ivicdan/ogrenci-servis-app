"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Bus, ArrowRight, ChevronUp, ChevronDown, School, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface Route {
  id: string;
  name: string;
  type: string;
  tripStartedAt: string | null;
  _count: { students: number };
}

const routeTypeLabel: Record<string, string> = {
  MORNING_PICKUP: "Sabah Gidiş",
  AFTERNOON_PICKUP: "Öğlen Gidiş",
  MORNING_DROPOFF: "Öğlen Çıkış",
  AFTERNOON_DROPOFF: "Akşam Çıkış",
};

const GIDIS_TYPES = ["MORNING_PICKUP", "AFTERNOON_PICKUP"];
const DONUS_TYPES  = ["MORNING_DROPOFF", "AFTERNOON_DROPOFF"];
const ORDER_KEY = "sofor_guzergah_order";

function loadOrder(): string[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]"); } catch { return []; }
}
function saveOrder(ids: string[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
}

function applyOrder(routes: Route[], order: string[]): Route[] {
  if (!order.length) return routes;
  const map = new Map(routes.map((r) => [r.id, r]));
  const sorted: Route[] = [];
  for (const id of order) { const r = map.get(id); if (r) sorted.push(r); }
  for (const r of routes) { if (!order.includes(r.id)) sorted.push(r); }
  return sorted;
}

function SoforGuzergahlarInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") === "donus" ? "donus" : "gidis") as "gidis" | "donus";

  const [routes, setRoutes] = useState<Route[]>([]);
  const [tab, setTab] = useState<"gidis" | "donus">(initialTab);
  const [order, setOrder] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", type: "MORNING_PICKUP" });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setOrder(loadOrder()); loadRoutes(); }, []);

  function changeTab(t: "gidis" | "donus") {
    setTab(t);
    router.replace(`/sofor/guzergahlar?tab=${t}`, { scroll: false });
  }

  async function loadRoutes() {
    const { data } = await apiFetch<Route[]>("/api/sofor/guzergahlar");
    if (data) setRoutes(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await apiFetch("/api/sofor/guzergahlar", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Güzergah eklendi!");
    setOpen(false);
    setForm({ name: "", type: tab === "gidis" ? "MORNING_PICKUP" : "MORNING_DROPOFF" });
    loadRoutes();
  }

  function moveRoute(id: string, dir: -1 | 1) {
    const tabTypes = tab === "gidis" ? GIDIS_TYPES : DONUS_TYPES;
    const visible = applyOrder(routes.filter((r) => tabTypes.includes(r.type)), order);
    const idx = visible.findIndex((r) => r.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= visible.length) return;

    // Tüm sırayı yeniden hesapla
    const newVisible = [...visible];
    [newVisible[idx], newVisible[newIdx]] = [newVisible[newIdx], newVisible[idx]];
    const otherTypes = tab === "gidis" ? DONUS_TYPES : GIDIS_TYPES;
    const others = routes.filter((r) => otherTypes.includes(r.type));
    const newOrder = [...newVisible, ...others].map((r) => r.id);
    setOrder(newOrder);
    saveOrder(newOrder);
  }

  const tabTypes = tab === "gidis" ? GIDIS_TYPES : DONUS_TYPES;
  const visible = applyOrder(routes.filter((r) => tabTypes.includes(r.type)), order);

  const isGidis = tab === "gidis";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Güzergahlarım</h1>
        <Button size="sm" className={isGidis ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"} onClick={() => {
          setForm({ name: "", type: tab === "gidis" ? "MORNING_PICKUP" : "MORNING_DROPOFF" });
          setOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-1" /> Ekle
        </Button>
      </div>

      {/* Sekmeler */}
      <div className={`flex rounded-2xl p-1 mb-5 gap-1 transition-colors duration-300 ${isGidis ? "bg-green-100" : "bg-purple-100"}`}>
        <button
          type="button"
          onClick={() => changeTab("gidis")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            tab === "gidis" ? "bg-green-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <School className="w-4 h-4" /> Okula Gidiş
        </button>
        <button
          type="button"
          onClick={() => changeTab("donus")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            tab === "donus" ? "bg-purple-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Home className="w-4 h-4" /> Eve Dönüş
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Güzergah</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>Güzergah Adı</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" placeholder="Örn: Kadıköy Sabah" />
            </div>
            <div>
              <Label>Tür</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? "" })}>
                <SelectTrigger className="mt-1">
                  <SelectValue>{routeTypeLabel[form.type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(tab === "gidis" ? GIDIS_TYPES : DONUS_TYPES).map((v) => (
                    <SelectItem key={v} value={v}>{routeTypeLabel[v]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className={`w-full ${isGidis ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`} disabled={loading}>
              {loading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bus className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{isGidis ? "Okula gidiş güzergahı yok" : "Eve dönüş güzergahı yok"}</p>
            <p className="text-xs mt-1">Sağ üstteki "Ekle" butonuyla güzergah oluşturun.</p>
          </div>
        )}
        {visible.map((route, idx) => (
          <div key={route.id} className="flex items-stretch gap-2">
            {/* Sıralama butonları */}
            <div className="flex flex-col gap-1 justify-center">
              <button
                type="button"
                onClick={() => moveRoute(route.id, -1)}
                disabled={idx === 0}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                title="Yukarı taşı"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveRoute(route.id, 1)}
                disabled={idx === visible.length - 1}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                title="Aşağı taşı"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <Link
              href={`/sofor/guzergahlar/${route.id}`}
              className={`flex-1 flex items-center justify-between rounded-2xl p-4 shadow-sm border transition-all ${
                isGidis
                  ? "bg-green-50 border-green-100 hover:border-green-300 hover:shadow-md"
                  : "bg-purple-50 border-purple-100 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${route.tripStartedAt ? (isGidis ? "bg-green-200" : "bg-purple-200") : (isGidis ? "bg-green-100" : "bg-purple-100")}`}>
                  <Bus className={`w-5 h-5 ${route.tripStartedAt ? (isGidis ? "text-green-700" : "text-purple-700") : (isGidis ? "text-green-600" : "text-purple-600")}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{route.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    {routeTypeLabel[route.type] ?? route.type}
                    {route.tripStartedAt && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isGidis ? "bg-green-200 text-green-800" : "bg-purple-200 text-purple-800"}`}>
                        Sefer Aktif
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm">{route._count.students} öğrenci</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SoforGuzergahlar() {
  return (
    <Suspense>
      <SoforGuzergahlarInner />
    </Suspense>
  );
}
