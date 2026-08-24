import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

function requireAdmin(req: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) return false;
  const auth = req.headers.get("authorization");
  const provided = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  const expected = createHmac("sha256", ADMIN_SECRET).update("superadmin-session").digest("hex");
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { newPassword } = await req.json();

  if (!newPassword || newPassword.length < 6 || newPassword.length > 128) {
    return NextResponse.json({ error: "Şifre 6-128 karakter arasında olmalıdır." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.firm.update({
    where: { id },
    data: { password: hashed, sessionToken: null },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const allowed = ["ACTIVE", "SUSPENDED", "PRE_REGISTERED", "PENDING_APPROVAL"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  const firm = await prisma.firm.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json(firm);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  if (permanent) {
    // Kalıcı silme — ilişkili tüm kayıtları sırayla sil
    await prisma.messageRecipient.deleteMany({ where: { message: { firmId: id } } });
    await prisma.message.deleteMany({ where: { firmId: id } });
    await prisma.notification.deleteMany({ where: { firm: { id } } });
    await prisma.pushSubscription.deleteMany({ where: { firm: { id } } });
    await prisma.attendance.deleteMany({ where: { student: { firmId: id } } });
    await prisma.absenceReport.deleteMany({ where: { student: { firmId: id } } });
    await prisma.payment.deleteMany({ where: { student: { firmId: id } } });
    await prisma.expense.deleteMany({ where: { firmId: id } });
    await prisma.manualIncome.deleteMany({ where: { firmId: id } });
    await prisma.vehicle.deleteMany({ where: { firmId: id } });
    await prisma.stop.deleteMany({ where: { route: { firmId: id } } });
    await prisma.route.deleteMany({ where: { firmId: id } });
    await prisma.student.deleteMany({ where: { firmId: id } });
    await prisma.driver.deleteMany({ where: { firmId: id } });
    await prisma.firm.delete({ where: { id } });
    return NextResponse.json({ success: true, permanent: true });
  }

  // Soft delete — gerçek silme yerine deletedAt damgası
  await prisma.firm.update({
    where: { id },
    data: { deletedAt: new Date(), sessionToken: null },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  if (action === "restore") {
    await prisma.firm.update({
      where: { id },
      data: { deletedAt: null },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
