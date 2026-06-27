"use client";
import SifreDegistir from "@/components/sifre-degistir";

export default function SoforAyarlar() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Ayarlar</h1>
      <SifreDegistir endpoint="/api/sofor/sifre-degistir" />
    </div>
  );
}
