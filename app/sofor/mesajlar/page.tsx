"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Building2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface Message {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  senderType: "FIRM" | "DRIVER";
}

export default function SoforMesajlar() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Message[]>("/api/sofor/mesaj")
      .then(({ data }) => { if (data) setMessages(data); })
      .finally(() => setLoading(false));
    apiFetch("/api/sofor/mesaj", { method: "PUT" });
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Firma Mesajları</h1>

      {loading && <p className="text-center text-gray-400 py-8">Yükleniyor...</p>}

      {!loading && messages.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Firmadan mesaj yok</p>
        </div>
      )}

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mt-0.5">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Firma</span>
                <p className="font-semibold text-gray-900 text-sm mt-1">{m.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{m.body}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {new Date(m.createdAt).toLocaleString("tr-TR", {
                    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
