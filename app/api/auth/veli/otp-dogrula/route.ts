import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone, otpCode } = await req.json();

    if (!phone || !otpCode) {
      return NextResponse.json(
        { error: "Telefon ve kod zorunludur." },
        { status: 400 }
      );
    }

    const parent = await prisma.parent.findUnique({ where: { phone } });
    if (!parent) {
      return NextResponse.json(
        { error: "Veli bulunamadı." },
        { status: 404 }
      );
    }

    if (parent.phoneVerified) {
      return NextResponse.json({ message: "Telefon zaten doğrulanmış." });
    }

    if (!parent.otpCode || parent.otpCode !== otpCode) {
      return NextResponse.json({ error: "Kod hatalı." }, { status: 400 });
    }

    if (!parent.otpExpiry || parent.otpExpiry < new Date()) {
      return NextResponse.json(
        { error: "Kodun süresi dolmuş. Yeni kod isteyin." },
        { status: 400 }
      );
    }

    await prisma.parent.update({
      where: { id: parent.id },
      data: { phoneVerified: true, otpCode: null, otpExpiry: null },
    });

    const token = signToken({ id: parent.id, userType: "PARENT" });

    return NextResponse.json({
      token,
      parent: { id: parent.id, phone: parent.phone, studentId: parent.studentId },
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
