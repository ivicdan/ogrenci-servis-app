import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const GENERIC_ERROR = "Giriş kodu veya şifre hatalı.";
const DUMMY_HASH = "$2a$10$dummyhashfortimingattackpreventiononlyxxxxxxxxxxxxxxxx";

export async function POST(req: NextRequest) {
  const rl = rateLimit(ipKey(req, "sofor-giris"), 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çok fazla deneme. ${rl.retryAfter} saniye bekleyin.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { driverCode, password } = await req.json();

    if (!driverCode || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({
      where: { driverCode },
      include: { firm: { select: { firmCode: true, name: true } } },
    });

    const valid = driver?.password
      ? await bcrypt.compare(password, driver.password)
      : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

    if (!driver || !valid) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (driver.status === "INACTIVE") {
      return NextResponse.json(
        { error: "Bu hesap pasif durumdadır. Firmanızla iletişime geçin." },
        { status: 403 }
      );
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
