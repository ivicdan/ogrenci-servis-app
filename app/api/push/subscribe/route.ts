import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["FIRM", "DRIVER", "PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Geçersiz abonelik." }, { status: 400 });
  }

  const userType =
    user.type === "FIRM" ? "FIRM" : user.type === "DRIVER" ? "DRIVER" : "PARENT";

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userType, userId: user.id },
    update: { p256dh: keys.p256dh, auth: keys.auth, userType, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  if (endpoint) {
    await prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
