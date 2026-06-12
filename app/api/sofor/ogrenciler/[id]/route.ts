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

  const student = await prisma.student.findFirst({
    where: { id, driverId: user.id, status: "ACTIVE" },
    include: {
      parent: {
        select: {
          firstName: true, lastName: true, phone: true,
          address: true, profession: true,
          spouseName: true, spousePhone: true, spouseProfession: true,
        },
      },
    },
  });

  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  return NextResponse.json(student);
}
