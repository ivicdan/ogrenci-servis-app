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
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const [pending, active, suspended, preReg, deleted, conflict] = await Promise.all([
    prisma.firm.count({ where: { status: "PENDING_APPROVAL", deletedAt: null } }),
    prisma.firm.count({ where: { status: "ACTIVE",           deletedAt: null } }),
    prisma.firm.count({ where: { status: "SUSPENDED",        deletedAt: null } }),
    prisma.firm.count({ where: { status: "PRE_REGISTERED",   deletedAt: null } }),
    prisma.firm.count({ where: { deletedAt: { not: null } } }),
    // Silinenler arasında çakışma uyarısı olan (son 30 gün)
    prisma.firm.count({
      where: {
        deletedAt: { not: null },
        lastConflictAt: { not: null },
      },
    }),
  ]);

  return NextResponse.json({
    PENDING_APPROVAL: pending,
    ACTIVE:           active,
    SUSPENDED:        suspended,
    PRE_REGISTERED:   preReg,
    DELETED:          deleted,
    CONFLICT:         conflict,
  });
}
