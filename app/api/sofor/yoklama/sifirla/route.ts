import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { studentId, type } = await req.json();

  const student = await prisma.student.findFirst({
    where: { id: studentId, driverId: user.id },
  });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  await prisma.attendance.deleteMany({
    where: {
      studentId,
      driverId: user.id,
      type,
      date: { gte: todayStart, lt: todayEnd },
    },
  });

  return NextResponse.json({ ok: true });
}
