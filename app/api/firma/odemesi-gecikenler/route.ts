import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const today = new Date();
  const cutoff = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

  const parents = await prisma.parent.findMany({
    where: {
      paymentDay: { not: null },
      student: { firmId: user.id, status: "ACTIVE" },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      paymentDay: true,
      student: {
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
    .filter((p) => {
      const payDay = p.paymentDay!;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), payDay);
      const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 5 && p.student.payments.length === 0;
    })
    .map((p) => {
      const payDay = p.paymentDay!;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), payDay);
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        parentId: p.id,
        parentName: `${p.firstName} ${p.lastName}`,
        studentId: p.student.id,
        studentName: `${p.student.firstName} ${p.student.lastName}`,
        paymentDay: payDay,
        daysLate,
      };
    });

  return NextResponse.json(overdue);
}
