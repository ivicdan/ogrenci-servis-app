import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let where: any = { firmId: user.id };

  if (status === "OVERDUE") {
    where = {
      firmId: user.id,
      status: "PENDING",
      dueDate: { lt: new Date() },
    };
  } else if (status) {
    where = {
      firmId: user.id,
      status: status as "PENDING" | "SUBMITTED" | "APPROVED",
    };
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          parent: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}
