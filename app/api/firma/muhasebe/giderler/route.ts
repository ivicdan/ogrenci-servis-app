import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

  const from = month
    ? new Date(year, month - 1, 1)
    : new Date(year, 0, 1);
  const to = month
    ? new Date(year, month, 1)
    : new Date(year + 1, 0, 1);

  const expenses = await prisma.expense.findMany({
    where: {
      firmId: user.id,
      date: { gte: from, lt: to },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { date, amount, description, payee, category, note } = body;

  if (!date || !amount || !description || !payee) {
    return NextResponse.json({ error: "Tarih, miktar, açıklama ve alıcı zorunludur." }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Geçersiz miktar." }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      firmId: user.id,
      date: new Date(date),
      amount: parsedAmount,
      description,
      payee,
      category: category || "Diğer",
      note: note || null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
