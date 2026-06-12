import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { driverCode, tcId, password } = await req.json();

    if (!driverCode || !tcId || !password) {
      return NextResponse.json(
        { error: "Şoför ID, TC kimlik ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { driverCode, tcId },
      include: { firm: { select: { firmCode: true, name: true } } },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Şoför bulunamadı. ID veya TC hatalı." },
        { status: 404 }
      );
    }

    if (driver.status === "INACTIVE") {
      return NextResponse.json(
        { error: "Bu hesap pasif durumdadır." },
        { status: 403 }
      );
    }

    // İlk girişte şifre belirleniyor
    let token: string;
    if (!driver.password) {
      const hashed = await bcrypt.hash(password, 10);
      await prisma.driver.update({
        where: { id: driver.id },
        data: { password: hashed },
      });
      token = signToken({ id: driver.id, userType: "DRIVER" });
    } else {
      const valid = await bcrypt.compare(password, driver.password);
      if (!valid) {
        return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
      }
      token = signToken({ id: driver.id, userType: "DRIVER" });
    }

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
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
