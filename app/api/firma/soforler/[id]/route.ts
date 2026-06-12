import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

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
    data: { firstName, lastName, phone, plateNumber, assistantName, status },
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
  await prisma.driver.update({
    where: { id, firmId: user.id },
    data: { status: "INACTIVE" },
  });

  return NextResponse.json({ message: "Şoför pasife alındı." });
}
