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

  const payment = await prisma.payment.findFirst({
    where: { id, firmId: user.id, status: "SUBMITTED" },
    include: {
      student: { include: { parent: { select: { id: true } } } },
    },
  });

  if (!payment) {
    return NextResponse.json(
      { error: "Ödeme bulunamadı veya zaten onaylandı." },
      { status: 404 }
    );
  }

  await prisma.payment.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  // Veliye bildirim gönder
  if (payment.student.parent) {
    await createNotification({
      parentId: payment.student.parent.id,
      title: "Ödeme Onaylandı",
      body: `${payment.amount} TL tutarındaki ödemeniz firma tarafından onaylandı.`,
    });
  }

  return NextResponse.json({ message: "Ödeme onaylandı." });
}
