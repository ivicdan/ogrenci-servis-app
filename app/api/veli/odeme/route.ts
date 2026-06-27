import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") || null;

  const student = await prisma.student.findFirst({
    where: { parentId: user.id, status: "ACTIVE", ...(studentId ? { id: studentId } : {}) },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  const payments = await prisma.payment.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { amount, paidDate, method, studentId } = await req.json();

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

  const student = await prisma.student.findFirst({
    where: { parentId: user.id, status: "ACTIVE", ...(studentId ? { id: studentId } : {}) },
    select: { id: true, firmId: true },
    orderBy: { createdAt: "asc" },
  });

  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      studentId: student.id,
      firmId: student.firmId,
      amount: parsedAmount,
      dueDate: new Date(paidDate),
      paidDate: new Date(paidDate),
      method,
      status: "SUBMITTED",
    },
  });

  await createNotification({
    firmId: student.firmId,
    title: "Ödeme Bildirimi",
    body: `${parsedAmount.toLocaleString("tr-TR")} TL tutarında ödeme bildirimi alındı. Onay bekliyor.`,
  });

  return NextResponse.json(payment, { status: 201 });
}
