"use client";
import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Plus, Pencil, Trash2,
  ChevronLeft, ChevronRight, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface Income {
  id: string;
  amount: string;
  paidDate: string;
  method: string | null;
  student: {
    firstName: string;
    lastName: string;
    parent: { firstName: string; lastName: string; phone: string } | null;
  };
}

interface Expense {
  id: string;
  date: string;
  amount: string;
  description: string;
  payee: string;
  category: string;
  note: string | null;
}

type Tab = "gelirler" | "giderler";

const CATEGORIES = ["Yakıt", "Personel", "Araç Bakım", "Sigorta", "Kira", "Vergi/SGK", "Diğer"];
const METHOD_LABELS: Record<string, string> = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT" };

const EMPTY_FORM = { date: "", amount: "", description: "", payee: "", category: "Diğer", note: "" };

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function fmt(val: string | number) {
  return Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MonthNav({
  year, month, onChange,
}: {
  year: number; month: number | null; onChange: (y: number, m: number | null) => void;
}) {
  const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  function prev() {
    if (month === null) { onChange(year - 1, null); return; }
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  }
  function next() {
    if (month === null) { onChange(year + 1, null); return; }
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  }

  const label = month === null ? String(year) : `${MONTHS[month - 1]} ${year}`;

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={prev} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronLeft className="w-4 h-4 text-gray-500" />
      </button>
      <span className="text-sm font-semibold text-gray-700 w-24 text-center">{label}</span>
      <button type="button" onClick={next} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </button>
      <button
        type="button"
        onClick={() => {
          const now = new Date();
          onChange(now.getFullYear(), now.getMonth() + 1);
        }}
        className="ml-1 text-xs text-blue-600 font-medium hover:underline"
      >
        Bu ay
      </button>
      <button
        type="button"
        onClick={() => onChange(year, null)}
        className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
      >
        Yıl
      </button>
    </div>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────

export default function MuhasebePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(now.getMonth() + 1);
  const [tab, setTab] = useState<Tab>("gelirler");

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Gider formu
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const periodQuery = month
    ? `year=${year}&month=${month}`
    : `year=${year}`;

  const load = useCallback(async () => {
    const [{ data: inc }, { data: exp }] = await Promise.all([
      apiFetch<Income[]>(`/api/firma/muhasebe/gelirler?${periodQuery}`),
      apiFetch<Expense[]>(`/api/firma/muhasebe/giderler?${periodQuery}`),
    ]);
    if (inc) setIncomes(inc);
    if (exp) setExpenses(exp);
  }, [periodQuery]);

  useEffect(() => { load(); }, [load]);

  // ─── Özet ─────────────────────────────────────────────────────────────────

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const net = totalIncome - totalExpense;

  // ─── Gider CRUD ────────────────────────────────────────────────────────────

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setShowForm(true);
  }

  function openEdit(exp: Expense) {
    setEditId(exp.id);
    setForm({
      date: exp.date.split("T")[0],
      amount: String(Number(exp.amount)),
      description: exp.description,
      payee: exp.payee,
      category: exp.category,
      note: exp.note ?? "",
    });
    setShowForm(true);
  }

  async function saveExpense() {
    if (!form.date || !form.amount || !form.description || !form.payee) {
      return toast.error("Tarih, miktar, açıklama ve alıcı zorunludur.");
    }
    setSaving(true);
    if (editId) {
      const { error } = await apiFetch(`/api/firma/muhasebe/giderler/${editId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      if (error) { setSaving(false); return toast.error(error); }
      toast.success("Gider güncellendi.");
    } else {
      const { error } = await apiFetch("/api/firma/muhasebe/giderler", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (error) { setSaving(false); return toast.error(error); }
      toast.success("Gider eklendi.");
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function deleteExpense(id: string) {
    const { error } = await apiFetch(`/api/firma/muhasebe/giderler/${id}`, { method: "DELETE" });
    if (error) return toast.error(error);
    toast.success("Gider silindi.");
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Muhasebe</h1>
        <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Gelir</span>
          </div>
          <p className="text-lg font-bold text-green-700">{fmt(totalIncome)} ₺</p>
          <p className="text-xs text-green-600 mt-0.5">{incomes.length} ödeme</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Gider</span>
          </div>
          <p className="text-lg font-bold text-red-700">{fmt(totalExpense)} ₺</p>
          <p className="text-xs text-red-600 mt-0.5">{expenses.length} kalem</p>
        </div>
        <div className={`border rounded-2xl p-4 ${net >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className={`w-4 h-4 ${net >= 0 ? "text-blue-600" : "text-orange-600"}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${net >= 0 ? "text-blue-700" : "text-orange-700"}`}>Net</span>
          </div>
          <p className={`text-lg font-bold ${net >= 0 ? "text-blue-700" : "text-orange-700"}`}>{fmt(net)} ₺</p>
          <p className={`text-xs mt-0.5 ${net >= 0 ? "text-blue-600" : "text-orange-600"}`}>{net >= 0 ? "Kâr" : "Zarar"}</p>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex border-b border-gray-200">
        {(["gelirler", "giderler"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "gelirler" ? "Gelirler" : "Giderler"}
          </button>
        ))}
      </div>

      {/* Gelirler */}
      {tab === "gelirler" && (
        <div className="space-y-2">
          {incomes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Bu dönemde onaylanan ödeme yok</p>
            </div>
          )}
          {incomes.map((inc) => (
            <div key={inc.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">
                  {inc.student.firstName} {inc.student.lastName}
                </p>
                {inc.student.parent && (
                  <p className="text-xs text-gray-500">
                    Veli: {inc.student.parent.firstName} {inc.student.parent.lastName}
                    {" · "}{inc.student.parent.phone}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(inc.paidDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  {inc.method && ` · ${METHOD_LABELS[inc.method] ?? inc.method}`}
                </p>
              </div>
              <span className="text-green-700 font-bold text-sm whitespace-nowrap">+{fmt(inc.amount)} ₺</span>
            </div>
          ))}
        </div>
      )}

      {/* Giderler */}
      {tab === "giderler" && (
        <>
          <div className="flex justify-end">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Gider Ekle
            </Button>
          </div>

          <div className="space-y-2">
            {expenses.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Bu dönemde kayıtlı gider yok</p>
              </div>
            )}
            {expenses.map((exp) => (
              <div key={exp.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{exp.description}</p>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Alıcı: {exp.payee}</p>
                    {exp.note && <p className="text-xs text-gray-400 mt-0.5 italic">{exp.note}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(exp.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">−{fmt(exp.amount)} ₺</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(exp)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Gider formu modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editId ? "Gider Düzenle" : "Gider Ekle"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tarih</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Miktar (₺)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Açıklama</Label>
                <Input
                  placeholder="Örn: Araç yakıt gideri"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Ödemenin Yapıldığı Kişi / Kurum</Label>
                <Input
                  placeholder="Örn: Petrol Ofisi, Ali Yılmaz..."
                  value={form.payee}
                  onChange={(e) => setForm({ ...form, payee: e.target.value })}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Kategori</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Not <span className="text-gray-400">(opsiyonel)</span></Label>
                <Input
                  placeholder="Ek açıklama..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)} disabled={saving}>
                İptal
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={saveExpense} disabled={saving}>
                <Check className="w-4 h-4 mr-1" />
                {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
