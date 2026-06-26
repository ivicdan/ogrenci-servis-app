"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Bus, ArrowRight } from "lucide-react";
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

export default function SoforGuzergahlar() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [tab, setTab] = useState<"gidis" | "donus">("gidis");
  const [form, setForm] = useState({ name: "", type: "MORNING_PICKUP" });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadRoutes(); }, []);

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

  const tabTypes = tab === "gidis" ? GIDIS_TYPES : DONUS_TYPES;
  const visible = routes.filter((r) => tabTypes.includes(r.type));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Güzergahlarım</h1>
        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => {
          setForm({ name: "", type: tab === "gidis" ? "MORNING_PICKUP" : "MORNING_DROPOFF" });
          setOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-1" /> Ekle
        </Button>
      </div>

      {/* Sekmeler */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-5 gap-1">
        {(["gidis", "donus"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "gidis" ? "🏫 Okula Gidiş" : "🏠 Eve Dönüş"}
          </button>
        ))}
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
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bus className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {tab === "gidis" ? "Okula gidiş güzergahı yok" : "Eve dönüş güzergahı yok"}
            </p>
            <p className="text-xs mt-1">Sağ üstteki "Ekle" butonuyla güzergah oluşturun.</p>
          </div>
        )}
        {visible.map((route) => (
          <Link key={route.id} href={`/sofor/guzergahlar/${route.id}`}
            className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${route.tripStartedAt ? "bg-green-100" : "bg-gray-100"}`}>
                <Bus className={`w-5 h-5 ${route.tripStartedAt ? "text-green-600" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{route.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  {routeTypeLabel[route.type] ?? route.type}
                  {route.tripStartedAt && (
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">Sefer Aktif</span>
                  )}
                </p>
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
