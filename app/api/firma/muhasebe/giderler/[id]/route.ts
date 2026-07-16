import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { date, amount, description, payee, category, note } = body;

  const expense = await prisma.expense.findFirst({ where: { id, firmId: user.id } });
  if (!expense) return NextResponse.json({ error: "Gider bulunamadı." }, { status: 404 });

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      ...(amount ? { amount: parseFloat(amount) } : {}),
      ...(description ? { description } : {}),
      ...(payee ? { payee } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const expense = await prisma.expense.findFirst({ where: { id, firmId: user.id } });
  if (!expense) return NextResponse.json({ error: "Gider bulunamadı." }, { status: 404 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ message: "Gider silindi." });
}
