"use client";
import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { CopyPhone } from "@/components/copy-phone";
import Link from "next/link";

interface Payment {
  id: string;
  amount: string;
  dueDate: string;
  paidDate: string | null;
  method: string | null;
  status: string;
  student: {
    firstName: string;
    lastName: string;
    parent: { firstName: string; lastName: string; phone: string } | null;
  };
}

interface OverdueParent {
  parentId: string;
  parentName: string;
  studentId: string;
  studentName: string;
  paymentDay: number;
  daysLate: number;
}

const methodMap: Record<string, string> = {
  CASH: "Nakit", BANK_TRANSFER: "Havale/EFT",
};

const tabs = [
  { key: "SUBMITTED", label: "Onay Bekliyor" },
  { key: "OVERDUE",   label: "Gecikmiş" },
  { key: "APPROVED",  label: "Onaylananlar" },
  { key: "REJECTED",  label: "Reddedilenler" },
];

export default function FirmaOdemeler() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [overdueParents, setOverdueParents] = useState<OverdueParent[]>([]);
  const [filter, setFilter] = useState("SUBMITTED");

  // Reddet modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => { loadPayments(); }, [filter]);

  useEffect(() => {
    if (filter === "OVERDUE") {
      apiFetch<OverdueParent[]>("/api/firma/odemesi-gecikenler").then(({ data }) => {
        if (data) setOverdueParents(data);
      });
    }
  }, [filter]);

  async function loadPayments() {
    const { data } = await apiFetch<Payment[]>(`/api/firma/odeme?status=${filter}`);
    if (data) setPayments(data);
  }

  async function handleApprove(id: string) {
    const { error } = await apiFetch(`/api/firma/odeme/${id}/onayla`, { method: "PUT" });
    if (error) return toast.error(error);
    toast.success("Ödeme onaylandı!");
    loadPayments();
  }

  async function handleReject() {
    if (!rejectId) return;
    setRejecting(true);
    const { error } = await apiFetch(`/api/firma/odeme/${rejectId}/reddet`, {
      method: "PUT",
      body: JSON.stringify({ reason: rejectReason }),
    });
    setRejecting(false);
    if (error) return toast.error(error);
    toast.success("Ödeme reddedildi. Veli bilgilendirildi.");
    setRejectId(null);
    setRejectReason("");
    loadPayments();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Ödemeler</h1>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === t.key
                ? t.key === "REJECTED"
                  ? "bg-red-600 text-white"
                  : "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {t.key === "OVERDUE" && (
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-red-400" />
            )}
            {t.key === "REJECTED" && (
              <XCircle className="w-3.5 h-3.5 inline mr-1" />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* Ödeme kartları */}
      <div className="space-y-3">
        {payments.length === 0 && filter !== "OVERDUE" && (
          <div className="text-center py-12 text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Bu kategoride ödeme yok</p>
          </div>
        )}

        {payments.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${
              p.status === "REJECTED"
                ? "border-red-200 bg-red-50"
                : filter === "OVERDUE"
                ? "border-red-100"
                : "border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {p.student.firstName} {p.student.lastName}
                </p>
                {p.student.parent && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                    <span>
                      Veli: {p.student.parent.firstName} {p.student.parent.lastName}
                    </span>
                    {p.student.parent.phone && (
                      <CopyPhone phone={p.student.parent.phone} className="text-blue-500" />
                    )}
                  </div>
                )}
              </div>
              <StatusBadge status={p.status} filter={filter} />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm space-y-0.5">
                <p className="font-medium text-gray-900">
                  {Number(p.amount).toLocaleString("tr-TR")} TL
                </p>
                {p.paidDate && (
                  <p className="text-xs text-gray-500">
                    Ödeme: {new Date(p.paidDate).toLocaleDateString("tr-TR")}
                    {p.method && ` · ${methodMap[p.method]}`}
                  </p>
                )}
                {filter === "OVERDUE" && (
                  <p className="text-xs text-red-500">
                    Son ödeme: {new Date(p.dueDate).toLocaleDateString("tr-TR")}
                  </p>
                )}
              </div>

              {p.status === "SUBMITTED" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setRejectId(p.id); setRejectReason(""); }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reddet
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(p.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Onayla
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Gecikmiş veliler */}
        {filter === "OVERDUE" && overdueParents.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Ödeme Günü Geçenler
            </p>
            <div className="space-y-2">
              {overdueParents.map((o) => (
                <Link
                  key={o.studentId}
                  href={`/firma/ogrenciler/${o.studentId}`}
                  className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-red-100 hover:bg-red-50 transition-all"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{o.studentName}</p>
                    <p className="text-xs text-gray-500">
                      {o.parentName} · Her ayın {o.paymentDay}. günü
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-lg flex-shrink-0">
                    {o.daysLate} gün geç
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {filter === "OVERDUE" && payments.length === 0 && overdueParents.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Gecikmiş ödeme yok</p>
          </div>
        )}
      </div>

      {/* Reddet modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ödemeyi Reddet</h2>
            <p className="text-sm text-gray-500 mb-4">
              Bu ödeme reddedilecek ve veli bilgilendirilecek.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Red nedeni <span className="text-gray-400">(isteğe bağlı)</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={3}
              placeholder="Örn: Yanlış hesap, eksik tutar..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRejectId(null)}
                disabled={rejecting}
              >
                İptal
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={rejecting}
              >
                {rejecting ? "Reddediliyor..." : "Reddet"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, filter }: { status: string; filter: string }) {
  if (filter === "OVERDUE") {
    return (
      <Badge variant="secondary" className="text-xs text-red-600 bg-red-50">
        Gecikmiş
      </Badge>
    );
  }
  const map: Record<string, { label: string; className: string }> = {
    APPROVED: { label: "Onaylandı",    className: "bg-green-100 text-green-700" },
    SUBMITTED:{ label: "Onay Bekliyor",className: "bg-blue-100 text-blue-700" },
    REJECTED: { label: "Reddedildi",   className: "bg-red-100 text-red-700" },
    PENDING:  { label: "Bekliyor",     className: "bg-yellow-100 text-yellow-700" },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${s.className}`}>
      {s.label}
    </span>
  );
}
