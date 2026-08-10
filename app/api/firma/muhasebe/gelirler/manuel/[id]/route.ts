import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { date, amount, description, source, category, note } = body;

  const item = await prisma.manualIncome.findFirst({ where: { id, firmId: user.id } });
  if (!item) return NextResponse.json({ error: "Gelir bulunamadı." }, { status: 404 });

  const updated = await prisma.manualIncome.update({
    where: { id },
    data: {
      ...(date        ? { date: new Date(date) }          : {}),
      ...(amount      ? { amount: parseFloat(amount) }    : {}),
      ...(description ? { description }                   : {}),
      ...(source      ? { source }                        : {}),
      ...(category !== undefined ? { category }           : {}),
      ...(note !== undefined     ? { note: note || null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const item = await prisma.manualIncome.findFirst({ where: { id, firmId: user.id } });
  if (!item) return NextResponse.json({ error: "Gelir bulunamadı." }, { status: 404 });

  await prisma.manualIncome.delete({ where: { id } });
  return NextResponse.json({ message: "Gelir silindi." });
}
