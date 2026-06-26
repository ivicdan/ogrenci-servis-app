"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle, XCircle, Clock, ShieldOff, Trash2,
  Eye, EyeOff, RefreshCw, LogOut, Building2, Users, Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const STORAGE_KEY = "admin_token";

interface Firm {
  id: string;
  firmCode: string;
  taxOrTcId: string;
  phone: string;
  name: string | null;
  address: string | null;
  status: string;
  createdAt: string;
  documents: Record<string, string> | null;
  _count: { drivers: number; students: number };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PRE_REGISTERED: { label: "Evrak Yüklenmedi", color: "bg-gray-100 text-gray-600" },
  PENDING_APPROVAL: { label: "Onay Bekliyor", color: "bg-yellow-100 text-yellow-700" },
  ACTIVE: { label: "Aktif", color: "bg-green-100 text-green-700" },
  SUSPENDED: { label: "Askıya Alındı", color: "bg-red-100 text-red-700" },
};

const DOC_LABELS: Record<string, string> = {
  imza_sirkuleri: "İmza Sirküsü",
  vergi_levhasi: "Vergi Levhası",
  kimlik_fotokopisi: "Kimlik Fotokopisi",
  ticaret_sicil: "Ticaret Sicil",
  faaliyet_belgesi: "Faaliyet Belgesi",
};

function apiFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  }).then((r) => r.json());
}

export default function SuperAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const [firms, setFirms] = useState<Firm[]>([]);
  const [filter, setFilter] = useState("PENDING_APPROVAL");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) loadFirms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    const res = await fetch("/api/superadmin/giris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    const data = await res.json();
    setLoggingIn(false);
    if (!res.ok) return toast.error(data.error ?? "Hata");
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
  }

  async function loadFirms() {
    setLoading(true);
    const data = await apiFetch(`/api/superadmin/firmalar?status=${filter}`, token!);
    setLoading(false);
    if (Array.isArray(data)) setFirms(data);
  }

  async function updateStatus(id: string, status: string) {
    setActing(id);
    const data = await apiFetch(`/api/superadmin/firmalar/${id}`, token!, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setActing(null);
    if (data.error) return toast.error(data.error);
    toast.success(
      status === "ACTIVE" ? "Firma onaylandı!" :
      status === "SUSPENDED" ? "Firma askıya alındı." :
      "Durum güncellendi."
    );
    loadFirms();
  }

  async function deleteFirm(id: string, name: string | null) {
    if (!confirm(`"${name ?? id}" firmasını kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    setActing(id);
    const data = await apiFetch(`/api/superadmin/firmalar/${id}`, token!, { method: "DELETE" });
    setActing(null);
    if (data.error) return toast.error(data.error);
    toast.success("Firma silindi.");
    loadFirms();
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setFirms([]);
  }

  // ── GİRİŞ EKRANI ──
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <ShieldOff className="w-7 h-7 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Süper Admin</h1>
          <p className="text-center text-gray-400 text-sm mb-6">Yönetici paneline erişmek için şifreyi girin.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Admin şifresi"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loggingIn}>
              {loggingIn ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── PANEL ──
  const counts = {
    PENDING_APPROVAL: firms.filter((f) => filter === "PENDING_APPROVAL").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldOff className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">Süper Admin Paneli</h1>
            <p className="text-xs text-gray-400">Firma yönetimi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={loadFirms} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button size="sm" variant="outline" onClick={logout} className="text-red-600 hover:bg-red-50">
            <LogOut className="w-3.5 h-3.5 mr-1" /> Çıkış
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Filtre sekmeleri */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: "PENDING_APPROVAL", label: "Onay Bekliyor", icon: Clock, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
            { value: "ACTIVE", label: "Aktif", icon: CheckCircle, color: "text-green-700 bg-green-50 border-green-200" },
            { value: "SUSPENDED", label: "Askıda", icon: XCircle, color: "text-red-700 bg-red-50 border-red-200" },
            { value: "PRE_REGISTERED", label: "Evrak Yok", icon: Building2, color: "text-gray-700 bg-gray-50 border-gray-200" },
          ].map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setFilter(value); setExpandedId(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filter === value ? color + " shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
            <p className="text-sm">Yükleniyor...</p>
          </div>
        )}

        {!loading && firms.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Bu kategoride firma yok.</p>
          </div>
        )}

        <div className="space-y-3">
          {firms.map((firm) => {
            const sc = statusConfig[firm.status];
            const isExpanded = expandedId === firm.id;
            const isActing = acting === firm.id;
            const docs = firm.documents as Record<string, string> | null;

            return (
              <div key={firm.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Firma özet satırı */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{firm.name ?? "İsimsiz Firma"}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc?.color ?? "bg-gray-100 text-gray-600"}`}>
                          {sc?.label ?? firm.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>TC/Vergi: <span className="font-mono">{firm.taxOrTcId}</span> · Tel: {firm.phone}</p>
                        {firm.address && <p>{firm.address}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Bus className="w-3 h-3" /> {firm._count.drivers} şoför</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {firm._count.students} öğrenci</span>
                          <span className="text-gray-400">
                            {new Date(firm.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Aksiyon butonları */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {firm.status !== "ACTIVE" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs h-7 px-3"
                          onClick={() => updateStatus(firm.id, "ACTIVE")}
                          disabled={isActing}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Onayla
                        </Button>
                      )}
                      {firm.status !== "SUSPENDED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs h-7 px-3"
                          onClick={() => updateStatus(firm.id, "SUSPENDED")}
                          disabled={isActing}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Askıya Al
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-3"
                        onClick={() => deleteFirm(firm.id, firm.name)}
                        disabled={isActing}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Sil
                      </Button>
                    </div>
                  </div>

                  {/* Evrak genişlet butonu */}
                  {docs && Object.keys(docs).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : firm.id)}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {isExpanded ? "▲ Evrakları Gizle" : "▼ Evrakları Gör"}
                    </button>
                  )}
                </div>

                {/* Evraklar */}
                {isExpanded && docs && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">YÜKLENEN EVRAKLAR</p>
                    <div className="space-y-1.5">
                      {Object.entries(docs).map(([key, url]) => (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          {DOC_LABELS[key] ?? key}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
