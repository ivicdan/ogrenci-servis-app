"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, User, CreditCard, Bell, LogOut, AlertTriangle, MessageSquare, ChevronDown } from "lucide-react";
import { getUserType, clearToken, apiFetch } from "@/lib/api-client";
import { setActiveStudentId } from "@/lib/active-student";
import { playNotificationSound, soundTypeFromTitle, requestNotificationPermission, showPushNotification } from "@/lib/notification-sound";
import { subscribeToPush } from "@/app/pwa-register";

const navItems = [
  { href: "/veli/dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/veli/profil", label: "Profil", icon: User },
  { href: "/veli/odeme", label: "Ödemeler", icon: CreditCard },
  { href: "/veli/devamsizlik", label: "Devamsızlık", icon: AlertTriangle },
  { href: "/veli/bildirimler", label: "Bildirimler", icon: Bell, badgeKey: "notif" },
  { href: "/veli/mesajlar", label: "Mesajlar", icon: MessageSquare, badgeKey: "msg" },
];

const PUBLIC_PATHS = ["/veli/giris", "/veli/kayit"];

interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export default function VeliLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const [unread, setUnread] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const prevUnread = useRef(-1);
  const prevUnreadMsg = useRef(-1);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [activeStudentId, setActiveLocal] = useState<string>("");

  useEffect(() => {
    if (!isPublic && getUserType() !== "PARENT") {
      router.replace("/veli/giris");
    } else if (!isPublic) {
      requestNotificationPermission();
      subscribeToPush();
    }
  }, [isPublic, router]);

  // Öğrenci listesini çek ve aktif öğrenciyi belirle
  useEffect(() => {
    if (isPublic) return;
    apiFetch<any>("/api/veli/ogrenci").then(({ data }) => {
      if (!data?.students?.length) return;
      const list: StudentSummary[] = data.students.map((s: any) => ({
        id: s.id,
        firstName: s.firstName || "Öğrenci",
        lastName: s.lastName || "",
      }));
      setStudents(list);
      const stored = localStorage.getItem("veli_student_id");
      const active = list.find((s) => s.id === stored) ?? list[0];
      setActiveLocal(active.id);
      if (!stored || stored !== active.id) {
        localStorage.setItem("veli_student_id", active.id);
      }
    });
  }, [isPublic]);

  function switchStudent(id: string) {
    setActiveLocal(id);
    setActiveStudentId(id);
    window.dispatchEvent(new CustomEvent("veli-student-changed", { detail: { studentId: id } }));
  }

  // Bildirim polling
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
    window.addEventListener("badge-refresh", fetchCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener("badge-refresh", fetchCount);
    };
  }, [isPublic]);

  // Mesaj polling
  useEffect(() => {
    if (isPublic) return;
    const fetchMsgCount = () => {
      apiFetch<{ count: number; latestTitle: string; latestBody: string }>("/api/veli/mesaj/count").then(({ data }) => {
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

  // App badge (bildirimler)
  useEffect(() => {
    if (isPublic) return;
    const total = unread + unreadMsg;
    if ("setAppBadge" in navigator) {
      if (total > 0) navigator.setAppBadge(total).catch(() => {});
      else navigator.clearAppBadge().catch(() => {});
    }
  }, [unread, unreadMsg, isPublic]);

  // Wake Lock — ekran açık kalsın
  useEffect(() => {
    if (isPublic) return;
    let wakeLock: WakeLockSentinel | null = null;
    async function acquire() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch { /* izin verilmedi veya desteklenmiyor */ }
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
      apiFetch<{ valid: boolean }>("/api/veli/session-check").then(({ data }) => {
        if (data?.valid === false) { clearToken(); router.push("/veli/giris?reason=session"); }
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
            <img src="/icons/icon-veli.svg" alt="Logo" className="w-9 h-9 rounded-full" />
            <span className="font-bold text-gray-900 text-sm leading-tight">Veli<br/>Paneli</span>
          </div>
          {students.length > 1 && (
            <div className="mt-3 relative">
              <select
                aria-label="Aktif öğrenci seç"
                value={activeStudentId}
                onChange={(e) => switchStudent(e.target.value)}
                className="w-full appearance-none text-xs rounded-xl border border-gray-200 pl-2.5 pr-7 py-1.5 text-gray-700 focus:outline-none focus:border-purple-300 bg-gray-50 cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const cnt = badgeCount(item.badgeKey);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
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
            onClick={() => { clearToken(); router.push("/veli/giris"); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/icons/icon-veli.svg" alt="Logo" className="w-7 h-7 rounded-full flex-shrink-0" />
            {students.length > 1 ? (
              <div className="relative min-w-0">
                <select
                  aria-label="Aktif öğrenci seç"
                  value={activeStudentId}
                  onChange={(e) => switchStudent(e.target.value)}
                  className="appearance-none text-xs font-semibold rounded-lg border border-gray-200 pl-2 pr-6 py-1.5 text-gray-800 focus:outline-none focus:border-purple-300 bg-gray-50 cursor-pointer max-w-[160px] truncate"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            ) : (
              <span className="font-bold text-gray-900 text-sm">Veli Paneli</span>
            )}
          </div>
          <button type="button" onClick={() => { clearToken(); router.push("/veli/giris"); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors flex-shrink-0">
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
                className={`flex-1 flex flex-col items-center py-2 text-xs font-medium ${active ? "text-purple-600" : "text-gray-500"}`}
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
