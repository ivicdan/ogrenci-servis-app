import { NextRequest, NextResponse } from "next/server";
import { Server as SocketServer } from "socket.io";
import { createServer } from "http";
import { setSocketServer, getSocketServer } from "@/lib/socket-emitter";
import { verifyToken } from "@/lib/auth";

// Socket.io sunucusu Next.js API route'da singleton olarak çalışır
// Not: Bu route sadece başlatma için kullanılır, gerçek WS bağlantıları /socket.io/ üzerinden gelir

let initialized = false;

export async function GET(req: NextRequest) {
  if (!initialized && !getSocketServer()) {
    // Socket sunucusu custom HTTP server'da başlatılır (server.ts)
    // Bu endpoint sadece durum kontrolü için
  }
  return NextResponse.json({ status: "socket-ready", initialized });
}
