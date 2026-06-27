import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOtp, generateOtpCode } from "@/lib/sms";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(ipKey(req, "firma-otp"), 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çok fazla deneme. ${rl.retryAfter} saniye bekleyin.` },
      { status: 429 }
    );
  }

  try {
    const { taxOrTcId } = await req.json();
    if (!taxOrTcId) {
      return NextResponse.json({ error: "TC kimlik no zorunludur." }, { status: 400 });
    }

    const firm = await prisma.firm.findUnique({ where: { taxOrTcId } });
    // Güvenlik: firma bulunamasa bile aynı mesajı ver (kullanıcı enumeration önlemi)
    if (!firm) {
      return NextResponse.json({ message: "Eğer bu TC ile kayıtlı bir hesap varsa, SMS gönderildi." });
    }

    const code = generateOtpCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    await prisma.firm.update({
      where: { id: firm.id },
      data: { otpCode: code, otpExpiry: expiry },
    });

    await sendOtp(firm.phone, code);

    return NextResponse.json({ message: "Eğer bu TC ile kayıtlı bir hesap varsa, SMS gönderildi." });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
