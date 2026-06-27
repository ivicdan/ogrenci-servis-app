import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

function requireAdmin(req: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) return false;
  const auth = req.headers.get("authorization");
  const provided = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  const expected = createHmac("sha256", ADMIN_SECRET).update("superadmin-session").digest("hex");
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { newPassword } = await req.json();

  if (!newPassword || newPassword.length < 6 || newPassword.length > 128) {
    return NextResponse.json({ error: "Şifre 6-128 karakter arasında olmalıdır." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.firm.update({
    where: { id },
    data: { password: hashed, sessionToken: null },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const allowed = ["ACTIVE", "SUSPENDED", "PRE_REGISTERED", "PENDING_APPROVAL"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  const firm = await prisma.firm.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json(firm);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  await prisma.firm.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
