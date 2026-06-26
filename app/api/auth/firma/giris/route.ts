import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const GENERIC_ERROR = "TC kimlik no veya şifre hatalı.";

export async function POST(req: NextRequest) {
  const rl = rateLimit(ipKey(req, "firma-giris"), 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çok fazla deneme. ${rl.retryAfter} saniye bekleyin.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { taxOrTcId, password } = await req.json();

    if (!taxOrTcId || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    const firm = await prisma.firm.findUnique({ where: { taxOrTcId } });

    // Kullanıcı bulunamasa bile bcrypt zamanını simüle et (timing attack önlemi)
    const dummyHash = "$2a$10$dummyhashfortimingattackpreventiononlyxxxxxxxxxxxxxxxx";
    const valid = firm
      ? await bcrypt.compare(password, firm.password)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!firm || !valid) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (firm.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Hesabınız askıya alınmıştır. Destek için iletişime geçin." },
        { status: 403 }
      );
    }

    const sessionToken = randomUUID();
    await prisma.firm.update({ where: { id: firm.id }, data: { sessionToken } });
    const token = signToken({ id: firm.id, userType: "FIRM", sessionToken });

    return NextResponse.json({
      token,
      firm: { id: firm.id, firmCode: firm.firmCode, name: firm.name, status: firm.status },
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
