import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ count: 0 });

  const count = await prisma.notification.count({
    where: { firmId: user.id, read: false },
  });

  return NextResponse.json({ count });
}
