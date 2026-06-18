import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { emitAbsenceNotification } from "@/lib/socket-emitter";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { type, startDate, endDate } = await req.json();

  if (!type || !["PICKUP", "DROPOFF", "BOTH"].includes(type)) {
    return NextResponse.json({ error: "Geçersiz devamsızlık türü." }, { status: 400 });
  }
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Başlangıç ve bitiş tarihi zorunludur." }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return NextResponse.json({ error: "Geçersiz tarih aralığı." }, { status: 400 });
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
    return NextResponse.json({ error: "Öğrenciye henüz şoför atanmamış." }, { status: 400 });
  }

  // Tarih aralığı devamsızlık kaydı oluştur
  await (prisma as any).absenceReport.create({
    data: {
      studentId: student.id,
      parentId: parent.id,
      startDate: start,
      endDate: end,
      type,
    },
  });

  // Eğer bugün aralık içindeyse aynı zamanda anlık bildirim gönder
  const today = new Date();
  if (today >= start && today <= end) {
    const types = type === "BOTH" ? ["PICKUP", "DROPOFF"] : [type];
    for (const t of types) {
      emitAbsenceNotification({
        studentId: student.id,
        driverId: student.driver.id,
        type: t,
      });
    }
  }

  const fmt = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;

  const isSameDay = fmt(start) === fmt(end);
  const dateStr = isSameDay ? fmt(start) : `${fmt(start)} - ${fmt(end)}`;

  const typeLabels: Record<string, string> = {
    PICKUP: "servisle okula gitmeyecek",
    DROPOFF: "servisle eve dönmeyecek",
    BOTH: "servisi kullanmayacak",
  };

  await createNotification({
    driverId: student.driver.id,
    title: "Devamsızlık Bildirimi",
    body: `${student.firstName} ${student.lastName} ${dateStr} tarihinde ${typeLabels[type]}.`,
  });

  return NextResponse.json({ message: "Devamsızlık bildirimi gönderildi." }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: { studentId: true },
  });
  if (!parent) return NextResponse.json({ error: "Veli bulunamadı." }, { status: 404 });

  const reports = await (prisma as any).absenceReport.findMany({
    where: { parentId: user.id },
    orderBy: { startDate: "desc" },
    take: 10,
  });

  return NextResponse.json(reports);
}
