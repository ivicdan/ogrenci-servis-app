import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
  }
  if (newPassword.length < 6 || newPassword.length > 128) {
    return NextResponse.json({ error: "Yeni şifre 6-128 karakter arasında olmalıdır." }, { status: 400 });
  }

  const driver = await prisma.driver.findUnique({ where: { id: user.id }, select: { password: true } });
  if (!driver) return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });

  const valid = await bcrypt.compare(oldPassword, driver.password);
  if (!valid) return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.driver.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ message: "Şifre güncellendi." });
}
