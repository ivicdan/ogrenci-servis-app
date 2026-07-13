import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const reason: string = body.reason ?? "";

  const payment = await prisma.payment.findFirst({
    where: { id, firmId: user.id, status: "SUBMITTED" },
    include: {
      student: { include: { parent: { select: { id: true } } } },
    },
  });

  if (!payment) {
    return NextResponse.json(
      { error: "Ödeme bulunamadı veya zaten işleme alındı." },
      { status: 404 }
    );
  }

  await prisma.payment.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  // Veliye bildirim gönder
  if (payment.student.parent) {
    const body = reason
      ? `${payment.amount} TL tutarındaki ödemeniz firma tarafından reddedildi. Neden: ${reason}`
      : `${payment.amount} TL tutarındaki ödemeniz firma tarafından reddedildi. Lütfen firmayla iletişime geçin.`;

    await createNotification({
      parentId: payment.student.parent.id,
      title: "Ödeme Reddedildi",
      body,
    });
  }

  return NextResponse.json({ message: "Ödeme reddedildi." });
}
