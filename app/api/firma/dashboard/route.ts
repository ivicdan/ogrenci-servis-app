import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const [driverCount, studentCount, pendingPayments, unreadNotifs] =
    await Promise.all([
      prisma.driver.count({ where: { firmId: user.id, status: "ACTIVE" } }),
      prisma.student.count({ where: { firmId: user.id, status: "ACTIVE" } }),
      prisma.payment.count({
        where: { firmId: user.id, status: "SUBMITTED" },
      }),
      prisma.notification.count({
        where: { firmId: user.id, read: false },
      }),
    ]);

  return NextResponse.json({
    driverCount,
    studentCount,
    pendingPayments,
    unreadNotifs,
  });
}
