import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { token } = await req.json().catch(() => ({}));
  if (!token || !String(token).startsWith("ExponentPushToken[")) {
    return NextResponse.json({ error: "Geçersiz token." }, { status: 400 });
  }

  await prisma.parent.update({ where: { id: user.id }, data: { expoPushToken: token } });
  return NextResponse.json({ message: "Token kaydedildi." });
}

export async function DELETE(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  await prisma.parent.update({ where: { id: user.id }, data: { expoPushToken: null } });
  return NextResponse.json({ message: "Token silindi." });
}
