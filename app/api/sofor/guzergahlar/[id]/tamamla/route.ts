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
  });
  if (!route) return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });

  const isDropoff = route.type.includes("DROPOFF");

  if (isDropoff) {
    // Eve Dönüş: students who boarded from school (DROPOFF PICKED_UP)
    const routeWithStudents = await prisma.route.findFirst({
      where: { id, driverId: user.id },
      include: {
        dropoffStudents: {
          where: { status: "ACTIVE" },
          include: {
            parent: { select: { id: true } },
            attendances: {
              where: { type: "DROPOFF", status: "PICKED_UP", date: { gte: todayStart, lt: todayEnd } },
            },
          },
        },
      },
    });

    const boardedStudents = routeWithStudents?.dropoffStudents.filter((s) => s.attendances.length > 0) ?? [];

    if (boardedStudents.length > 0) {
      const parentIds = boardedStudents.map((s) => s.parent?.id).filter(Boolean) as string[];
      if (parentIds.length > 0) {
        await prisma.notification.createMany({
          data: parentIds.map((parentId) => ({
            parentId,
            title: "Sefer Tamamlandı",
            body: "Çocuğunuz eve güvenli bir şekilde ulaşmıştır.",
          })),
        });
      }
    }

    await prisma.route.update({ where: { id }, data: { tripStartedAt: null } });
    return NextResponse.json({ ok: true, notified: boardedStudents.length });
  }

  // Okula Gidiş: create DROPOFF PICKED_UP for all PICKUP PICKED_UP students
  const routeWithStudents = await prisma.route.findFirst({
    where: { id, driverId: user.id },
    include: {
      students: {
        where: { status: "ACTIVE" },
        include: {
          parent: { select: { id: true } },
          attendances: {
            where: { type: "PICKUP", status: "PICKED_UP", date: { gte: todayStart, lt: todayEnd } },
          },
        },
      },
    },
  });

  const pickedUpStudents = routeWithStudents?.students.filter((s) => s.attendances.length > 0) ?? [];

  if (pickedUpStudents.length > 0) {
    // Not: "Okula Gidiş" (PICKUP) tamamlanması "Eve Dönüş" (DROPOFF) yoklamasını
    // otomatik oluşturmaz — bu iki liste birbirinden bağımsızdır.
    const parentIds = pickedUpStudents.map((s) => s.parent?.id).filter(Boolean) as string[];
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

  await prisma.route.update({ where: { id }, data: { tripStartedAt: null } });
  return NextResponse.json({ ok: true, notified: pickedUpStudents.length });
}
