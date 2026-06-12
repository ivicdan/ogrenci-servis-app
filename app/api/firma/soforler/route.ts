import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateUniqueDriverCode } from "@/lib/id-generator";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const drivers = await prisma.driver.findMany({
    where: { firmId: user.id },
    select: {
      id: true,
      driverCode: true,
      firstName: true,
      lastName: true,
      phone: true,
      plateNumber: true,
      assistantName: true,
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

  const { firstName, lastName, phone, tcId, plateNumber, assistantName } =
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

  const driver = await prisma.driver.create({
    data: {
      driverCode,
      firstName,
      lastName,
      phone,
      tcId,
      plateNumber,
      assistantName,
      firmId: user.id,
      password: "",
    },
    select: {
      id: true,
      driverCode: true,
      firstName: true,
      lastName: true,
      phone: true,
      plateNumber: true,
      assistantName: true,
      status: true,
    },
  });

  return NextResponse.json(driver, { status: 201 });
}
