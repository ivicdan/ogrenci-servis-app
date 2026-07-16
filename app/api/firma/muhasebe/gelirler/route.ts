import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

  const from = month
    ? new Date(year, month - 1, 1)
    : new Date(year, 0, 1);
  const to = month
    ? new Date(year, month, 1)
    : new Date(year + 1, 0, 1);

  const payments = await prisma.payment.findMany({
    where: {
      firmId: user.id,
      status: "APPROVED",
      paidDate: { gte: from, lt: to },
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          parent: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
    },
    orderBy: { paidDate: "desc" },
  });

  return NextResponse.json(payments);
}
