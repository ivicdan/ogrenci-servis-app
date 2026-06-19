import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// One-time cleanup endpoint — DELETE THIS FILE AFTER USE
const SECRET = process.env.CLEANUP_SECRET ?? "temizle-2026";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    // Deletion order matters due to FK constraints
    const [att, abs, notif, msgRecip, msg, pay, parent, stop, route, driver] = await Promise.all([
      prisma.attendance.deleteMany({}),
      (prisma as any).absenceReport.deleteMany({}),
      prisma.notification.deleteMany({ where: { OR: [{ driverId: { not: null } }, { parentId: { not: null } }] } }),
    ]);

    await (prisma as any).messageRecipient?.deleteMany({});
    await (prisma as any).message?.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.parent.deleteMany({});

    // Clear student route/driver references before deleting
    await prisma.student.updateMany({
      data: { routeId: null, routeOrder: 0, dropoffRouteId: null, dropoffRouteOrder: 0, driverId: null },
    });
    await prisma.student.deleteMany({});

    // Delete route stops then routes
    await (prisma as any).stop?.deleteMany({});
    await prisma.route.deleteMany({});

    // Delete drivers
    await prisma.driver.deleteMany({});

    return NextResponse.json({
      ok: true,
      message: "Şoförler, veliler, öğrenciler ve ilgili veriler temizlendi. Firma hesapları korundu.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Hata" }, { status: 500 });
  }
}
