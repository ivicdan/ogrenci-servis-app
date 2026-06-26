import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { generateUniqueFirmCode } from "@/lib/id-generator";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(ipKey(req, "firma-kayit"), 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çok fazla kayıt denemesi. ${rl.retryAfter} saniye bekleyin.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { taxOrTcId, phone, password } = await req.json();

    if (!taxOrTcId || !phone || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    // Server-side validasyon
    if (!/^\d{11}$/.test(taxOrTcId)) {
      return NextResponse.json({ error: "TC Kimlik No tam 11 rakam olmalıdır." }, { status: 400 });
    }
    const phoneDigits = phone.replace(/[\s\-]/g, "");
    if (!/^\d{11}$/.test(phoneDigits) || phoneDigits[0] !== "0") {
      return NextResponse.json({ error: "Telefon numarası 11 haneli ve 0 ile başlamalıdır." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Şifre çok uzun." }, { status: 400 });
    }

    const existing = await prisma.firm.findFirst({
      where: { OR: [{ taxOrTcId }, { phone: phoneDigits }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu TC numarası veya telefon zaten kayıtlı." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const firmCode = await generateUniqueFirmCode(
      async (code) => !!(await prisma.firm.findUnique({ where: { firmCode: code } }))
    );

    const firm = await prisma.firm.create({
      data: {
        firmCode,
        taxOrTcId,
        phone: phoneDigits,
        password: hashed,
        status: "PRE_REGISTERED",
        kvkkAccepted: true,
        kvkkAcceptedAt: new Date(),
      },
    });

    const token = signToken({ id: firm.id, userType: "FIRM" });

    return NextResponse.json(
      { token, firm: { id: firm.id, firmCode: firm.firmCode, status: firm.status } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
