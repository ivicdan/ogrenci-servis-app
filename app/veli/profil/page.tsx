"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

function validatePhone(phone: string) {
  const digits = phone.replace(/[\s\-]/g, "");
  return /^\d{11}$/.test(digits) && digits[0] === "0";
}

const studyTimeLabel: Record<string, string> = {
  MORNING: "Sabah",
  AFTERNOON: "Öğleden Sonra",
};

export default function VeliProfil() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<any>("/api/veli/ogrenci").then(({ data }) => {
      if (data) {
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
      }
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
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Bilgiler güncellendi!");
    router.push("/veli/dashboard");
  }

  const f = (k: string) => form[k] ?? "";
  const s = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Profil Bilgileri</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">ÖĞRENCİ BİLGİLERİ</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ad</Label>
              <Input value={f("studentFirstName")} onChange={(e) => s("studentFirstName", e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label>Soyad</Label>
              <Input value={f("studentLastName")} onChange={(e) => s("studentLastName", e.target.value)} className="mt-1" required />
            </div>
          </div>
          <div>
            <Label>Doğum Tarihi</Label>
            <Input type="date" value={f("studentBirthDate")} onChange={(e) => s("studentBirthDate", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Okul Adı</Label>
            <Input value={f("studentSchool")} onChange={(e) => s("studentSchool", e.target.value)} className="mt-1" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sınıf</Label>
              <Input value={f("studentClass")} onChange={(e) => s("studentClass", e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label>Öğrenim Saati</Label>
              <Select value={f("studentStudyTime")} onValueChange={(v) => s("studentStudyTime", v ?? "")}>
                <SelectTrigger className="mt-1">
                  <SelectValue>{studyTimeLabel[f("studentStudyTime")] || "Seçin"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Sabah</SelectItem>
                  <SelectItem value="AFTERNOON">Öğleden Sonra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Öğretmen Adı <span className="text-gray-400 text-xs">(Anaokulu için)</span></Label>
            <Input value={f("studentTeacher")} onChange={(e) => s("studentTeacher", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Öğrenci Cep Telefonu <span className="text-gray-400 text-xs">(Varsa)</span></Label>
            <Input
              type="tel"
              placeholder="Lütfen başında 0 olacak şekilde yazınız"
              value={f("studentPhone")}
              onChange={(e) => s("studentPhone", e.target.value.replace(/\D/g, ""))}
              className="mt-1"
              maxLength={11}
            />
            <p className="text-xs text-gray-400 mt-1">11 haneli, başında 0 ile yazınız.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">
              {f("parentRelation") ? `VELİ BİLGİLERİ — ${f("parentRelation").toUpperCase()}` : "VELİ BİLGİLERİ"}
            </h2>
          </div>
          <div>
            <Label>Bu kişi kim?</Label>
            <Select value={f("parentRelation")} onValueChange={(v) => s("parentRelation", v ?? "")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seçin..." />
              </SelectTrigger>
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
            <Input type="tel" placeholder="Lütfen başında 0 olacak şekilde yazınız" value={f("phone")} onChange={(e) => s("phone", e.target.value.replace(/\D/g, ""))} className="mt-1" maxLength={11} />
            {f("phone").length > 0 && f("phone")[0] !== "0" ? (
              <p className="text-xs text-red-500 mt-1">İlk rakam 0 olmalıdır.</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">11 haneli, başında 0 ile yazınız.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ad</Label>
              <Input value={f("firstName")} onChange={(e) => s("firstName", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Soyad</Label>
              <Input value={f("lastName")} onChange={(e) => s("lastName", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Meslek</Label>
            <Input value={f("profession")} onChange={(e) => s("profession", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>İkamet Adresi</Label>
            <Input value={f("address")} onChange={(e) => s("address", e.target.value)} className="mt-1" required />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">
              {f("spouseRelation") ? `EŞ / DİĞER VELİ — ${f("spouseRelation").toUpperCase()}` : "EŞ / DİĞER VELİ"}
            </h2>
          </div>
          <div>
            <Label>Bu kişi kim?</Label>
            <Select value={f("spouseRelation")} onValueChange={(v) => s("spouseRelation", v ?? "")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Anne">Anne</SelectItem>
                <SelectItem value="Baba">Baba</SelectItem>
                <SelectItem value="Vasi">Vasi</SelectItem>
                <SelectItem value="Diğer">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ad</Label>
              <Input value={f("spouseFirstName")} onChange={(e) => s("spouseFirstName", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Soyad</Label>
              <Input value={f("spouseLastName")} onChange={(e) => s("spouseLastName", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Telefon</Label>
            <Input type="tel" placeholder="Lütfen başında 0 olacak şekilde yazınız" value={f("spousePhone")} onChange={(e) => s("spousePhone", e.target.value.replace(/\D/g, ""))} className="mt-1" maxLength={11} />
            {f("spousePhone").length > 0 && f("spousePhone")[0] !== "0" ? (
              <p className="text-xs text-red-500 mt-1">İlk rakam 0 olmalıdır.</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">11 haneli, başında 0 ile yazınız.</p>
            )}
          </div>
          <div>
            <Label>Meslek</Label>
            <Input value={f("spouseProfession")} onChange={(e) => s("spouseProfession", e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">EK İLETİŞİM <span className="text-gray-400 font-normal">(İsteğe bağlı)</span></h2>
          <div>
            <Label>Telefon Numarası</Label>
            <Input type="tel" placeholder="Lütfen başında 0 olacak şekilde yazınız" value={f("extraPhone")} onChange={(e) => s("extraPhone", e.target.value.replace(/\D/g, ""))} className="mt-1" maxLength={11} />
            {f("extraPhone").length > 0 && f("extraPhone")[0] !== "0" ? (
              <p className="text-xs text-red-500 mt-1">İlk rakam 0 olmalıdır.</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">11 haneli, başında 0 ile yazınız.</p>
            )}
          </div>
          <div>
            <Label>Yakınlık Derecesi</Label>
            <Input placeholder="Örn: Anne, Baba, Büyükanne, Komşu..." value={f("extraPhoneRelation")} onChange={(e) => s("extraPhoneRelation", e.target.value)} className="mt-1" />
          </div>
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>
    </div>
  );
}
