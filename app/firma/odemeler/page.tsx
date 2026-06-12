"use client";
import { useEffect, useState } from "react";
import { CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

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
    parent: { firstName: string; lastName: string } | null;
  };
}

export default function FirmaOdemeler() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState("SUBMITTED");

  useEffect(() => { loadPayments(); }, [filter]);

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

  const statusMap: Record<string, string> = {
    PENDING: "Bekliyor", SUBMITTED: "Onay Bekliyor", APPROVED: "Onaylandı",
  };

  const methodMap: Record<string, string> = {
    CASH: "Nakit", BANK_TRANSFER: "Havale/EFT",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Ödemeler</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["SUBMITTED", "APPROVED", "PENDING"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {statusMap[s]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {payments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Bu kategoride ödeme yok</p>
          </div>
        )}
        {payments.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {p.student.firstName} {p.student.lastName}
                </p>
                {p.student.parent && (
                  <p className="text-xs text-gray-500">
                    Veli: {p.student.parent.firstName} {p.student.parent.lastName}
                  </p>
                )}
              </div>
              <Badge
                variant={p.status === "APPROVED" ? "default" : "secondary"}
                className="text-xs"
              >
                {statusMap[p.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm space-y-0.5">
                <p className="font-medium text-gray-900">{Number(p.amount).toLocaleString("tr-TR")} TL</p>
                {p.paidDate && (
                  <p className="text-xs text-gray-500">
                    Ödeme: {new Date(p.paidDate).toLocaleDateString("tr-TR")}
                    {p.method && ` · ${methodMap[p.method]}`}
                  </p>
                )}
              </div>
              {p.status === "SUBMITTED" && (
                <Button
                  size="sm"
                  onClick={() => handleApprove(p.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Onayla
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
