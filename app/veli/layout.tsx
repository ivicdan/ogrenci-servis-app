import type { Metadata } from "next";
import VeliLayoutClient from "./veli-layout-client";

export const metadata: Metadata = {
  title: "Veli Paneli — Öğrenci Servis",
  manifest: "/manifest-veli.json",
  themeColor: "#7C3AED",
  appleWebApp: {
    capable: true,
    title: "Veli Paneli",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/icons/icon-veli.svg" }],
  },
};

export default function VeliLayout({ children }: { children: React.ReactNode }) {
  return <VeliLayoutClient>{children}</VeliLayoutClient>;
}
