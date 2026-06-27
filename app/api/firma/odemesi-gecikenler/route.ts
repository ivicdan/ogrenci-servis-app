import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const today = new Date();
  const cutoff = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

  // Ödeme günü belirlenmiş, bu firmaya ait aktif öğrencisi olan veliler
  const parents = await prisma.parent.findMany({
    where: {
      paymentDay: { not: null },
      students: { some: { firmId: user.id, status: "ACTIVE" } },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      paymentDay: true,
      students: {
        where: { firmId: user.id, status: "ACTIVE" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          school: true,
          class: true,
          payments: {
            where: { status: "APPROVED", createdAt: { gte: cutoff } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  const overdue = parents
    .flatMap((p) =>
      p.students.map((student) => ({ p, student }))
    )
    .filter(({ p, student }) => {
      const payDay = p.paymentDay!;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), payDay);
      const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 5 && student.payments.length === 0;
    })
    .map(({ p, student }) => {
      const payDay = p.paymentDay!;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), payDay);
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        parentId: p.id,
        parentName: `${p.firstName} ${p.lastName}`,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        paymentDay: payDay,
        daysLate,
      };
    });

  return NextResponse.json(overdue);
}
