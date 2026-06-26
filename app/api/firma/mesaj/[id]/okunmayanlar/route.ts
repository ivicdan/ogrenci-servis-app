import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const message = await prisma.message.findUnique({
    where: { id: params.id },
    select: { firmId: true },
  });
  if (!message || message.firmId !== user.id)
    return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });

  const unread = await prisma.messageRecipient.findMany({
    where: { messageId: params.id, read: false },
    select: { userId: true, userType: true },
  });

  // İsimleri çek
  const parentIds = unread.filter((r) => r.userType === "PARENT").map((r) => r.userId);
  const driverIds = unread.filter((r) => r.userType === "DRIVER").map((r) => r.userId);

  const [parents, drivers] = await Promise.all([
    prisma.parent.findMany({
      where: { id: { in: parentIds } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    }),
    prisma.driver.findMany({
      where: { id: { in: driverIds } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    }),
  ]);

  return NextResponse.json({
    parents: parents.map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, phone: p.phone, type: "Veli" })),
    drivers: drivers.map((d) => ({ id: d.id, name: `${d.firstName} ${d.lastName}`, phone: d.phone, type: "Şoför" })),
  });
}
