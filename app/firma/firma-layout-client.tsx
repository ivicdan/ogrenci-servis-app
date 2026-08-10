"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, GraduationCap, MessageSquare, Settings, LogOut, Bus, Bell, CreditCard, Clock, BookOpen, Car } from "lucide-react";
import { getUserType, clearToken, apiFetch } from "@/lib/api-client";
import { playNotificationSound, soundTypeFromTitle, requestNotificationPermission, showPushNotification } from "@/lib/notification-sound";
import { subscribeToPush } from "@/app/pwa-register";

const navItems = [
  { href: "/firma/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/firma/soforler", label: "Şoförler", icon: Bus },
  { href: "/firma/ogrenciler", label: "Öğrenciler", icon: GraduationCap },
  { href: "/firma/mesajlar", label: "Mesajlar", icon: MessageSquare, showBadge: true },
  { href: "/firma/odemeler", label: "Ödemeler", icon: CreditCard },
  { href: "/firma/muhasebe", label: "Muhasebe", icon: BookOpen },
  { href: "/firma/araclarim", label: "Araçlarım", icon: Car },
  { href: "/firma/ayarlar", label: "Ayarlar", icon: Settings },
];

const PUBLIC_PATHS = ["/firma/giris", "/firma/kayit", "/firma/evrak"];
const PENDING_STATUSES = ["PRE_REGISTERED", "PENDING_APPROVAL"];

export default function FirmaLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const [unread, setUnread] = useState(0);
  const [firmStatus, setFirmStatus] = useState<string | null>(null);
  const prevUnread = useRef(-1);

  useEffect(() => {
    if (!isPublic) {
      const type = getUserType();
      if (type !== "FIRM") {
        router.replace("/firma/giris");
      } else {
        requestNotificationPermission();
        subscribeToPush();
      }
    }
  }, [isPublic, router]);

  useEffect(() => {
    if (isPublic) return;
    apiFetch<{ status: string }>("/api/firma/profil").then(({ data }) => {
      if (data?.status) setFirmStatus(data.status);
    });
  }, [isPublic]);

  useEffect(() => {
    if (isPublic) return;
    const fetchCount = () => {
      apiFetch<{ count: number; latestTitle: string; latestBody: string }>("/api/firma/bildirimler/count").then(({ data }) => {
        if (data) {
          if (prevUnread.current !== -1 && data.count > prevUnread.current) {
            playNotificationSound(soundTypeFromTitle(data.latestTitle, data.latestBody));
            showPushNotification(data.latestTitle || "Yeni Bildirim", data.latestBody || `${data.count - prevUnread.current} yeni bildiriminiz var.`);
          }
          prevUnread.current = data.count;
          setUnread(data.count);
          if ("setAppBadge" in navigator) {
            if (data.count > 0) navigator.setAppBadge(data.count).catch(() => {});
            else navigator.clearAppBadge().catch(() => {});
          }
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
      apiFetch<{ valid: boolean }>("/api/firma/session-check").then(({ data }) => {
        if (data?.valid === false) {
          clearToken();
          router.push("/firma/giris?reason=session");
        }
      });
    };
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [isPublic, router]);

  if (isPublic) return <>{children}</>;

  function handleLogout() {
    clearToken();
    router.push("/firma/giris");
  }

  const isPending = firmStatus !== null && PENDING_STATUSES.includes(firmStatus);
  // Dashboard kendi pasif modunu gösteriyor — sadece diğer sayfalarda overlay
  const showOverlay = isPending && !pathname.startsWith("/firma/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon-firma.svg" alt="Logo" className="w-9 h-9 rounded-full" />
            <span className="font-bold text-gray-900 text-sm leading-tight">Servis<br/>Yönetim</span>
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
                  active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-firma.svg" alt="Logo" className="w-7 h-7 rounded-full" />
            <span className="font-bold text-gray-900 text-sm">Servis Yönetim</span>
          </div>
          <button type="button" onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Çıkış</span>
          </button>
        </header>

        {/* Onay bekliyor üst banner (tüm sayfalarda görünür) */}
        {isPending && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Hesabınız onay bekliyor — onay alınana kadar işlem yapılamaz.
            </p>
            <Link href="/firma/dashboard" className="ml-auto text-xs text-amber-700 underline underline-offset-2 flex-shrink-0">
              Detay
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 relative">
          {children}
          {/* Overlay: dashboard hariç tüm sayfalarda işlem engellenir */}
          {showOverlay && (
            <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[2px] flex items-start justify-center pt-16 pointer-events-auto">
              <div className="bg-white rounded-2xl shadow-md border border-amber-100 px-6 py-5 mx-4 text-center max-w-xs">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm mb-1">Onay Bekleniyor</p>
                <p className="text-xs text-gray-500">
                  Hesabınız onaylandıktan sonra bu bölümü kullanabilirsiniz.
                </p>
                <Link
                  href="/firma/dashboard"
                  className="mt-3 inline-block text-xs text-blue-600 font-medium hover:underline"
                >
                  Dashboard'a Dön
                </Link>
              </div>
            </div>
          )}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-1.5 transition-colors ${
                  active ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4 mb-0.5" />
                  {item.showBadge && unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="md:hidden h-16" />
      </div>
    </div>
  );
}
