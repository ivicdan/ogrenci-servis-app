import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(ipKey(req, "firma-sifre-sifirla"), 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çok fazla deneme. ${rl.retryAfter} saniye bekleyin.` },
      { status: 429 }
    );
  }

  try {
    const { taxOrTcId, otpCode, newPassword } = await req.json();
    if (!taxOrTcId || !otpCode || !newPassword) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      return NextResponse.json({ error: "Şifre 6-128 karakter arasında olmalıdır." }, { status: 400 });
    }

    const firm = await prisma.firm.findUnique({ where: { taxOrTcId } });
    if (!firm || !firm.otpCode || !firm.otpExpiry) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş kod." }, { status: 400 });
    }
    if (firm.otpCode !== otpCode) {
      return NextResponse.json({ error: "Kod hatalı." }, { status: 400 });
    }
    if (firm.otpExpiry < new Date()) {
      return NextResponse.json({ error: "Kodun süresi dolmuş. Yeni kod isteyin." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.firm.update({
      where: { id: firm.id },
      data: { password: hashed, otpCode: null, otpExpiry: null, sessionToken: null },
    });

    return NextResponse.json({ message: "Şifreniz başarıyla güncellendi." });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
