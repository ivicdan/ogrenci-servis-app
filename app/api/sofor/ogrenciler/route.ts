import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const students = await prisma.student.findMany({
    where: { driverId: user.id, status: "ACTIVE" },
    include: {
      parent: {
        select: {
          firstName: true, lastName: true, phone: true,
          address: true, spouseFirstName: true, spouseLastName: true, spousePhone: true,
        },
      },
    },
    orderBy: [{ firstName: "asc" }],
  });

  return NextResponse.json(students);
}
