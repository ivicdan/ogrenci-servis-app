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
    orderBy: { dueDate: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { paymentId, paidDate, method } = await req.json();

  if (!paymentId || !paidDate || !method) {
    return NextResponse.json(
      { error: "Ödeme ID, tarih ve yöntem zorunludur." },
      { status: 400 }
    );
  }

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: { studentId: true, student: { select: { firmId: true } } },
  });

  if (!parent) return NextResponse.json({ error: "Veli bulunamadı." }, { status: 404 });

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, studentId: parent.studentId, status: "PENDING" },
  });

  if (!payment) {
    return NextResponse.json(
      { error: "Ödeme bulunamadı veya zaten bildirilmiş." },
      { status: 404 }
    );
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { paidDate: new Date(paidDate), method, status: "SUBMITTED" },
  });

  // Firmaya bildirim gönder
  await createNotification({
    firmId: parent.student.firmId,
    title: "Ödeme Bildirimi",
    body: `${payment.amount} TL tutarında ödeme bildirimi alındı. Onay bekliyor.`,
  });

  return NextResponse.json({ message: "Ödeme bildirimi gönderildi. Firma onayı bekleniyor." });
}
