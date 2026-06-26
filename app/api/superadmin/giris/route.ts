import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(ipKey(req, "superadmin-giris"), 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çok fazla deneme. ${rl.retryAfter} saniye bekleyin.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { secret } = await req.json();
  const ADMIN_SECRET = process.env.ADMIN_SECRET;

  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin paneli yapılandırılmamış." }, { status: 503 });
  }

  if (!secret) {
    return NextResponse.json({ error: "Şifre gereklidir." }, { status: 401 });
  }

  // Timing-safe karşılaştırma (brute-force zamanlama saldırısı önlemi)
  const a = Buffer.from(secret);
  const b = Buffer.from(ADMIN_SECRET);
  const match =
    a.length === b.length && timingSafeEqual(a, b);

  if (!match) {
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  }

  // Gerçek secret yerine HMAC token döndür
  const token = createHmac("sha256", ADMIN_SECRET).update("superadmin-session").digest("hex");

  return NextResponse.json({ token });
}
