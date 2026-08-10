import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const vehicles = await prisma.vehicle.findMany({
    where: { firmId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { plate, brand, model, year, insuranceCompany, insuranceStart, insuranceEnd, nextInspectionDate, notes } = body;

  if (!plate) return NextResponse.json({ error: "Plaka zorunludur." }, { status: 400 });

  const vehicle = await prisma.vehicle.create({
    data: {
      firmId: user.id,
      plate: plate.toUpperCase().replace(/\s/g, ""),
      brand:               brand              || null,
      model:               model              || null,
      year:                year               ? parseInt(year) : null,
      insuranceCompany:    insuranceCompany   || null,
      insuranceStart:      insuranceStart     ? new Date(insuranceStart)     : null,
      insuranceEnd:        insuranceEnd       ? new Date(insuranceEnd)       : null,
      nextInspectionDate:  nextInspectionDate ? new Date(nextInspectionDate) : null,
      notes:               notes              || null,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
