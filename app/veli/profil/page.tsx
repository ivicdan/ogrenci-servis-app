"use client";
import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const MapPicker = dynamic(() => import("@/components/map-picker"), { ssr: false });
const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

function validatePhone(phone: string) {
  const digits = phone.replace(/[\s\-]/g, "");
  return /^\d{11}$/.test(digits) && digits[0] === "0";
}

const studyTimeLabel: Record<string, string> = {
  MORNING: "Sabah",
  AFTERNOON: "Öğleden Sonra",
  MORNING_NOON: "Sabah - Öğlen",
  MORNING_EVENING: "Sabah - Akşam",
  NOON_EVENING: "Öğlen - Akşam",
  ONE_WAY_MORNING_TO_SCHOOL: "Tek Yön — Sabah Okula Gidiş",
  ONE_WAY_NOON_TO_SCHOOL: "Tek Yön — Öğlen Okula Gidiş",
  ONE_WAY_NOON_RETURN: "Tek Yön — Öğlen Eve Dönüş",
  ONE_WAY_EVENING_RETURN: "Tek Yön — Akşam Eve Dönüş",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function VeliProfilInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";

  const [form, setForm] = useState<Record<string, string>>({});
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<any>("/api/veli/ogrenci").then(({ data }) => {
      if (!data) return;
      setForm({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        phone: data.phone ?? "",
        profession: data.profession ?? "",
        address: data.address ?? "",
        spouseFirstName: data.spouseFirstName ?? "",
        spouseLastName: data.spouseLastName ?? "",
        spousePhone: data.spousePhone ?? "",
        spouseProfession: data.spouseProfession ?? "",
        spouseRelation: data.spouseRelation ?? "",
        parentRelation: data.parentRelation ?? "",
        studentFirstName: data.student?.firstName ?? "",
        studentLastName: data.student?.lastName ?? "",
        studentBirthDate: data.student?.birthDate ? data.student.birthDate.slice(0, 10) : "",
        studentSchool: data.student?.school ?? "",
        studentClass: data.student?.class ?? "",
        studentTeacher: data.student?.teacher ?? "",
        studentPhone: data.student?.phone ?? "",
        studentStudyTime: data.student?.studyTime ?? "MORNING",
        extraPhone: data.extraPhone ?? "",
        extraPhoneRelation: data.extraPhoneRelation ?? "",
      });
      if (data.pickupLat) setPickupLat(data.pickupLat);
      if (data.pickupLng) setPickupLng(data.pickupLng);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const phone = form.phone ?? "";
    const spousePhone = form.spousePhone ?? "";
    const studentPhone = form.studentPhone ?? "";
    const extraPhone = form.extraPhone ?? "";
    if (phone && !validatePhone(phone)) return toast.error("Telefon numarası 11 haneli ve 0 ile başlamalıdır.");
    if (spousePhone && !validatePhone(spousePhone)) return toast.error("Eş/diğer veli telefonu 11 haneli ve 0 ile başlamalıdır.");
    if (studentPhone && !validatePhone(studentPhone)) return toast.error("Öğrenci telefonu 11 haneli olmalıdır.");
    if (extraPhone && !validatePhone(extraPhone)) return toast.error("Ek iletişim telefonu 11 haneli ve 0 ile başlamalıdır.");
    setLoading(true);
    const { error } = await apiFetch("/api/veli/ogrenci", {
      method: "PUT",
      body: JSON.stringify({ ...form, pickupLat, pickupLng }),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Bilgiler kaydedildi!");
    setTimeout(() => router.push("/veli/profil"), 600);
  }

  const f = (k: string) => form[k] ?? "";
  const s = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  if (isEdit) {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">Bilgileri Düzenle</h1>
          <Link href="/veli/profil" className="text-sm text-gray-500 hover:text-gray-700">İptal</Link>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">ÖĞRENCİ BİLGİLERİ</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ad</Label><Input value={f("studentFirstName")} onChange={(e) => s("studentFirstName", e.target.value)} className="mt-1" required /></div>
              <div><Label>Soyad</Label><Input value={f("studentLastName")} onChange={(e) => s("studentLastName", e.target.value)} className="mt-1" required /></div>
            </div>
            <div><Label>Doğum Tarihi</Label><Input type="date" value={f("studentBirthDate")} onChange={(e) => s("studentBirthDate", e.target.value)} className="mt-1" /></div>
            <div><Label>Okul Adı</Label><Input value={f("studentSchool")} onChange={(e) => s("studentSchool", e.target.value)} className="mt-1" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sınıf</Label><Input value={f("studentClass")} onChange={(e) => s("studentClass", e.target.value)} className="mt-1" required /></div>
              <div>
                <Label>Öğrenim Saati</Label>
                <Select value={f("studentStudyTime")} onValueChange={(v) => s("studentStudyTime", v ?? "")}>
                  <SelectTrigger className="mt-1"><SelectValue>{studyTimeLabel[f("studentStudyTime")] || "Seçin"}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING_NOON">Sabah - Öğlen</SelectItem>
                    <SelectItem value="MORNING_EVENING">Sabah - Akşam</SelectItem>
                    <SelectItem value="NOON_EVENING">Öğlen - Akşam</SelectItem>
                    <SelectItem value="ONE_WAY_MORNING_TO_SCHOOL">Tek Yön — Sabah Okula Gidiş</SelectItem>
                    <SelectItem value="ONE_WAY_NOON_TO_SCHOOL">Tek Yön — Öğlen Okula Gidiş</SelectItem>
                    <SelectItem value="ONE_WAY_NOON_RETURN">Tek Yön — Öğlen Eve Dönüş</SelectItem>
                    <SelectItem value="ONE_WAY_EVENING_RETURN">Tek Yön — Akşam Eve Dönüş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Öğretmen Adı <span className="text-gray-400 text-xs">(Anaokulu için)</span></Label><Input value={f("studentTeacher")} onChange={(e) => s("studentTeacher", e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Öğrenci Cep Telefonu <span className="text-gray-400 text-xs">(Varsa)</span></Label>
              <Input type="tel" placeholder="05xx..." value={f("studentPhone")} onChange={(e) => s("studentPhone", e.target.value.replace(/\D/g, ""))} className="mt-1" maxLength={11} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">{f("parentRelation") ? `VELİ BİLGİLERİ — ${f("parentRelation").toUpperCase()}` : "VELİ BİLGİLERİ"}</h2>
            <div>
              <Label>Bu kişi kim?</Label>
              <Select value={f("parentRelation")} onValueChange={(v) => s("parentRelation", v ?? "")}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anne">Anne</SelectItem>
                  <SelectItem value="Baba">Baba</SelectItem>
                  <SelectItem value="Vasi">Vasi</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Telefon Numarası</Label>
              <Input type="tel" placeholder="05xx..." value={f("phone")} onChange={(e) => s("phone", e.target.value.replace(/\D/g, ""))} className="mt-1" maxLength={11} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ad</Label><Input value={f("firstName")} onChange={(e) => s("firstName", e.target.value)} className="mt-1" /></div>
              <div><Label>Soyad</Label><Input value={f("lastName")} onChange={(e) => s("lastName", e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Meslek</Label><Input value={f("profession")} onChange={(e) => s("profession", e.target.value)} className="mt-1" /></div>
            <div><Label>İkamet Adresi</Label><Input value={f("address")} onChange={(e) => s("address", e.target.value)} className="mt-1" required /></div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">SERVİS ALINMA KONUMU</h2>
              <p className="text-xs text-gray-400 mt-0.5">Servisin sizi alacağı konumu haritada işaretleyin.</p>
            </div>
            <MapPicker lat={pickupLat} lng={pickupLng} onChange={(lat, lng) => { setPickupLat(lat); setPickupLng(lng); }} />
            {pickupLat && pickupLng && (
              <button type="button" onClick={() => { setPickupLat(null); setPickupLng(null); }} className="text-xs text-red-400 hover:text-red-600">Konumu Temizle</button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">{f("spouseRelation") ? `EŞ / DİĞER VELİ — ${f("spouseRelation").toUpperCase()}` : "EŞ / DİĞER VELİ"}</h2>
            <div>
              <Label>Bu kişi kim?</Label>
              <Select value={f("spouseRelation")} onValueChange={(v) => s("spouseRelation", v ?? "")}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anne">Anne</SelectItem>
                  <SelectItem value="Baba">Baba</SelectItem>
                  <SelectItem value="Vasi">Vasi</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ad</Label><Input value={f("spouseFirstName")} onChange={(e) => s("spouseFirstName", e.target.value)} className="mt-1" /></div>
              <div><Label>Soyad</Label><Input value={f("spouseLastName")} onChange={(e) => s("spouseLastName", e.target.value)} className="mt-1" /></div>
            </div>
            <div>
              <Label>Telefon</Label>
              <Input type="tel" placeholder="05xx..." value={f("spousePhone")} onChange={(e) => s("spousePhone", e.target.value.replace(/\D/g, ""))} className="mt-1" maxLength={11} />
            </div>
            <div><Label>Meslek</Label><Input value={f("spouseProfession")} onChange={(e) => s("spouseProfession", e.target.value)} className="mt-1" /></div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">EK İLETİŞİM <span className="text-gray-400 font-normal">(İsteğe bağlı)</span></h2>
            <div>
              <Label>Telefon Numarası</Label>
              <Input type="tel" placeholder="05xx..." value={f("extraPhone")} onChange={(e) => s("extraPhone", e.target.value.replace(/\D/g, ""))} className="mt-1" maxLength={11} />
            </div>
            <div><Label>Yakınlık Derecesi</Label><Input placeholder="Örn: Anne, Büyükanne..." value={f("extraPhoneRelation")} onChange={(e) => s("extraPhoneRelation", e.target.value)} className="mt-1" /></div>
          </div>

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </div>
    );
  }

  // VIEW MODE
  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Profilim</h1>
        <Link href="/veli/profil?edit=true">
          <Button size="sm" variant="outline" className="flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Düzenle
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">ÖĞRENCİ BİLGİLERİ</h2>
        <Row label="Ad Soyad" value={`${f("studentFirstName")} ${f("studentLastName")}`.trim() || null} />
        <Row label="Doğum Tarihi" value={f("studentBirthDate") ? new Date(f("studentBirthDate")).toLocaleDateString("tr-TR") : null} />
        <Row label="Okul" value={f("studentSchool")} />
        <Row label="Sınıf" value={f("studentClass")} />
        <Row label="Öğrenim Saati" value={studyTimeLabel[f("studentStudyTime")]} />
        <Row label="Öğretmen" value={f("studentTeacher")} />
        <Row label="Öğrenci Telefonu" value={f("studentPhone")} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">
          {f("parentRelation") ? `VELİ — ${f("parentRelation").toUpperCase()}` : "VELİ BİLGİLERİ"}
        </h2>
        <Row label="Ad Soyad" value={`${f("firstName")} ${f("lastName")}`.trim() || null} />
        <Row label="Telefon" value={f("phone")} />
        <Row label="Meslek" value={f("profession")} />
        <Row label="İkamet Adresi" value={f("address")} />
      </div>

      {pickupLat && pickupLng && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">SERVİS ALINMA KONUMU</h2>
          <MapView lat={pickupLat} lng={pickupLng} />
        </div>
      )}

      {(f("spouseFirstName") || f("spousePhone")) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">
            {f("spouseRelation") ? `EŞ / DİĞER VELİ — ${f("spouseRelation").toUpperCase()}` : "EŞ / DİĞER VELİ"}
          </h2>
          <Row label="Ad Soyad" value={`${f("spouseFirstName")} ${f("spouseLastName")}`.trim() || null} />
          <Row label="Telefon" value={f("spousePhone")} />
          <Row label="Meslek" value={f("spouseProfession")} />
        </div>
      )}

      {(f("extraPhone") || f("extraPhoneRelation")) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">EK İLETİŞİM</h2>
          <Row label="Telefon" value={f("extraPhone")} />
          <Row label="Yakınlık" value={f("extraPhoneRelation")} />
        </div>
      )}

      {!f("studentFirstName") && (
        <div className="text-center py-10 text-gray-400 text-sm">
          Henüz bilgi girilmemiş.{" "}
          <Link href="/veli/profil?edit=true" className="text-purple-600 font-medium">Bilgileri Ekle</Link>
        </div>
      )}
    </div>
  );
}

export default function VeliProfil() {
  return (
    <Suspense>
      <VeliProfilInner />
    </Suspense>
  );
}
