import type { Metadata } from "next";
import SoforLayoutClient from "./sofor-layout-client";

export const metadata: Metadata = {
  title: "Şoför Paneli — Öğrenci Servis",
  manifest: "/manifest-sofor.json",
  themeColor: "#16A34A",
  appleWebApp: {
    capable: true,
    title: "Şoför Paneli",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/icons/icon-sofor.svg" }],
  },
};

export default function SoforLayout({ children }: { children: React.ReactNode }) {
  return <SoforLayoutClient>{children}</SoforLayoutClient>;
}
