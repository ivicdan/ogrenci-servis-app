"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface ParentData {
  firstName: string;
  lastName: string;
  profession: string | null;
  address: string;
  spouseName: string | null;
  spousePhone: string | null;
  spouseProfession: string | null;
  student: {
    firstName: string;
    lastName: string;
    birthDate: string | null;
    school: string;
    class: string;
    teacher: string | null;
    studyTime: string;
  };
}

export default function VeliProfil() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<ParentData>("/api/veli/ogrenci").then(({ data }) => {
      if (data) {
        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          profession: data.profession ?? "",
          address: data.address ?? "",
          spouseName: data.spouseName ?? "",
          spousePhone: data.spousePhone ?? "",
          spouseProfession: data.spouseProfession ?? "",
          studentFirstName: data.student.firstName ?? "",
          studentLastName: data.student.lastName ?? "",
          studentBirthDate: data.student.birthDate ? data.student.birthDate.slice(0, 10) : "",
          studentSchool: data.student.school ?? "",
          studentClass: data.student.class ?? "",
          studentTeacher: data.student.teacher ?? "",
          studentStudyTime: data.student.studyTime ?? "MORNING",
        });
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await apiFetch("/api/veli/ogrenci", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Bilgiler güncellendi!");
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
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Sabah</SelectItem>
                  <SelectItem value="AFTERNOON">Öğlen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Öğretmen Adı <span className="text-gray-400 text-xs">(Anaokulu için zorunlu)</span></Label>
            <Input value={f("studentTeacher")} onChange={(e) => s("studentTeacher", e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">VELİ BİLGİLERİ</h2>
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
          <h2 className="font-semibold text-gray-900 text-sm">EŞ / DİĞER VELİ</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ad Soyad</Label>
              <Input value={f("spouseName")} onChange={(e) => s("spouseName", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input type="tel" value={f("spousePhone")} onChange={(e) => s("spousePhone", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Meslek</Label>
            <Input value={f("spouseProfession")} onChange={(e) => s("spouseProfession", e.target.value)} className="mt-1" />
          </div>
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>
    </div>
  );
}
