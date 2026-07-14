import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// 31 gibi değerler daha kısa aylarda taşma yapmasın diye ayın son gününe sabitlenir
function clampedDueDate(year: number, month: number, day: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") || null;

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: { paymentDay: true },
  });

  if (!parent?.paymentDay) return NextResponse.json({ overdue: false });

  const today = new Date();
  const dueDate = clampedDueDate(today.getFullYear(), today.getMonth(), parent.paymentDay);
  const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 5) return NextResponse.json({ overdue: false });

  const student = await prisma.student.findFirst({
    where: { parentId: user.id, status: "ACTIVE", ...(studentId ? { id: studentId } : {}) },
    select: {
      payments: {
        where: { createdAt: { gte: dueDate } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!student) return NextResponse.json({ overdue: false });

  const latest = student.payments[0] ?? null;
  // Onaylanmış ya da inceleme bekleyen (SUBMITTED) bir ödeme varsa uyarı durur;
  // reddedilirse ya da hiç bildirim yoksa firma onaylayana kadar uyarı devam eder
  const overdue = !latest || latest.status === "REJECTED";

  return NextResponse.json({ overdue, daysLate: overdue ? diffDays : 0 });
}
