import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const route = await prisma.route.findFirst({ where: { id, driverId: user.id } });
  if (!route) return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });

  await prisma.route.update({
    where: { id },
    data: { tripStartedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const route = await prisma.route.findFirst({ where: { id, driverId: user.id } });
  if (!route) return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const isDropoff = route.type.includes("DROPOFF");

  // Delete today's attendance records for route students
  await prisma.attendance.deleteMany({
    where: {
      driverId: user.id,
      date: { gte: todayStart, lt: todayEnd },
      student: isDropoff ? { dropoffRouteId: id } : { routeId: id },
    },
  });

  await prisma.route.update({
    where: { id },
    data: { tripStartedAt: null },
  });

  return NextResponse.json({ ok: true });
}
