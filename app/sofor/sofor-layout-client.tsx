"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Bus, Bell, LogOut, GraduationCap, MessageSquare } from "lucide-react";
import { getUserType, clearToken, apiFetch } from "@/lib/api-client";
import { playNotificationSound, soundTypeFromTitle, requestNotificationPermission, showPushNotification } from "@/lib/notification-sound";
import { subscribeToPush } from "@/app/pwa-register";

const navItems = [
  { href: "/sofor/dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/sofor/guzergahlar", label: "Güzergahlar", icon: Bus },
  { href: "/sofor/ogrenciler", label: "Öğrencilerim", icon: GraduationCap },
  { href: "/sofor/bildirimler", label: "Bildirimler", icon: Bell, badgeKey: "notif" },
  { href: "/sofor/mesajlar", label: "Mesajlar", icon: MessageSquare, badgeKey: "msg" },
];

const PUBLIC_PATHS = ["/sofor/giris"];

export default function SoforLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const [unread, setUnread] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const prevUnread = useRef(-1);
  const prevUnreadMsg = useRef(-1);

  useEffect(() => {
    if (!isPublic && getUserType() !== "DRIVER") {
      router.replace("/sofor/giris");
    } else if (!isPublic) {
      requestNotificationPermission();
      subscribeToPush();
    }
  }, [isPublic, router]);

  // Bildirim polling
  useEffect(() => {
    if (isPublic) return;
    const fetchCount = () => {
      apiFetch<{ count: number; latestTitle: string; latestBody: string }>("/api/sofor/bildirimler/count").then(({ data }) => {
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
    const interval = setInterval(fetchCount, 20000);
    window.addEventListener("badge-refresh", fetchCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener("badge-refresh", fetchCount);
    };
  }, [isPublic]);

  // Mesaj polling (firma + şoför → şoföre gelen mesajlar)
  useEffect(() => {
    if (isPublic) return;
    const fetchMsgCount = () => {
      apiFetch<{ count: number; latestTitle: string; latestBody: string }>("/api/sofor/mesaj/count").then(({ data }) => {
        if (data) {
          if (prevUnreadMsg.current !== -1 && data.count > prevUnreadMsg.current) {
            playNotificationSound("message");
            showPushNotification(data.latestTitle || "Yeni Mesaj", data.latestBody || "Yeni bir mesajınız var.");
          }
          prevUnreadMsg.current = data.count;
          setUnreadMsg(data.count);
        }
      });
    };
    fetchMsgCount();
    const interval = setInterval(fetchMsgCount, 30000);
    window.addEventListener("badge-refresh", fetchMsgCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener("badge-refresh", fetchMsgCount);
    };
  }, [isPublic]);

  // App badge (toplam)
  useEffect(() => {
    if (isPublic) return;
    const total = unread + unreadMsg;
    if ("setAppBadge" in navigator) {
      if (total > 0) navigator.setAppBadge(total).catch(() => {});
      else navigator.clearAppBadge().catch(() => {});
    }
  }, [unread, unreadMsg, isPublic]);

  // Wake Lock — uygulama açıkken ekran kapanmasın
  useEffect(() => {
    if (isPublic) return;
    let wakeLock: WakeLockSentinel | null = null;
    async function acquire() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch { /* desteklenmiyor veya izin yok */ }
    }
    acquire();
    function onVisible() {
      if (document.visibilityState === "visible") acquire();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      wakeLock?.release().catch(() => {});
    };
  }, [isPublic]);

  // Session check
  useEffect(() => {
    if (isPublic) return;
    const checkSession = () => {
      apiFetch<{ valid: boolean }>("/api/sofor/session-check").then(({ data }) => {
        if (data?.valid === false) { clearToken(); router.push("/sofor/giris?reason=session"); }
      });
    };
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [isPublic, router]);

  if (isPublic) return <>{children}</>;

  function badgeCount(key?: string) {
    if (key === "notif") return unread;
    if (key === "msg") return unreadMsg;
    return 0;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon-sofor.svg" alt="Logo" className="w-9 h-9 rounded-full" />
            <span className="font-bold text-gray-900 text-sm leading-tight">Şoför<br/>Paneli</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const cnt = badgeCount(item.badgeKey);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {cnt > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {cnt > 9 ? "9+" : cnt}
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
            onClick={() => { clearToken(); router.push("/sofor/giris"); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-sofor.svg" alt="Logo" className="w-7 h-7 rounded-full" />
            <span className="font-bold text-gray-900 text-sm">Şoför Paneli</span>
          </div>
          <button type="button" onClick={() => { clearToken(); router.push("/sofor/giris"); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Çıkış</span>
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const cnt = badgeCount(item.badgeKey);
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center py-2 text-xs font-medium ${active ? "text-green-600" : "text-gray-500"}`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 mb-0.5" />
                  {cnt > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {cnt > 9 ? "9+" : cnt}
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
