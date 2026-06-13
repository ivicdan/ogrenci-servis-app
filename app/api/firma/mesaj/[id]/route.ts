import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const message = await prisma.message.findFirst({ where: { id, firmId: user.id } });
  if (!message) return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });

  await prisma.messageRecipient.deleteMany({ where: { messageId: id } });
  await prisma.message.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
