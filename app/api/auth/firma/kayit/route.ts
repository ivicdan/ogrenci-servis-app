import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import {
  generateUniqueFirmCode,
} from "@/lib/id-generator";

export async function POST(req: NextRequest) {
  try {
    const { taxOrTcId, phone, password } = await req.json();

    if (!taxOrTcId || !phone || !password) {
      return NextResponse.json(
        { error: "Vergi/TC No, telefon ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const existing = await prisma.firm.findFirst({
      where: { OR: [{ taxOrTcId }, { phone }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu vergi/TC numarası veya telefon zaten kayıtlı." },
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
        phone,
        password: hashed,
        status: "PRE_REGISTERED",
      },
    });

    const token = signToken({ id: firm.id, userType: "FIRM" });

    return NextResponse.json(
      {
        token,
        firm: {
          id: firm.id,
          firmCode: firm.firmCode,
          status: firm.status,
          phone: firm.phone,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
