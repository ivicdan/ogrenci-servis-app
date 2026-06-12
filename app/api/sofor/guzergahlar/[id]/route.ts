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
            take: 1,
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
