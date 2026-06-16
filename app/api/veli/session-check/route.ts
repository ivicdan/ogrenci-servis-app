import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req, ["PARENT"]);
  if (!payload) return NextResponse.json({ valid: false });

  const parent = await prisma.parent.findUnique({
    where: { id: payload.id },
    select: { sessionToken: true },
  });

  if (!parent || parent.sessionToken !== payload.sessionToken) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true });
}
