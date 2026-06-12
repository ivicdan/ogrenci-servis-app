import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get("driverId");
  const search = searchParams.get("search");

  const students = await prisma.student.findMany({
    where: {
      firmId: user.id,
      ...(driverId ? { driverId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { tcId: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
          plateNumber: true,
        },
      },
      parent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          spouseName: true,
          spousePhone: true,
          address: true,
          paymentDay: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}
