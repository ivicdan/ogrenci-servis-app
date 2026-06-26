import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findFirst({
    where: { id, firmId: user.id },
    include: { parent: { select: { id: true } } },
  });

  if (!student || !student.parent) {
    return NextResponse.json({ error: "Veli bulunamadı." }, { status: 404 });
  }

  const plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await prisma.parent.update({
    where: { id: student.parent.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ plainPassword });
}
