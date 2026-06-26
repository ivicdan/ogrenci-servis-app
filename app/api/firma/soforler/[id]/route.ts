import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { trUpperCase } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const driver = await prisma.driver.findFirst({
    where: { id, firmId: user.id },
    select: {
      id: true,
      driverCode: true,
      firstName: true,
      lastName: true,
      phone: true,
      tcId: true,
      plateNumber: true,
      assistantName: true,
      status: true,
      createdAt: true,
      _count: { select: { students: true, routes: true } },
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          school: true,
          class: true,
          studyTime: true,
          parent: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
      routes: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  if (!driver) return NextResponse.json({ error: "Şoför bulunamadı." }, { status: 404 });

  return NextResponse.json(driver);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { firstName, lastName, phone, plateNumber, assistantName, status } =
    await req.json();

  const driver = await prisma.driver.findFirst({
    where: { id, firmId: user.id },
  });
  if (!driver)
    return NextResponse.json({ error: "Şoför bulunamadı." }, { status: 404 });

  const updated = await prisma.driver.update({
    where: { id },
    data: {
      firstName: firstName ? trUpperCase(firstName) : firstName,
      lastName: lastName ? trUpperCase(lastName) : lastName,
      phone,
      plateNumber,
      assistantName: assistantName ? trUpperCase(assistantName) : assistantName,
      status,
    },
  });

  return NextResponse.json(updated);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const driver = await prisma.driver.findFirst({ where: { id, firmId: user.id } });
  if (!driver) return NextResponse.json({ error: "Şoför bulunamadı." }, { status: 404 });

  const plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  await prisma.driver.update({ where: { id }, data: { password: hashedPassword } });

  return NextResponse.json({ plainPassword });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  await prisma.driver.update({
    where: { id, firmId: user.id },
    data: { status: "INACTIVE" },
  });

  return NextResponse.json({ message: "Şoför pasife alındı." });
}
