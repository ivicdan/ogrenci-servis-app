"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, User, CreditCard, Bell, LogOut } from "lucide-react";
import { getUserType, clearToken } from "@/lib/api-client";

const navItems = [
  { href: "/veli/dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/veli/profil", label: "Profil", icon: User },
  { href: "/veli/odeme", label: "Ödemeler", icon: CreditCard },
  { href: "/veli/bildirimler", label: "Bildirimler", icon: Bell },
];

const PUBLIC_PATHS = ["/veli/giris", "/veli/kayit"];

export default function VeliLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isPublic && getUserType() !== "PARENT") {
      router.replace("/veli/giris");
    }
  }, [isPublic, router]);

  if (isPublic) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-gray-900">Veli Paneli</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => { clearToken(); router.push("/veli/giris"); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center py-2 text-xs font-medium ${active ? "text-purple-600" : "text-gray-500"}`}
              >
                <item.icon className="w-5 h-5 mb-0.5" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="md:hidden h-16" />
      </div>
    </div>
  );
}
