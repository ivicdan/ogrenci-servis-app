import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateUniqueDriverCode } from "@/lib/id-generator";
import { trUpperCase } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const drivers = await prisma.driver.findMany({
    where: { firmId: user.id, status: "ACTIVE" },
    select: {
      id: true,
      driverCode: true,
      firstName: true,
      lastName: true,
      phone: true,
      plateNumber: true,
      assistantName: true,
      assistantPhone: true,
      status: true,
      createdAt: true,
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { firstName, lastName, phone, tcId, plateNumber, assistantName, assistantPhone } =
    await req.json();

  if (!firstName || !lastName || !phone || !tcId) {
    return NextResponse.json(
      { error: "Ad, soyad, telefon ve TC zorunludur." },
      { status: 400 }
    );
  }

  // Başka firmada aktif şoför kontrolü
  const existing = await prisma.driver.findFirst({
    where: {
      tcId,
      status: "ACTIVE",
      firmId: { not: user.id },
    },
    include: { firm: { select: { firmCode: true } } },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: `Bu TC kimlik numarası başka bir firmada (${existing.firm.firmCode}) aktif şoför olarak kayıtlı.`,
      },
      { status: 409 }
    );
  }

  const driverCode = await generateUniqueDriverCode(
    async (code) =>
      !!(await prisma.driver.findUnique({ where: { driverCode: code } }))
  );

  // 6 haneli rastgele şifre üret
  const plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const driver = await prisma.driver.create({
    data: {
      driverCode,
      firstName: trUpperCase(firstName),
      lastName: trUpperCase(lastName),
      phone,
      tcId,
      plateNumber,
      assistantName: assistantName ? trUpperCase(assistantName) : assistantName,
      assistantPhone: assistantPhone || null,
      firmId: user.id,
      password: hashedPassword,
    },
    select: {
      id: true,
      driverCode: true,
      firstName: true,
      lastName: true,
      phone: true,
      plateNumber: true,
      assistantName: true,
      assistantPhone: true,
      status: true,
    },
  });

  return NextResponse.json({ ...driver, plainPassword }, { status: 201 });
}
