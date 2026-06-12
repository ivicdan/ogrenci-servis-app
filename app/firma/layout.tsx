"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, GraduationCap, MessageSquare, Settings, LogOut, Bus } from "lucide-react";
import { getUserType, clearToken } from "@/lib/api-client";

const navItems = [
  { href: "/firma/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/firma/soforler", label: "Şoförler", icon: Bus },
  { href: "/firma/ogrenciler", label: "Öğrenciler", icon: GraduationCap },
  { href: "/firma/mesajlar", label: "Mesajlar", icon: MessageSquare },
  { href: "/firma/odemeler", label: "Ödemeler", icon: Settings },
  { href: "/firma/ayarlar", label: "Ayarlar", icon: Settings },
];

// Auth gerektirmeyen sayfalar
const PUBLIC_PATHS = ["/firma/giris", "/firma/kayit", "/firma/evrak"];

export default function FirmaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isPublic) {
      const type = getUserType();
      if (type !== "FIRM") {
        router.replace("/firma/giris");
      }
    }
  }, [isPublic, router]);

  if (isPublic) return <>{children}</>;

  function handleLogout() {
    clearToken();
    router.push("/firma/giris");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sol sidebar — masaüstü */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-900">Servis Yönetim</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* İçerik */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-6">{children}</main>

        {/* Alt navigasyon — mobil */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
          {navItems.slice(0, 4).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                  active ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <item.icon className="w-5 h-5 mb-0.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="md:hidden h-16" />
      </div>
    </div>
  );
}
