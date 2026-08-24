import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";
import { prisma } from "@/lib/db";

function requireAdmin(req: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) return false;
  const auth = req.headers.get("authorization");
  const provided = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  const expected = createHmac("sha256", ADMIN_SECRET).update("superadmin-session").digest("hex");
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  // "deleted" özel filtresi — deletedAt dolu olanlar
  const where = status === "DELETED"
    ? { deletedAt: { not: null } }
    : { deletedAt: null, ...(status ? { status: status as never } : {}) };

  const firms = await prisma.firm.findMany({
    where,
    select: {
      id: true,
      firmCode: true,
      taxOrTcId: true,
      phone: true,
      name: true,
      address: true,
      status: true,
      createdAt: true,
      deletedAt: true,
      documents: true,
      _count: { select: { drivers: true, students: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(firms);
}
