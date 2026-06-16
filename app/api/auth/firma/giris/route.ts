import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { taxOrTcId, password } = await req.json();

    if (!taxOrTcId || !password) {
      return NextResponse.json(
        { error: "Vergi/TC No ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const firm = await prisma.firm.findUnique({ where: { taxOrTcId } });
    if (!firm) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(password, firm.password);
    if (!valid) {
      return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
    }

    const sessionToken = randomUUID();
    await prisma.firm.update({ where: { id: firm.id }, data: { sessionToken } });
    const token = signToken({ id: firm.id, userType: "FIRM", sessionToken });

    return NextResponse.json({
      token,
      firm: {
        id: firm.id,
        firmCode: firm.firmCode,
        name: firm.name,
        status: firm.status,
      },
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
