"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, User, CreditCard, Bell, LogOut, AlertTriangle } from "lucide-react";
import { getUserType, clearToken, apiFetch } from "@/lib/api-client";
import { playNotificationSound, soundTypeFromTitle, requestNotificationPermission, showPushNotification } from "@/lib/notification-sound";

const navItems = [
  { href: "/veli/dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/veli/profil", label: "Profil", icon: User },
  { href: "/veli/odeme", label: "Ödemeler", icon: CreditCard },
  { href: "/veli/devamsizlik", label: "Devamsızlık", icon: AlertTriangle },
  { href: "/veli/bildirimler", label: "Bildirimler", icon: Bell, showBadge: true },
];

const PUBLIC_PATHS = ["/veli/giris", "/veli/kayit"];

export default function VeliLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const [unread, setUnread] = useState(0);
  const prevUnread = useRef(-1);

  useEffect(() => {
    if (!isPublic && getUserType() !== "PARENT") {
      router.replace("/veli/giris");
    } else if (!isPublic) {
      requestNotificationPermission();
    }
  }, [isPublic, router]);

  useEffect(() => {
    if (isPublic) return;
    const fetchCount = () => {
      apiFetch<{ count: number; latestTitle: string; latestBody: string }>("/api/veli/bildirimler/count").then(({ data }) => {
        if (data) {
          if (prevUnread.current !== -1 && data.count > prevUnread.current) {
            playNotificationSound(soundTypeFromTitle(data.latestTitle, data.latestBody));
            showPushNotification(data.latestTitle || "Yeni Bildirim", data.latestBody || `${data.count - prevUnread.current} yeni bildiriminiz var.`);
          }
          prevUnread.current = data.count;
          setUnread(data.count);
        }
      });
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isPublic]);

  useEffect(() => {
    if (isPublic) return;
    const checkSession = () => {
      apiFetch<{ valid: boolean }>("/api/veli/session-check").then(({ data }) => {
        if (data?.valid === false) {
          clearToken();
          router.push("/veli/giris?reason=session");
        }
      });
    };
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
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
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {item.showBadge && unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                {item.label}
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
        <header className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-gray-900 text-sm">Veli Paneli</span>
          </div>
          <button onClick={() => { clearToken(); router.push("/veli/giris"); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Çıkış</span>
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center py-2 text-xs font-medium ${active ? "text-purple-600" : "text-gray-500"}`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 mb-0.5" />
                  {item.showBadge && unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
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
