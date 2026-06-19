import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ count: 0 });

  const [count, latest] = await Promise.all([
    prisma.notification.count({ where: { driverId: user.id, read: false } }),
    prisma.notification.findFirst({
      where: { driverId: user.id, read: false },
      orderBy: { createdAt: "desc" },
      select: { title: true, body: true },
    }),
  ]);

  return NextResponse.json({ count, latestTitle: latest?.title ?? "", latestBody: latest?.body ?? "" });
}
