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
              status: "NOTIFIED_ABSENT",
              date: { gte: todayStart, lt: todayEnd },
            },
          },
        },
      },
    },
  });

  if (!route) return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });

  // Bugün "okula gitmeyecek" veya "servisle gitmeyecek" bildirimi yapan velileri çıkar
  const eligibleStudents = route.students.filter((s) => s.attendances.length === 0);

  const parentIds = eligibleStudents
    .map((s) => s.parent?.id)
    .filter(Boolean) as string[];

  if (parentIds.length > 0) {
    await prisma.notification.createMany({
      data: parentIds.map((parentId) => ({
        parentId,
        title: "Sefer Tamamlandı",
        body: `${route.name} seferi tamamlandı. Çocuğunuz okula güvenli bir şekilde ulaşmıştır.`,
      })),
    });
  }

  return NextResponse.json({ ok: true, notified: parentIds.length });
}
