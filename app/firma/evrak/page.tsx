"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch, getToken } from "@/lib/api-client";

interface DocField {
  key: string;
  label: string;
  required: boolean;
  hint?: string;
}

const DOC_FIELDS: DocField[] = [
  { key: "imza_sirkuleri", label: "İmza Sirküsü", required: true, hint: "PDF veya resim" },
  { key: "vergi_levhasi", label: "Vergi Levhası", required: true, hint: "PDF veya resim" },
  { key: "kimlik_fotokopisi", label: "Kimlik Fotokopisi / Fotoğrafı", required: true, hint: "Fotoğraf veya PDF" },
  { key: "ticaret_sicil", label: "Ticaret Sicil Gazetesi", required: false, hint: "İsteğe bağlı" },
  { key: "faaliyet_belgesi", label: "Faaliyet Belgesi", required: false, hint: "İsteğe bağlı" },
];

type UploadState = "idle" | "uploading" | "done" | "error";

export default function FirmaEvrak() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", iban: "" });
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function setDocState(key: string, state: UploadState) {
    setUploadStates((prev) => ({ ...prev, [key]: state }));
  }

  async function handleFileChange(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocState(key, "uploading");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", key);

    try {
      const res = await fetch("/api/firma/evrak-yukle", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Yükleme başarısız.");
        setDocState(key, "error");
      } else {
        setDocState(key, "done");
        setUploadedFiles((prev) => ({ ...prev, [key]: file.name }));
      }
    } catch {
      toast.error("Yükleme sırasında hata oluştu.");
      setDocState(key, "error");
    }

    e.target.value = "";
  }

  function removeFile(key: string) {
    setDocState(key, "idle");
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const missingRequired = DOC_FIELDS.filter(
      (d) => d.required && uploadStates[d.key] !== "done"
    );
    if (missingRequired.length > 0) {
      return toast.error(`Zorunlu evrakları yükleyin: ${missingRequired.map((d) => d.label).join(", ")}`);
    }

    if (form.iban && form.iban.length !== 16) {
      return toast.error("IBAN 16 rakam olmalıdır.");
    }

    setLoading(true);
    const ibanFull = form.iban ? "TR" + form.iban : "";
    const { error } = await apiFetch("/api/firma/profil", {
      method: "PUT",
      body: JSON.stringify({ name: form.name, address: form.address, iban: ibanFull }),
    });
    setLoading(false);

    if (error) return toast.error(error);
    router.push("/firma/onay-bekleniyor");
  }

  const requiredDone = DOC_FIELDS.filter((d) => d.required).every(
    (d) => uploadStates[d.key] === "done"
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 rounded-2xl p-3">
            <FileText className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Şirket Bilgileri ve Evraklar</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Kesin kaydı tamamlamak için bilgileri doldurun ve evrakları yükleyin</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Şirket bilgileri */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Firma Adı</Label>
              <Input
                id="name"
                placeholder="ABC Öğrenci Servisleri Ltd."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address">Firma Adresi</Label>
              <Input
                id="address"
                placeholder="İl, İlçe, Mahalle..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="iban">IBAN (Ödeme için)</Label>
              <div className="flex mt-1">
                <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-input rounded-l-md text-sm font-mono font-semibold text-gray-700 select-none">TR</span>
                <Input
                  id="iban"
                  placeholder="16 haneli numara"
                  value={form.iban}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setForm({ ...form, iban: digits });
                  }}
                  className="rounded-l-none font-mono"
                  maxLength={16}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Sadece 16 rakam girin. (TR + 16 rakam)</p>
            </div>
          </div>

          {/* Evrak yükleme */}
          <div className="border-t pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Gerekli Evraklar</p>
            <div className="space-y-3">
              {DOC_FIELDS.map((doc) => {
                const state = uploadStates[doc.key] ?? "idle";
                const fileName = uploadedFiles[doc.key];

                return (
                  <div key={doc.key} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800">{doc.label}</span>
                        {doc.required ? (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Zorunlu</span>
                        ) : (
                          <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">İsteğe bağlı</span>
                        )}
                      </div>
                      {state === "done" && (
                        <button
                          type="button"
                          onClick={() => removeFile(doc.key)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {state === "done" ? (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{fileName}</span>
                      </div>
                    ) : state === "uploading" ? (
                      <div className="flex items-center gap-2 text-blue-600 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>Yükleniyor...</span>
                      </div>
                    ) : (
                      <label className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                        state === "error"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                      }`}>
                        <Upload className="w-4 h-4 flex-shrink-0" />
                        <span>{state === "error" ? "Tekrar dene — Dosya seçin" : `Dosya seçin (PDF / Resim)`}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => handleFileChange(doc.key, e)}
                        />
                      </label>
                    )}
                    {doc.hint && state === "idle" && (
                      <p className="text-xs text-gray-400 mt-1 ml-1">{doc.hint} · Max 10 MB</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!requiredDone && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Zorunlu evrakların tamamı yüklendiğinde kayıt tamamlanabilir.
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading || !requiredDone}
          >
            {loading ? "Kaydediliyor..." : "Kaydı Tamamla"}
          </Button>
        </form>
      </div>
    </div>
  );
}
