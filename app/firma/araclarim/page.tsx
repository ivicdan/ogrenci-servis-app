"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Car, Plus, Pencil, Trash2, X, Check,
  ShieldCheck, CalendarCheck, AlertTriangle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  insuranceCompany: string | null;
  insuranceStart: string | null;
  insuranceEnd: string | null;
  nextInspectionDate: string | null;
  notes: string | null;
}

const EMPTY: Omit<Vehicle, "id"> = {
  plate: "", brand: "", model: "", year: null,
  insuranceCompany: "", insuranceStart: "", insuranceEnd: "",
  nextInspectionDate: "", notes: "",
};

// ─── Uyarı durumu ─────────────────────────────────────────────────────────────

type WarningLevel = "expired" | "critical" | "warning" | "ok";

function getWarning(dateStr: string | null): { level: WarningLevel; daysLeft: number | null } {
  if (!dateStr) return { level: "ok", daysLeft: null };
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return { level: "expired",  daysLeft: diff };
  if (diff <= 7)  return { level: "critical", daysLeft: diff };
  if (diff <= 30) return { level: "warning",  daysLeft: diff };
  return { level: "ok", daysLeft: diff };
}

function WarningBadge({ level, daysLeft, label }: { level: WarningLevel; daysLeft: number | null; label: string }) {
  if (level === "ok" && daysLeft === null) return null;

  const styles: Record<WarningLevel, string> = {
    expired:  "bg-red-100   text-red-700  border-red-200",
    critical: "bg-red-50    text-red-600  border-red-100",
    warning:  "bg-orange-50 text-orange-600 border-orange-100",
    ok:       "bg-green-50  text-green-600 border-green-100",
  };
  const icons: Record<WarningLevel, React.ReactNode> = {
    expired:  <AlertTriangle className="w-3 h-3" />,
    critical: <AlertTriangle className="w-3 h-3" />,
    warning:  <Clock className="w-3 h-3" />,
    ok:       <Check className="w-3 h-3" />,
  };
  const messages: Record<WarningLevel, string> = {
    expired:  `${label}: Süresi doldu`,
    critical: `${label}: ${daysLeft} gün kaldı`,
    warning:  `${label}: ${daysLeft} gün kaldı`,
    ok:       `${label}: ${daysLeft} gün kaldı`,
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[level]}`}>
      {icons[level]}{messages[level]}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title, onClose, onSave, saving, children,
}: { title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">{children}</div>
        <div className="flex gap-2 px-5 pb-5 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>İptal</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={onSave} disabled={saving}>
            <Check className="w-4 h-4 mr-1" />{saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────

export default function AraclarimPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState({ ...EMPTY });
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await apiFetch<Vehicle[]>("/api/firma/araclarim");
    if (data) setVehicles(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  }

  function openEdit(v: Vehicle) {
    setEditId(v.id);
    setForm({
      plate:             v.plate,
      brand:             v.brand ?? "",
      model:             v.model ?? "",
      year:              v.year,
      insuranceCompany:  v.insuranceCompany ?? "",
      insuranceStart:    v.insuranceStart ? v.insuranceStart.split("T")[0] : "",
      insuranceEnd:      v.insuranceEnd ? v.insuranceEnd.split("T")[0] : "",
      nextInspectionDate: v.nextInspectionDate ? v.nextInspectionDate.split("T")[0] : "",
      notes:             v.notes ?? "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.plate.trim()) return toast.error("Plaka zorunludur.");
    setSaving(true);
    const url    = editId ? `/api/firma/araclarim/${editId}` : "/api/firma/araclarim";
    const method = editId ? "PUT" : "POST";
    const payload = {
      plate:             form.plate.trim(),
      brand:             form.brand  || null,
      model:             form.model  || null,
      year:              form.year   || null,
      insuranceCompany:  form.insuranceCompany  || null,
      insuranceStart:    form.insuranceStart    || null,
      insuranceEnd:      form.insuranceEnd      || null,
      nextInspectionDate: form.nextInspectionDate || null,
      notes:             form.notes || null,
    };
    const { error } = await apiFetch(url, { method, body: JSON.stringify(payload) });
    setSaving(false);
    if (error) return toast.error(error);
    toast.success(editId ? "Araç güncellendi." : "Araç eklendi.");
    setShowForm(false);
    load();
  }

  async function deleteVehicle(id: string) {
    const { error } = await apiFetch(`/api/firma/araclarim/${id}`, { method: "DELETE" });
    if (error) return toast.error(error);
    toast.success("Araç silindi.");
    setVehicles(p => p.filter(v => v.id !== id));
  }

  // Uyarı özeti — kritik araç sayısı
  const criticalCount = vehicles.filter(v => {
    const ins = getWarning(v.nextInspectionDate);
    const sig = getWarning(v.insuranceEnd);
    return ins.level === "expired" || ins.level === "critical" || sig.level === "expired" || sig.level === "critical";
  }).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">Araçlarım</h1>
          {criticalCount > 0 && (
            <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{criticalCount} Uyarı
            </span>
          )}
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Araç Ekle
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Kayıtlı araç yok</p>
          <p className="text-sm mt-1">Araç ekleyerek sigorta ve muayene takibini başlatın.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => <VehicleCard key={v.id} v={v} onEdit={() => openEdit(v)} onDelete={() => deleteVehicle(v.id)} />)}
        </div>
      )}

      {showForm && (
        <Modal title={editId ? "Araç Düzenle" : "Araç Ekle"} onClose={() => setShowForm(false)} onSave={save} saving={saving}>
          {/* Plaka */}
          <div>
            <Label className="text-xs font-bold text-gray-700">Plaka <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Örn: 34 ABC 123"
              value={form.plate}
              onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })}
              className="mt-1 text-sm uppercase tracking-widest font-bold"
            />
          </div>

          {/* Marka / Model / Yıl */}
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs">Marka</Label><Input placeholder="Mercedes" value={form.brand ?? ""} onChange={e => setForm({ ...form, brand: e.target.value })} className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Model</Label><Input placeholder="Sprinter" value={form.model ?? ""} onChange={e => setForm({ ...form, model: e.target.value })} className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Yıl</Label><Input type="number" placeholder="2022" min="1990" max="2030" value={form.year ?? ""} onChange={e => setForm({ ...form, year: e.target.value ? parseInt(e.target.value) : null })} className="mt-1 text-sm" /></div>
          </div>

          {/* Sigorta */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /><span className="text-xs font-bold text-gray-600">Sigorta Bilgileri</span></div>
            <div><Label className="text-xs">Sigorta Şirketi</Label><Input placeholder="Allianz" value={form.insuranceCompany ?? ""} onChange={e => setForm({ ...form, insuranceCompany: e.target.value })} className="mt-1 text-sm" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Başlangıç</Label><Input type="date" value={form.insuranceStart ?? ""} onChange={e => setForm({ ...form, insuranceStart: e.target.value })} className="mt-1 text-sm" /></div>
              <div><Label className="text-xs">Bitiş</Label><Input type="date" value={form.insuranceEnd ?? ""} onChange={e => setForm({ ...form, insuranceEnd: e.target.value })} className="mt-1 text-sm" /></div>
            </div>
          </div>

          {/* Muayene */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-1"><CalendarCheck className="w-3.5 h-3.5 text-green-500" /><span className="text-xs font-bold text-gray-600">Muayene Bilgileri</span></div>
            <div><Label className="text-xs">Sonraki Muayene Tarihi</Label><Input type="date" value={form.nextInspectionDate ?? ""} onChange={e => setForm({ ...form, nextInspectionDate: e.target.value })} className="mt-1 text-sm" /></div>
          </div>

          {/* Notlar */}
          <div><Label className="text-xs">Notlar <span className="text-gray-400">(opsiyonel)</span></Label><Input placeholder="Ek bilgiler..." value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 text-sm" /></div>
        </Modal>
      )}
    </div>
  );
}

// ─── Araç kartı ───────────────────────────────────────────────────────────────

function VehicleCard({ v, onEdit, onDelete }: { v: Vehicle; onEdit: () => void; onDelete: () => void }) {
  const insuranceWarn   = getWarning(v.insuranceEnd);
  const inspectionWarn  = getWarning(v.nextInspectionDate);
  const hasAlert = insuranceWarn.level !== "ok" || inspectionWarn.level !== "ok";
  const isCritical = insuranceWarn.level === "expired" || insuranceWarn.level === "critical" || inspectionWarn.level === "expired" || inspectionWarn.level === "critical";

  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${isCritical ? "border-red-200 ring-1 ring-red-100" : hasAlert ? "border-orange-200" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCritical ? "bg-red-50" : "bg-blue-50"}`}>
            <Car className={`w-5 h-5 ${isCritical ? "text-red-500" : "text-blue-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 text-base tracking-wider">{v.plate}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {[v.brand, v.model, v.year].filter(Boolean).join(" · ") || "Marka/Model bilgisi yok"}
            </p>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button type="button" onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
          <button type="button" onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Sigorta & Muayene bilgileri */}
      <div className="mt-3 space-y-2">
        {/* Sigorta */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="font-medium">Sigorta:</span>
            {v.insuranceCompany && <span>{v.insuranceCompany}</span>}
            {v.insuranceEnd
              ? <span className="text-gray-400">(Bitiş: {new Date(v.insuranceEnd).toLocaleDateString("tr-TR")})</span>
              : <span className="text-gray-300 italic">Bilgi girilmedi</span>
            }
          </div>
          <WarningBadge level={insuranceWarn.level} daysLeft={insuranceWarn.daysLeft} label="Sigorta" />
        </div>

        {/* Muayene */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <span className="font-medium">Muayene:</span>
            {v.nextInspectionDate
              ? <span className="text-gray-400">{new Date(v.nextInspectionDate).toLocaleDateString("tr-TR")}</span>
              : <span className="text-gray-300 italic">Bilgi girilmedi</span>
            }
          </div>
          <WarningBadge level={inspectionWarn.level} daysLeft={inspectionWarn.daysLeft} label="Muayene" />
        </div>

        {/* Notlar */}
        {v.notes && <p className="text-xs text-gray-400 italic border-t border-gray-50 pt-2 mt-1">📝 {v.notes}</p>}
      </div>
    </div>
  );
}
