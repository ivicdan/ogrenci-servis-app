"use client";
import { useRouter } from "next/navigation";
import { Clock, FileCheck, Phone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/api-client";

export default function OnayBekleniyor() {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/firma/giris");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Onay Bekleniyor</h1>
        <p className="text-gray-500 text-sm mb-6">
          Başvurunuz alındı. Ekibimiz evraklarınızı inceledikten sonra
          hesabınız aktif edilecektir.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <FileCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">Evraklarınız incelemeye alındı.</p>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">Onay süreci genellikle <strong>1 iş günü</strong> içinde tamamlanır.</p>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">Onaylandığında kayıt sırasında verdiğiniz telefon üzerinden bilgilendirileceksiniz.</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full text-gray-600"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
}
