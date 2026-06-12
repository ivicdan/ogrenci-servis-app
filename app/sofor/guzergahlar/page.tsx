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
  _count: { students: number };
}

const routeTypeLabel: Record<string, string> = {
  MORNING_PICKUP: "Sabah Alış",
  MORNING_DROPOFF: "Sabah Bırakış",
  AFTERNOON_PICKUP: "Öğle Alış",
  AFTERNOON_DROPOFF: "Öğle Bırakış",
};

export default function SoforGuzergahlar() {
  const [routes, setRoutes] = useState<Route[]>([]);
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
    setForm({ name: "", type: "MORNING_PICKUP" });
    loadRoutes();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Güzergahlarım</h1>
        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Ekle
        </Button>
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
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(routeTypeLabel).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
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
        {routes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bus className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Henüz güzergah yok</p>
          </div>
        )}
        {routes.map((route) => (
          <Link key={route.id} href={`/sofor/guzergahlar/${route.id}`}
            className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-xl p-2.5">
                <Bus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{route.name}</p>
                <p className="text-xs text-gray-500">{routeTypeLabel[route.type] ?? route.type}</p>
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
