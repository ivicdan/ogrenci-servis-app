import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: { firmId: user.id },
    include: {
      _count: { select: { recipients: true } },
      recipients: { select: { read: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = messages.map((m) => ({
    ...m,
    readCount: m.recipients.filter((r) => r.read).length,
    recipients: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { title, body, target } = await req.json();
  // target: "all" | "drivers" | "parents" | string[] (user IDs)

  if (!title || !body) {
    return NextResponse.json(
      { error: "Başlık ve içerik zorunludur." },
      { status: 400 }
    );
  }

  const firm = await prisma.firm.findUnique({ where: { id: user.id } });
  if (!firm) return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });

  let recipients: { userId: string; userType: string }[] = [];

  if (target === "all" || target === "drivers") {
    const drivers = await prisma.driver.findMany({
      where: { firmId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    recipients.push(...drivers.map((d: { id: string }) => ({ userId: d.id, userType: "DRIVER" })));
  }

  if (target === "all" || target === "parents") {
    const parents = await prisma.parent.findMany({
      where: {
        student: { firmId: user.id, status: "ACTIVE" },
        phoneVerified: true,
      },
      select: { id: true },
    });
    recipients.push(...parents.map((p: { id: string }) => ({ userId: p.id, userType: "PARENT" })));
  }

  if (Array.isArray(target)) {
    // Belirli kişi listesi — userType:id formatında
    recipients = target.map((t: string) => {
      const [userType, userId] = t.split(":");
      return { userId, userType };
    });
  }

  const message = await prisma.message.create({
    data: {
      firmId: user.id,
      title,
      body,
      recipients: {
        create: recipients.map((r) => ({
          userId: r.userId,
          userType: r.userType,
        })),
      },
    },
  });

  // Bildirimleri gönder
  for (const r of recipients) {
    await createNotification({
      [r.userType === "DRIVER" ? "driverId" : "parentId"]: r.userId,
      title,
      body,
    });
  }

  return NextResponse.json(message, { status: 201 });
}
