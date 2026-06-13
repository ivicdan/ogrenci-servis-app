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

  const route = await prisma.route.findFirst({
    where: { id, driverId: user.id },
    include: {
      students: {
        where: { status: "ACTIVE" },
        include: { parent: { select: { id: true } } },
      },
    },
  });

  if (!route) return NextResponse.json({ error: "Güzergah bulunamadı." }, { status: 404 });

  const parentIds = route.students
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
