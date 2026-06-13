import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const route = await prisma.route.findFirst({
    where: { id, driverId: user.id },
    include: {
      students: {
        where: { status: "ACTIVE" },
        orderBy: { routeOrder: "asc" },
        include: {
          parent: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              spouseFirstName: true,
              spouseLastName: true,
              spousePhone: true,
            },
          },
          attendances: {
            where: {
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!route) {
    return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(route);
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

  // Şu an bu güzergahta olan öğrencileri kaldır
  await prisma.student.updateMany({
    where: { routeId: id, driverId: user.id },
    data: { routeId: null, routeOrder: 0 },
  });

  // Seçilen öğrencileri güzergaha sırasıyla ekle
  for (const s of students) {
    await prisma.student.updateMany({
      where: { id: s.id, driverId: user.id, status: "ACTIVE" },
      data: { routeId: id, routeOrder: s.order },
    });
  }

  return NextResponse.json({ ok: true });
}
