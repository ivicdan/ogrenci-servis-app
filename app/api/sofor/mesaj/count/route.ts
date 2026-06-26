import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const unread = await prisma.messageRecipient.findMany({
    where: { userId: user.id, userType: "DRIVER", read: false },
    include: { message: { select: { title: true, body: true } } },
    orderBy: { message: { createdAt: "desc" } },
    take: 1,
  });

  const count = await prisma.messageRecipient.count({
    where: { userId: user.id, userType: "DRIVER", read: false },
  });

  return NextResponse.json({
    count,
    latestTitle: unread[0]?.message.title ?? "",
    latestBody: unread[0]?.message.body ?? "",
  });
}
