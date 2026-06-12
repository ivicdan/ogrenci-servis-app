import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: { studentId: true },
  });

  if (!parent) return NextResponse.json({ error: "Veli bulunamadı." }, { status: 404 });

  const payments = await prisma.payment.findMany({
    where: { studentId: parent.studentId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { amount, paidDate, method } = await req.json();

  if (!amount || !paidDate || !method) {
    return NextResponse.json(
      { error: "Tutar, tarih ve yöntem zorunludur." },
      { status: 400 }
    );
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Geçerli bir tutar girin." }, { status: 400 });
  }

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: { studentId: true, student: { select: { firmId: true } } },
  });

  if (!parent) return NextResponse.json({ error: "Veli bulunamadı." }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      studentId: parent.studentId,
      firmId: parent.student.firmId,
      amount: parsedAmount,
      dueDate: new Date(paidDate),
      paidDate: new Date(paidDate),
      method,
      status: "SUBMITTED",
    },
  });

  await createNotification({
    firmId: parent.student.firmId,
    title: "Ödeme Bildirimi",
    body: `${parsedAmount.toLocaleString("tr-TR")} TL tutarında ödeme bildirimi alındı. Onay bekliyor.`,
  });

  return NextResponse.json(payment, { status: 201 });
}
