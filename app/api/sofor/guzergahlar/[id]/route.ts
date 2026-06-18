import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const studentIncludes = {
  parent: {
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      spouseFirstName: true,
      spouseLastName: true,
      spousePhone: true,
      pickupLat: true,
      pickupLng: true,
    },
  },
  attendances: true,
  absenceReports: true,
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const today = new Date();
  const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

  const studentWhere = { status: "ACTIVE" as const };
  const attendancesWhere = { where: { date: { gte: todayStart, lt: todayEnd } }, orderBy: { createdAt: "desc" as const } };
  const absenceWhere = { where: { startDate: { lte: todayEnd }, endDate: { gte: todayStart } } };

  const routeRaw = await prisma.route.findFirst({
    where: { id, driverId: user.id },
    include: {
      students: {
        where: studentWhere,
        orderBy: { routeOrder: "asc" },
        include: {
          parent: { select: studentIncludes.parent.select },
          attendances: attendancesWhere,
          absenceReports: absenceWhere,
        },
      },
      dropoffStudents: {
        where: studentWhere,
        orderBy: { dropoffRouteOrder: "asc" },
        include: {
          parent: { select: studentIncludes.parent.select },
          attendances: attendancesWhere,
          absenceReports: absenceWhere,
        },
      },
    },
  });

  if (!routeRaw) {
    return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });
  }

  const isDropoff = routeRaw.type.includes("DROPOFF");
  const { students: pickupStudents, dropoffStudents, ...rest } = routeRaw;
  const students = isDropoff ? dropoffStudents : pickupStudents;

  return NextResponse.json({ ...rest, students });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { students } = await req.json() as { students: { id: string; order: number }[] };

  const route = await prisma.route.findFirst({ where: { id, driverId: user.id } });
  if (!route) return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });

  const isDropoff = route.type.includes("DROPOFF");

  if (isDropoff) {
    // Clear current dropoff route students
    await prisma.student.updateMany({
      where: { dropoffRouteId: id, driverId: user.id },
      data: { dropoffRouteId: null, dropoffRouteOrder: 0 },
    });
    for (const s of students) {
      await prisma.student.updateMany({
        where: { id: s.id, driverId: user.id, status: "ACTIVE" },
        data: { dropoffRouteId: id, dropoffRouteOrder: s.order },
      });
    }
  } else {
    // Clear current pickup route students
    await prisma.student.updateMany({
      where: { routeId: id, driverId: user.id },
      data: { routeId: null, routeOrder: 0 },
    });
    for (const s of students) {
      await prisma.student.updateMany({
        where: { id: s.id, driverId: user.id, status: "ACTIVE" },
        data: { routeId: id, routeOrder: s.order },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
