import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findFirst({
    where: { id, firmId: user.id },
    include: {
      driver: {
        select: { id: true, firstName: true, lastName: true, driverCode: true, plateNumber: true },
      },
      parent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          profession: true,
          spouseFirstName: true,
          spouseLastName: true,
          spousePhone: true,
          spouseProfession: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, amount: true, paidDate: true, status: true, method: true },
      },
    },
  });

  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  return NextResponse.json(student);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { driverId } = await req.json();

  const student = await prisma.student.findFirst({ where: { id, firmId: user.id } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  if (driverId) {
    const driver = await prisma.driver.findFirst({ where: { id: driverId, firmId: user.id } });
    if (!driver) return NextResponse.json({ error: "Şoför bulunamadı." }, { status: 404 });
  }

  const updated = await prisma.student.update({
    where: { id },
    data: { driverId: driverId || null },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findFirst({ where: { id, firmId: user.id } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  await prisma.student.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  return NextResponse.json({ message: "Öğrenci pasife alındı." });
}
