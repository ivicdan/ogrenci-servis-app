import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== "TEMIZLE_2026") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  await prisma.messageRecipient.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.firm.deleteMany();

  return NextResponse.json({ message: "Tüm veriler silindi." });
}
