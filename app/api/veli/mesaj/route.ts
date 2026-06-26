import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const recipients = await prisma.messageRecipient.findMany({
    where: { userId: user.id, userType: "PARENT" },
    include: {
      message: {
        select: {
          id: true, title: true, body: true, createdAt: true, driverId: true,
          driver: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { message: { createdAt: "desc" } },
  });

  return NextResponse.json(
    recipients.map((r) => ({
      id: r.id,
      title: r.message.title,
      body: r.message.body,
      createdAt: r.message.createdAt,
      read: r.read,
      senderType: r.message.driverId ? "DRIVER" : "FIRM",
      driverName: r.message.driver
        ? `${r.message.driver.firstName} ${r.message.driver.lastName}`
        : null,
    }))
  );
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  await prisma.messageRecipient.updateMany({
    where: { userId: user.id, userType: "PARENT", read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
