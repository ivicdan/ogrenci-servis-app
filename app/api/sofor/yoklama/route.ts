import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { emitAttendance } from "@/lib/socket-emitter";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { studentId, type, status } = await req.json();
  // type: "PICKUP" | "DROPOFF"
  // status: "PICKED_UP" | "ABSENT"

  if (!studentId || !type || !status) {
    return NextResponse.json(
      { error: "Öğrenci ID, tür ve durum zorunludur." },
      { status: 400 }
    );
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, driverId: user.id },
    include: { parent: { select: { id: true, firstName: true } } },
  });

  if (!student) {
    return NextResponse.json(
      { error: "Öğrenci bulunamadı veya bu şoföre ait değil." },
      { status: 404 }
    );
  }

  const attendance = await prisma.attendance.create({
    data: {
      studentId,
      driverId: user.id,
      type,
      status,
      notifiedAt: status === "PICKED_UP" ? new Date() : null,
    },
  });

  // Veliye bildirim gönder
  if (student.parent) {
    const message =
      type === "PICKUP"
        ? status === "PICKED_UP"
          ? `${student.firstName} servise alındı.`
          : `${student.firstName} servise binemedi (devamsız).`
        : status === "PICKED_UP"
        ? `${student.firstName} okula bırakıldı.`
        : `${student.firstName} okula bırakılamadı.`;

    await createNotification({
      parentId: student.parent.id,
      title: "Servis Bildirimi",
      body: message,
    });

    emitAttendance({
      studentId,
      driverId: user.id,
      parentId: student.parent.id,
      status,
      type,
    });
  }

  return NextResponse.json(attendance, { status: 201 });
}
