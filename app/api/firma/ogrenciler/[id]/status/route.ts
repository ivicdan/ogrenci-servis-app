import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findFirst({ where: { id, firmId: user.id } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  const newStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  await prisma.student.update({
    where: { id },
    data: { status: newStatus },
  });

  return NextResponse.json({ status: newStatus });
}
