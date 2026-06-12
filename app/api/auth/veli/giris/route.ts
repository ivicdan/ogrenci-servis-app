import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Telefon ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const parent = await prisma.parent.findUnique({
      where: { phone },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firmId: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    if (!parent.phoneVerified) {
      return NextResponse.json(
        { error: "Telefon numaranız henüz doğrulanmamış." },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, parent.password);
    if (!valid) {
      return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
    }

    const token = signToken({ id: parent.id, userType: "PARENT" });

    return NextResponse.json({
      token,
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        student: parent.student,
      },
    });
  } catch (e) {
    console.error("[veli/giris]", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
