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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const route = await prisma.route.findFirst({
    where: { id, driverId: user.id },
    include: {
      students: {
        where: { status: "ACTIVE" },
        include: {
          parent: { select: { id: true } },
          attendances: {
            where: {
              type: "PICKUP",
              status: "PICKED_UP",
              date: { gte: todayStart, lt: todayEnd },
            },
          },
        },
      },
    },
  });

  if (!route) return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });

  // Only students who were actually picked up today
  const pickedUpStudents = route.students.filter((s) => s.attendances.length > 0);

  if (pickedUpStudents.length > 0) {
    // Check which students already have a DROPOFF record today (avoid duplicates)
    const existingDropoffs = await prisma.attendance.findMany({
      where: {
        studentId: { in: pickedUpStudents.map((s) => s.id) },
        type: "DROPOFF",
        date: { gte: todayStart, lt: todayEnd },
      },
      select: { studentId: true },
    });
    const alreadyDroppedOff = new Set(existingDropoffs.map((a) => a.studentId));

    // Create DROPOFF PICKED_UP for students not yet dropped off
    const toDropOff = pickedUpStudents.filter((s) => !alreadyDroppedOff.has(s.id));
    if (toDropOff.length > 0) {
      await prisma.attendance.createMany({
        data: toDropOff.map((s) => ({
          studentId: s.id,
          driverId: user.id,
          date: new Date(),
          type: "DROPOFF",
          status: "PICKED_UP",
        })),
      });
    }

    // Notify parents of all picked-up students
    const parentIds = pickedUpStudents
      .map((s) => s.parent?.id)
      .filter(Boolean) as string[];

    if (parentIds.length > 0) {
      await prisma.notification.createMany({
        data: parentIds.map((parentId) => ({
          parentId,
          title: "Sefer Tamamlandı",
          body: "Çocuğunuz okula güvenli bir şekilde ulaşmıştır.",
        })),
      });
    }
  }

  return NextResponse.json({ ok: true, notified: pickedUpStudents.length });
}
