import Link from "next/link";
import { Bus, Building2, User } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 rounded-2xl p-4">
              <Bus className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Öğrenci Servis</h1>
          <p className="text-gray-500 mt-1 text-sm">Hangi hesabınızla giriş yapacaksınız?</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/firma/giris"
            className="flex items-center gap-4 w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="bg-blue-100 rounded-xl p-3">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Firma Girişi</p>
              <p className="text-xs text-gray-500">Servis firması yöneticisi</p>
            </div>
          </Link>

          <Link
            href="/sofor/giris"
            className="flex items-center gap-4 w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="bg-green-100 rounded-xl p-3">
              <Bus className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Şoför Girişi</p>
              <p className="text-xs text-gray-500">Servis şoförü</p>
            </div>
          </Link>

          <Link
            href="/veli/giris"
            className="flex items-center gap-4 w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="bg-purple-100 rounded-xl p-3">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Veli Girişi</p>
              <p className="text-xs text-gray-500">Öğrenci velisi</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
