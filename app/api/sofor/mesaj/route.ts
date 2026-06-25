import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const recipients = await prisma.messageRecipient.findMany({
    where: { userId: user.id, userType: "DRIVER" },
    include: {
      message: { select: { id: true, title: true, body: true, createdAt: true } },
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
    }))
  );
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  await prisma.messageRecipient.updateMany({
    where: { userId: user.id, userType: "DRIVER", read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { title, body, schoolType } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "Başlık ve mesaj zorunludur." }, { status: 400 });

  const schoolTypeMap: Record<string, string> = {
    anaokulu: "ANAOKULU",
    ilkokul: "İLKOKUL",
    ortaokul: "ORTAOKUL",
    lise: "LİSE",
  };

  const students = await prisma.student.findMany({
    where: {
      driverId: user.id,
      status: "ACTIVE",
      ...(schoolType && schoolType !== "all" ? { schoolType: schoolTypeMap[schoolType] ?? schoolType } : {}),
    },
    select: { parent: { select: { id: true } } },
  });

  let notified = 0;
  for (const s of students) {
    if (s.parent?.id) {
      await createNotification({ parentId: s.parent.id, title, body });
      notified++;
    }
  }

  return NextResponse.json({ ok: true, notified });
}
