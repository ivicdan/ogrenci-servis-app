import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const vehicle = await prisma.vehicle.findFirst({ where: { id, firmId: user.id } });
  if (!vehicle) return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });

  const { plate, brand, model, year, insuranceCompany, insuranceStart, insuranceEnd, nextInspectionDate, notes } = body;

  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      ...(plate              ? { plate: plate.toUpperCase().replace(/\s/g, "") } : {}),
      ...(brand !== undefined              ? { brand:              brand              || null } : {}),
      ...(model !== undefined              ? { model:              model              || null } : {}),
      ...(year  !== undefined              ? { year:               year ? parseInt(year) : null } : {}),
      ...(insuranceCompany !== undefined   ? { insuranceCompany:   insuranceCompany   || null } : {}),
      ...(insuranceStart   !== undefined   ? { insuranceStart:     insuranceStart   ? new Date(insuranceStart)   : null } : {}),
      ...(insuranceEnd     !== undefined   ? { insuranceEnd:       insuranceEnd     ? new Date(insuranceEnd)     : null } : {}),
      ...(nextInspectionDate !== undefined ? { nextInspectionDate: nextInspectionDate ? new Date(nextInspectionDate) : null } : {}),
      ...(notes !== undefined              ? { notes:              notes              || null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, firmId: user.id } });
  if (!vehicle) return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });

  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ message: "Araç silindi." });
}
