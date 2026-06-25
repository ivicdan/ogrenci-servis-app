import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

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
  if (!title || !body) return NextResponse.json({ error: "Başlık ve içerik zorunludur." }, { status: 400 });

  const firm = await prisma.firm.findUnique({ where: { id: user.id } });
  if (!firm) return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });

  let recipients: { userId: string; userType: string }[] = [];

  // Şoförler
  if (target === "all" || target === "drivers") {
    const drivers = await prisma.driver.findMany({
      where: { firmId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    recipients.push(...drivers.map((d) => ({ userId: d.id, userType: "DRIVER" })));
  }

  // Veliler — okul türüne göre filtreli ya da tümü
  const schoolTypeTargets: Record<string, string> = {
    parents_anaokulu: "ANAOKULU",
    parents_ilkokul: "İLKOKUL",
    parents_ortaokul: "ORTAOKUL",
    parents_lise: "LİSE",
  };

  if (target === "all" || target === "parents") {
    const parents = await prisma.parent.findMany({
      where: { student: { firmId: user.id, status: "ACTIVE" }, phoneVerified: true },
      select: { id: true },
    });
    recipients.push(...parents.map((p) => ({ userId: p.id, userType: "PARENT" })));
  } else if (schoolTypeTargets[target]) {
    const parents = await prisma.parent.findMany({
      where: {
        student: { firmId: user.id, status: "ACTIVE", schoolType: schoolTypeTargets[target] },
        phoneVerified: true,
      },
      select: { id: true },
    });
    recipients.push(...parents.map((p) => ({ userId: p.id, userType: "PARENT" })));
  }

  if (Array.isArray(target)) {
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
        create: recipients.map((r) => ({ userId: r.userId, userType: r.userType })),
      },
    },
  });

  // Bildirim oluşturulmaz — mesajlar ayrı "Mesajlar" sekmesinde gösterilir

  return NextResponse.json(message, { status: 201 });
}
