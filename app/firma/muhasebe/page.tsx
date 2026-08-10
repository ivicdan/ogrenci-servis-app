"use client";
import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Wallet, CreditCard,
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface PaymentIncome {
  id: string; amount: string; paidDate: string; method: string | null;
  student: { firstName: string; lastName: string; parent: { firstName: string; lastName: string; phone: string } | null };
}
interface ManualIncome {
  id: string; date: string; amount: string; description: string; source: string; category: string; note: string | null;
}
interface Expense {
  id: string; date: string; amount: string; description: string; payee: string; category: string; note: string | null; isCredit: boolean;
}

type Tab = "gelirler" | "giderler";

const EXPENSE_CATEGORIES = ["Yakıt", "Personel", "Araç Bakım", "Sigorta", "Kira", "Vergi/SGK", "Diğer"];
const INCOME_CATEGORIES  = ["Servis Dışı Hizmet", "Kira Geliri", "Danışmanlık", "Sponsorluk", "Diğer"];
const METHOD_LABELS: Record<string, string> = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT" };

const EMPTY_EXP = { date: "", amount: "", description: "", payee: "", category: "Diğer", note: "", isCredit: false };
const EMPTY_INC = { date: "", amount: "", description: "", source: "", category: "Diğer", note: "" };

function fmt(v: string | number) {
  return Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Ay navigasyonu ───────────────────────────────────────────────────────────

function MonthNav({ year, month, onChange }: { year: number; month: number | null; onChange: (y: number, m: number | null) => void }) {
  const MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  function prev() { if (month === null) { onChange(year-1, null); return; } month === 1 ? onChange(year-1, 12) : onChange(year, month-1); }
  function next() { if (month === null) { onChange(year+1, null); return; } month === 12 ? onChange(year+1, 1) : onChange(year, month+1); }
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={prev} className="p-1 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
      <span className="text-sm font-semibold text-gray-700 w-24 text-center">{month === null ? year : `${MONTHS[month-1]} ${year}`}</span>
      <button type="button" onClick={next} className="p-1 rounded-lg hover:bg-gray-100"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
      <button type="button" onClick={() => { const n=new Date(); onChange(n.getFullYear(), n.getMonth()+1); }} className="ml-1 text-xs text-blue-600 font-medium hover:underline">Bu ay</button>
      <button type="button" onClick={() => onChange(year, null)} className="text-xs text-gray-400 hover:underline">Yıl</button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, onSave, saving, children }: { title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">{children}</div>
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

export default function MuhasebePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(now.getMonth() + 1);
  const [tab, setTab] = useState<Tab>("gelirler");

  const [paymentIncomes, setPaymentIncomes] = useState<PaymentIncome[]>([]);
  const [manualIncomes,  setManualIncomes]  = useState<ManualIncome[]>([]);
  const [expenses,       setExpenses]       = useState<Expense[]>([]);

  // Gelir formu
  const [showIncForm, setShowIncForm] = useState(false);
  const [incEditId,   setIncEditId]   = useState<string | null>(null);
  const [incForm,     setIncForm]     = useState({ ...EMPTY_INC });

  // Gider formu
  const [showExpForm, setShowExpForm] = useState(false);
  const [expEditId,   setExpEditId]   = useState<string | null>(null);
  const [expForm,     setExpForm]     = useState({ ...EMPTY_EXP });

  const [saving, setSaving] = useState(false);

  const periodQuery = month ? `year=${year}&month=${month}` : `year=${year}`;

  const load = useCallback(async () => {
    const [{ data: pi }, { data: mi }, { data: ex }] = await Promise.all([
      apiFetch<PaymentIncome[]>(`/api/firma/muhasebe/gelirler?${periodQuery}`),
      apiFetch<ManualIncome[]>(`/api/firma/muhasebe/gelirler/manuel?${periodQuery}`),
      apiFetch<Expense[]>(`/api/firma/muhasebe/giderler?${periodQuery}`),
    ]);
    if (pi) setPaymentIncomes(pi);
    if (mi) setManualIncomes(mi);
    if (ex) setExpenses(ex);
  }, [periodQuery]);

  useEffect(() => { load(); }, [load]);

  // ─── Özet ─────────────────────────────────────────────────────────────────

  const totalPaymentInc = paymentIncomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalManualInc  = manualIncomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalIncome     = totalPaymentInc + totalManualInc;
  const cashExpenses    = expenses.filter(e => !e.isCredit);
  const creditExpenses  = expenses.filter(e => e.isCredit);
  const totalCashExp    = cashExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCreditExp  = creditExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const net             = totalIncome - totalCashExp;

  // ─── Gelir CRUD ────────────────────────────────────────────────────────────

  function openAddInc() { setIncEditId(null); setIncForm({ ...EMPTY_INC, date: now.toISOString().split("T")[0] }); setShowIncForm(true); }
  function openEditInc(i: ManualIncome) {
    setIncEditId(i.id);
    setIncForm({ date: i.date.split("T")[0], amount: String(Number(i.amount)), description: i.description, source: i.source, category: i.category, note: i.note ?? "" });
    setShowIncForm(true);
  }
  async function saveInc() {
    if (!incForm.date || !incForm.amount || !incForm.description || !incForm.source) return toast.error("Tarih, miktar, açıklama ve kaynak zorunludur.");
    setSaving(true);
    const url = incEditId ? `/api/firma/muhasebe/gelirler/manuel/${incEditId}` : "/api/firma/muhasebe/gelirler/manuel";
    const { error } = await apiFetch(url, { method: incEditId ? "PUT" : "POST", body: JSON.stringify(incForm) });
    setSaving(false);
    if (error) return toast.error(error);
    toast.success(incEditId ? "Gelir güncellendi." : "Gelir eklendi.");
    setShowIncForm(false); load();
  }
  async function deleteInc(id: string) {
    const { error } = await apiFetch(`/api/firma/muhasebe/gelirler/manuel/${id}`, { method: "DELETE" });
    if (error) return toast.error(error);
    toast.success("Gelir silindi.");
    setManualIncomes(p => p.filter(i => i.id !== id));
  }

  // ─── Gider CRUD ────────────────────────────────────────────────────────────

  function openAddExp() { setExpEditId(null); setExpForm({ ...EMPTY_EXP, date: now.toISOString().split("T")[0] }); setShowExpForm(true); }
  function openEditExp(e: Expense) {
    setExpEditId(e.id);
    setExpForm({ date: e.date.split("T")[0], amount: String(Number(e.amount)), description: e.description, payee: e.payee, category: e.category, note: e.note ?? "", isCredit: e.isCredit });
    setShowExpForm(true);
  }
  async function saveExp() {
    if (!expForm.date || !expForm.amount || !expForm.description || !expForm.payee) return toast.error("Tarih, miktar, açıklama ve alıcı zorunludur.");
    setSaving(true);
    const url = expEditId ? `/api/firma/muhasebe/giderler/${expEditId}` : "/api/firma/muhasebe/giderler";
    const { error } = await apiFetch(url, { method: expEditId ? "PUT" : "POST", body: JSON.stringify(expForm) });
    setSaving(false);
    if (error) return toast.error(error);
    toast.success(expEditId ? "Gider güncellendi." : "Gider eklendi.");
    setShowExpForm(false); load();
  }
  async function deleteExp(id: string) {
    const { error } = await apiFetch(`/api/firma/muhasebe/giderler/${id}`, { method: "DELETE" });
    if (error) return toast.error(error);
    toast.success("Gider silindi.");
    setExpenses(p => p.filter(e => e.id !== id));
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Muhasebe</h1>
        <MonthNav year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m); }} />
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5 text-green-600" /><span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Gelir</span></div>
          <p className="text-base font-bold text-green-700">{fmt(totalIncome)} ₺</p>
          <p className="text-[10px] text-green-600">{paymentIncomes.length} ödeme + {manualIncomes.length} manuel</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1"><TrendingDown className="w-3.5 h-3.5 text-red-600" /><span className="text-[10px] font-bold text-red-700 uppercase tracking-wide">Gider</span></div>
          <p className="text-base font-bold text-red-700">{fmt(totalCashExp)} ₺</p>
          <p className="text-[10px] text-red-600">{cashExpenses.length} kalem</p>
        </div>
        <div className={`border rounded-2xl p-3 ${net >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <div className="flex items-center gap-1.5 mb-1"><Wallet className={`w-3.5 h-3.5 ${net >= 0 ? "text-blue-600" : "text-orange-600"}`} /><span className={`text-[10px] font-bold uppercase tracking-wide ${net >= 0 ? "text-blue-700" : "text-orange-700"}`}>Net</span></div>
          <p className={`text-base font-bold ${net >= 0 ? "text-blue-700" : "text-orange-700"}`}>{fmt(net)} ₺</p>
          <p className={`text-[10px] ${net >= 0 ? "text-blue-600" : "text-orange-600"}`}>{net >= 0 ? "Kâr" : "Zarar"}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1"><CreditCard className="w-3.5 h-3.5 text-purple-600" /><span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">K.Kartı</span></div>
          <p className="text-base font-bold text-purple-700">{fmt(totalCreditExp)} ₺</p>
          <p className="text-[10px] text-purple-600">Bakiyeye dahil değil</p>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex border-b border-gray-200">
        {(["gelirler","giderler"] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab===t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "gelirler" ? "Gelirler" : "Giderler"}
          </button>
        ))}
      </div>

      {/* GELİRLER */}
      {tab === "gelirler" && (
        <>
          <div className="flex justify-end">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={openAddInc}>
              <Plus className="w-4 h-4 mr-1" /> Gelir Ekle
            </Button>
          </div>

          {/* Onaylanan ödemeler */}
          {paymentIncomes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Onaylanan Ödemeler</p>
              <div className="space-y-2">
                {paymentIncomes.map(inc => (
                  <div key={inc.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{inc.student.firstName} {inc.student.lastName}</p>
                      {inc.student.parent && <p className="text-xs text-gray-500">Veli: {inc.student.parent.firstName} {inc.student.parent.lastName} · {inc.student.parent.phone}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(inc.paidDate).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}
                        {inc.method && ` · ${METHOD_LABELS[inc.method] ?? inc.method}`}
                      </p>
                    </div>
                    <span className="text-green-700 font-bold text-sm whitespace-nowrap">+{fmt(inc.amount)} ₺</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manuel gelirler */}
          {manualIncomes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Manuel Gelirler</p>
              <div className="space-y-2">
                {manualIncomes.map(inc => (
                  <div key={inc.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{inc.description}</p>
                          <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{inc.category}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Kaynak: {inc.source}</p>
                        {inc.note && <p className="text-xs text-gray-400 italic mt-0.5">{inc.note}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(inc.date).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-green-700 font-bold text-sm">+{fmt(inc.amount)} ₺</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => openEditInc(inc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => deleteInc(inc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paymentIncomes.length === 0 && manualIncomes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Bu dönemde gelir yok</p>
            </div>
          )}
        </>
      )}

      {/* GİDERLER */}
      {tab === "giderler" && (
        <>
          <div className="flex justify-end">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={openAddExp}>
              <Plus className="w-4 h-4 mr-1" /> Gider Ekle
            </Button>
          </div>

          {/* Nakit giderler */}
          {cashExpenses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Nakit / EFT Giderler</p>
              <div className="space-y-2">
                {cashExpenses.map(exp => (
                  <ExpenseRow key={exp.id} exp={exp} onEdit={() => openEditExp(exp)} onDelete={() => deleteExp(exp.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Kredi kartı giderler */}
          {creditExpenses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">Kredi Kartı Giderler</p>
                <span className="text-[10px] text-purple-400 bg-purple-50 px-2 py-0.5 rounded-full">Net bakiyeye dahil değil</span>
              </div>
              <div className="space-y-2">
                {creditExpenses.map(exp => (
                  <ExpenseRow key={exp.id} exp={exp} onEdit={() => openEditExp(exp)} onDelete={() => deleteExp(exp.id)} credit />
                ))}
              </div>
            </div>
          )}

          {cashExpenses.length === 0 && creditExpenses.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Bu dönemde kayıtlı gider yok</p>
            </div>
          )}
        </>
      )}

      {/* Gelir Modal */}
      {showIncForm && (
        <Modal title={incEditId ? "Gelir Düzenle" : "Gelir Ekle"} onClose={() => setShowIncForm(false)} onSave={saveInc} saving={saving}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Tarih</Label><Input type="date" value={incForm.date} onChange={e => setIncForm({...incForm,date:e.target.value})} className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Miktar (₺)</Label><Input type="number" min="0" step="0.01" placeholder="0.00" value={incForm.amount} onChange={e => setIncForm({...incForm,amount:e.target.value})} className="mt-1 text-sm" /></div>
          </div>
          <div><Label className="text-xs">Açıklama</Label><Input placeholder="Örn: Okul kantini kirası" value={incForm.description} onChange={e => setIncForm({...incForm,description:e.target.value})} className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Gelir Kaynağı</Label><Input placeholder="Örn: ABC Okulu" value={incForm.source} onChange={e => setIncForm({...incForm,source:e.target.value})} className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Kategori</Label>
            <select value={incForm.category} onChange={e => setIncForm({...incForm,category:e.target.value})} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Not <span className="text-gray-400">(opsiyonel)</span></Label><Input placeholder="Ek açıklama..." value={incForm.note} onChange={e => setIncForm({...incForm,note:e.target.value})} className="mt-1 text-sm" /></div>
        </Modal>
      )}

      {/* Gider Modal */}
      {showExpForm && (
        <Modal title={expEditId ? "Gider Düzenle" : "Gider Ekle"} onClose={() => setShowExpForm(false)} onSave={saveExp} saving={saving}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Tarih</Label><Input type="date" value={expForm.date} onChange={e => setExpForm({...expForm,date:e.target.value})} className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Miktar (₺)</Label><Input type="number" min="0" step="0.01" placeholder="0.00" value={expForm.amount} onChange={e => setExpForm({...expForm,amount:e.target.value})} className="mt-1 text-sm" /></div>
          </div>
          <div><Label className="text-xs">Açıklama</Label><Input placeholder="Örn: Araç yakıt gideri" value={expForm.description} onChange={e => setExpForm({...expForm,description:e.target.value})} className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Ödemenin Yapıldığı Kişi / Kurum</Label><Input placeholder="Örn: Petrol Ofisi..." value={expForm.payee} onChange={e => setExpForm({...expForm,payee:e.target.value})} className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Kategori</Label>
            <select value={expForm.category} onChange={e => setExpForm({...expForm,category:e.target.value})} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Not <span className="text-gray-400">(opsiyonel)</span></Label><Input placeholder="Ek açıklama..." value={expForm.note} onChange={e => setExpForm({...expForm,note:e.target.value})} className="mt-1 text-sm" /></div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={expForm.isCredit} onChange={e => setExpForm({...expForm,isCredit:e.target.checked})} className="w-4 h-4 rounded text-purple-600" />
            <span className="text-sm text-gray-700">Kredi kartıyla ödendi <span className="text-xs text-purple-500">(net bakiyeye dahil edilmez)</span></span>
          </label>
        </Modal>
      )}
    </div>
  );
}

// ─── Gider satırı bileşeni ────────────────────────────────────────────────────

function ExpenseRow({ exp, onEdit, onDelete, credit }: { exp: Expense; onEdit: () => void; onDelete: () => void; credit?: boolean }) {
  function fmt(v: string | number) { return Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  return (
    <div className={`bg-white border rounded-2xl p-4 ${credit ? "border-purple-100" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{exp.description}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${credit ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"}`}>{exp.category}</span>
            {credit && <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><CreditCard className="w-3 h-3" />K.Kartı</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Alıcı: {exp.payee}</p>
          {exp.note && <p className="text-xs text-gray-400 italic mt-0.5">{exp.note}</p>}
          <p className="text-xs text-gray-400 mt-1">{new Date(exp.date).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`font-bold text-sm ${credit ? "text-purple-600" : "text-red-600"}`}>−{fmt(exp.amount)} ₺</span>
          <div className="flex gap-1">
            <button type="button" onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
