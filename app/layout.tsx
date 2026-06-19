import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import PWARegister from "./pwa-register";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Öğrenci Servis Uygulaması",
  description: "Güvenli ve modern öğrenci servis yönetim sistemi",
  applicationName: "Öğrenci Servis",
  appleWebApp: {
    capable: true,
    title: "Öğrenci Servis",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geist.className} h-full`}>
      <body className="min-h-full bg-gray-50">
        <PWARegister />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
