import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { driverCode, password } = await req.json();

    if (!driverCode || !password) {
      return NextResponse.json(
        { error: "Şoför ID ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { driverCode },
      include: { firm: { select: { firmCode: true, name: true } } },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Şoför bulunamadı. ID hatalı." },
        { status: 404 }
      );
    }

    if (driver.status === "INACTIVE") {
      return NextResponse.json(
        { error: "Bu hesap pasif durumdadır. Firmanızla iletişime geçin." },
        { status: 403 }
      );
    }

    if (!driver.password) {
      return NextResponse.json(
        { error: "Şifre tanımlanmamış. Firmanızla iletişime geçin." },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, driver.password);
    if (!valid) {
      return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
    }

    const sessionToken = randomUUID();
    await prisma.driver.update({ where: { id: driver.id }, data: { sessionToken } });
    const token = signToken({ id: driver.id, userType: "DRIVER", sessionToken });

    return NextResponse.json({
      token,
      driver: {
        id: driver.id,
        driverCode: driver.driverCode,
        firstName: driver.firstName,
        lastName: driver.lastName,
        firm: driver.firm,
      },
    });
  } catch (e) {
    console.error("[sofor/giris]", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
