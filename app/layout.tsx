import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Öğrenci Servis Uygulaması",
  description: "Öğrenci servis yönetim sistemi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geist.className} h-full`}>
      <body className="min-h-full bg-gray-50">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
