import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function requireAdmin(req: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${ADMIN_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const firms = await prisma.firm.findMany({
    where: status ? { status: status as never } : undefined,
    select: {
      id: true,
      firmCode: true,
      taxOrTcId: true,
      phone: true,
      name: true,
      address: true,
      status: true,
      createdAt: true,
      documents: true,
      _count: { select: { drivers: true, students: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(firms);
}
