import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req, ["FIRM"]);
  if (!payload) return NextResponse.json({ valid: false });

  const firm = await prisma.firm.findUnique({
    where: { id: payload.id },
    select: { sessionToken: true },
  });

  if (!firm || firm.sessionToken !== payload.sessionToken) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true });
}
