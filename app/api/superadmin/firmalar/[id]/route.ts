import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function requireAdmin(req: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${ADMIN_SECRET}`;
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
