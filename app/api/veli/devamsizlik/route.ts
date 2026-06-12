import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { emitAbsenceNotification } from "@/lib/socket-emitter";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { type } = await req.json();
  // type: "PICKUP" (sabah servise binmeyecek) | "DROPOFF" (öğleden dönmeyecek)

  if (!type || !["PICKUP", "DROPOFF"].includes(type)) {
    return NextResponse.json({ error: "Geçersiz devamsızlık türü." }, { status: 400 });
  }

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    include: {
      student: {
        include: { driver: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });

  if (!parent?.student) {
    return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  }

  const { student } = parent;

  if (!student.driver) {
    return NextResponse.json(
      { error: "Öğrenciye henüz şoför atanmamış." },
      { status: 400 }
    );
  }

  const attendance = await prisma.attendance.create({
    data: {
      studentId: student.id,
      driverId: student.driver.id,
      type: type as "PICKUP" | "DROPOFF",
      status: "NOTIFIED_ABSENT",
      notifiedAt: new Date(),
    },
  });

  const typeLabel = type === "PICKUP" ? "sabah servise binmeyecek" : "öğleden dönmeyecek";

  await createNotification({
    driverId: student.driver.id,
    title: "Devamsızlık Bildirimi",
    body: `${parent.firstName} ${parent.lastName}'ın çocuğu ${student.firstName} bugün ${typeLabel}.`,
  });

  emitAbsenceNotification({
    studentId: student.id,
    driverId: student.driver.id,
    type,
  });

  return NextResponse.json(attendance, { status: 201 });
}
