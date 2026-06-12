import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { studentTcId, password } = await req.json();

    if (!studentTcId || !password) {
      return NextResponse.json(
        { error: "Öğrenci TC kimlik no ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: { tcId: studentTcId, status: "ACTIVE" },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Bu TC kimlik numarasına ait aktif öğrenci bulunamadı." },
        { status: 404 }
      );
    }

    const parent = await prisma.parent.findUnique({
      where: { studentId: student.id },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, firmId: true },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Bu öğrenciye ait veli kaydı bulunamadı. Önce kayıt olun." },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(password, parent.password);
    if (!valid) {
      return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
    }

    const token = signToken({ id: parent.id, userType: "PARENT" });

    return NextResponse.json({
      token,
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        student: parent.student,
      },
    });
  } catch (e) {
    console.error("[veli/giris]", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
