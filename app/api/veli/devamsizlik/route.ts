import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { emitAbsenceNotification } from "@/lib/socket-emitter";

const TYPE_LABELS: Record<string, string> = {
  PICKUP: "servisle okula gitmeyecek",
  DROPOFF: "servisle eve dönmeyecek",
  BOTH: "servisi kullanmayacak",
};

function fmt(d: Date) {
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

function parseRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null;
  return { start, end };
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { type, startDate, endDate, studentId } = await req.json();

  if (!type || !["PICKUP", "DROPOFF", "BOTH"].includes(type)) {
    return NextResponse.json({ error: "Geçersiz devamsızlık türü." }, { status: 400 });
  }
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Başlangıç ve bitiş tarihi zorunludur." }, { status: 400 });
  }

  const range = parseRange(startDate, endDate);
  if (!range) return NextResponse.json({ error: "Geçersiz tarih aralığı." }, { status: 400 });
  const { start, end } = range;

  const student = await prisma.student.findFirst({
    where: {
      parentId: user.id,
      status: "ACTIVE",
      ...(studentId ? { id: studentId } : {}),
    },
    include: { driver: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!student) {
    return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  }

  if (!student.driver) {
    return NextResponse.json({ error: "Öğrenciye henüz şoför atanmamış." }, { status: 400 });
  }

  await (prisma as any).absenceReport.create({
    data: {
      studentId: student.id,
      parentId: user.id,
      startDate: start,
      endDate: end,
      type,
    },
  });

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

  const isSameDay = fmt(start) === fmt(end);
  const dateStr = isSameDay ? fmt(start) : `${fmt(start)} - ${fmt(end)}`;

  await createNotification({
    driverId: student.driver.id,
    title: "Devamsızlık Bildirimi",
    body: `${student.firstName} ${student.lastName} ${dateStr} tarihinde ${TYPE_LABELS[type]}.`,
  });

  return NextResponse.json({ message: "Devamsızlık bildirimi gönderildi." }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const reports = await (prisma as any).absenceReport.findMany({
    where: { parentId: user.id },
    orderBy: { startDate: "desc" },
    take: 10,
    include: { student: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json(reports);
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id, type, startDate, endDate } = await req.json();

  if (!id) return NextResponse.json({ error: "Bildirim kimliği zorunludur." }, { status: 400 });
  if (!type || !["PICKUP", "DROPOFF", "BOTH"].includes(type)) {
    return NextResponse.json({ error: "Geçersiz devamsızlık türü." }, { status: 400 });
  }
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Başlangıç ve bitiş tarihi zorunludur." }, { status: 400 });
  }

  const range = parseRange(startDate, endDate);
  if (!range) return NextResponse.json({ error: "Geçersiz tarih aralığı." }, { status: 400 });
  const { start, end } = range;

  const existing = await (prisma as any).absenceReport.findFirst({
    where: { id, parentId: user.id },
    include: {
      student: { include: { driver: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });
  if (!existing) return NextResponse.json({ error: "Bildirim bulunamadı." }, { status: 404 });

  await (prisma as any).absenceReport.update({
    where: { id },
    data: { type, startDate: start, endDate: end },
  });

  if (existing.student.driver) {
    const isSameDay = fmt(start) === fmt(end);
    const dateStr = isSameDay ? fmt(start) : `${fmt(start)} - ${fmt(end)}`;
    await createNotification({
      driverId: existing.student.driver.id,
      title: "Devamsızlık Bildirimi Güncellendi",
      body: `${existing.student.firstName} ${existing.student.lastName} için devamsızlık bildirimi güncellendi: ${dateStr} tarihinde ${TYPE_LABELS[type]}.`,
    });

    const today = new Date();
    if (today >= start && today <= end) {
      const types = type === "BOTH" ? ["PICKUP", "DROPOFF"] : [type];
      for (const t of types) {
        emitAbsenceNotification({
          studentId: existing.studentId,
          driverId: existing.student.driver.id,
          type: t,
        });
      }
    }
  }

  return NextResponse.json({ message: "Devamsızlık bildirimi güncellendi." });
}

export async function DELETE(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Bildirim kimliği zorunludur." }, { status: 400 });

  const existing = await (prisma as any).absenceReport.findFirst({
    where: { id, parentId: user.id },
    include: {
      student: { include: { driver: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });
  if (!existing) return NextResponse.json({ error: "Bildirim bulunamadı." }, { status: 404 });

  await (prisma as any).absenceReport.delete({ where: { id } });

  if (existing.student.driver) {
    await createNotification({
      driverId: existing.student.driver.id,
      title: "Devamsızlık Bildirimi İptal Edildi",
      body: `${existing.student.firstName} ${existing.student.lastName} için yapılan devamsızlık bildirimi veli tarafından iptal edildi.`,
    });
  }

  return NextResponse.json({ message: "Devamsızlık bildirimi silindi." });
}
