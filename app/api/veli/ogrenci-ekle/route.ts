import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  try {
    const { firmCode, studentTcId } = await req.json();

    if (!firmCode || !studentTcId) {
      return NextResponse.json({ error: "Firma kodu ve öğrenci TC zorunludur." }, { status: 400 });
    }

    if (!/^\d{11}$/.test(studentTcId)) {
      return NextResponse.json({ error: "Öğrenci TC kimlik no 11 rakam olmalıdır." }, { status: 400 });
    }

    const parent = await prisma.parent.findUnique({ where: { id: user.id } });
    if (!parent) return NextResponse.json({ error: "Veli bulunamadı." }, { status: 404 });

    // Aynı veliye ait öğrenciler farklı firmalara ait olabilir
    const firm = await prisma.firm.findUnique({ where: { firmCode } });
    if (!firm) {
      return NextResponse.json({ error: "Geçersiz Firma Kodu." }, { status: 404 });
    }
    if (firm.status !== "ACTIVE") {
      return NextResponse.json({ error: "Bu firma henüz aktif değil." }, { status: 403 });
    }

    const existingStudent = await prisma.student.findFirst({
      where: { tcId: studentTcId, firmId: firm.id, status: "ACTIVE" },
    });

    if (existingStudent) {
      if (existingStudent.parentId === user.id) {
        return NextResponse.json({ error: "Bu öğrenci zaten hesabınıza kayıtlı." }, { status: 409 });
      }
      if (existingStudent.parentId) {
        return NextResponse.json({ error: "Bu öğrenci başka bir veliye kayıtlı." }, { status: 409 });
      }
      // Öğrenci bulundu, bu veliye bağla
      await prisma.student.update({
        where: { id: existingStudent.id },
        data: { parentId: user.id },
      });
      return NextResponse.json({ message: "Öğrenci hesabınıza eklendi.", studentId: existingStudent.id }, { status: 201 });
    }

    // Öğrenci bu firmada yoksa oluştur
    const newStudent = await prisma.student.create({
      data: {
        tcId: studentTcId,
        firmId: firm.id,
        parentId: user.id,
        firstName: "",
        lastName: "",
        birthDate: new Date(),
        school: "",
        class: "",
        studyTime: "MORNING",
      },
    });

    return NextResponse.json({ message: "Öğrenci hesabınıza eklendi.", studentId: newStudent.id }, { status: 201 });
  } catch (e) {
    console.error("[veli/ogrenci-ekle]", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
