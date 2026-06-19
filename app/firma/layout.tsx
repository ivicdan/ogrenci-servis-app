import type { Metadata } from "next";
import FirmaLayoutClient from "./firma-layout-client";

export const metadata: Metadata = {
  title: "Firma Paneli — Öğrenci Servis",
  manifest: "/manifest-firma.json",
  themeColor: "#2563EB",
  appleWebApp: {
    capable: true,
    title: "Firma Paneli",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/icons/icon-firma.svg" }],
  },
};

export default function FirmaLayout({ children }: { children: React.ReactNode }) {
  return <FirmaLayoutClient>{children}</FirmaLayoutClient>;
}
