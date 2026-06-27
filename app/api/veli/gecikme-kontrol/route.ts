import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

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

  const student = await prisma.student.findFirst({
    where: { parentId: user.id, status: "ACTIVE", ...(studentId ? { id: studentId } : {}) },
    select: {
      payments: {
        where: {
          status: "APPROVED",
          createdAt: { gte: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
        },
        take: 1,
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!student) return NextResponse.json({ overdue: false });

  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), parent.paymentDay);
  const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  const overdue = diffDays >= 5 && student.payments.length === 0;

  return NextResponse.json({ overdue, daysLate: overdue ? diffDays : 0 });
}
