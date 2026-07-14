import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { notifyMessageRecipients } from "@/lib/message-push";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const box = searchParams.get("box");

  if (box === "sent") {
    const sent = await prisma.message.findMany({
      where: { driverId: user.id },
      include: { recipients: { select: { read: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      sent.map((m) => ({
        id: m.id,
        title: m.title,
        body: m.body,
        createdAt: m.createdAt,
        recipientCount: m.recipients.length,
        readCount: m.recipients.filter((r) => r.read).length,
      }))
    );
  }

  const recipients = await prisma.messageRecipient.findMany({
    where: { userId: user.id, userType: "DRIVER" },
    include: {
      message: { select: { id: true, title: true, body: true, createdAt: true, driverId: true } },
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

  const driver = await prisma.driver.findUnique({ where: { id: user.id }, select: { firmId: true } });
  if (!driver) return NextResponse.json({ error: "Şoför bulunamadı." }, { status: 404 });

  const schoolTypeMap: Record<string, string> = {
    anaokulu: "ANAOKULU", ilkokul: "İLKOKUL", ortaokul: "ORTAOKUL", lise: "LİSE",
  };

  const students = await prisma.student.findMany({
    where: {
      driverId: user.id,
      status: "ACTIVE",
      ...(schoolType && schoolType !== "all" ? { schoolType: schoolTypeMap[schoolType] ?? schoolType } : {}),
    },
    select: { parent: { select: { id: true } } },
  });

  const parentIds = students.filter(s => s.parent?.id).map(s => s.parent!.id);
  if (parentIds.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  await prisma.message.create({
    data: {
      firmId: driver.firmId,
      driverId: user.id,
      title,
      body,
      recipients: {
        create: parentIds.map(parentId => ({ userId: parentId, userType: "PARENT" })),
      },
    },
  });

  await notifyMessageRecipients(
    parentIds.map(id => ({ userId: id, userType: "PARENT" })),
    title,
    body
  );

  return NextResponse.json({ ok: true, notified: parentIds.length });
}
