import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { firmCode, studentTcId, phone, password } = await req.json();

    if (!firmCode || !studentTcId || !phone || !password) {
      return NextResponse.json(
        { error: "Firma Kodu, öğrenci TC, telefon ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const firm = await prisma.firm.findUnique({ where: { firmCode } });
    if (!firm) {
      return NextResponse.json(
        { error: "Geçersiz Firma Kodu. Lütfen servis firmanızdan doğru kodu alın." },
        { status: 404 }
      );
    }
    if (firm.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Bu firma henüz aktif değil." },
        { status: 403 }
      );
    }

    const existingStudent = await prisma.student.findFirst({
      where: { tcId: studentTcId, status: "ACTIVE" },
      include: { firm: { select: { firmCode: true } } },
    });

    if (existingStudent && existingStudent.firmId !== firm.id) {
      return NextResponse.json(
        { error: `Bu TC kimlik numarası başka bir firmada (${existingStudent.firm.firmCode}) aktif öğrenci olarak kayıtlı.` },
        { status: 409 }
      );
    }

    const existingParent = await prisma.parent.findUnique({ where: { phone } });
    if (existingParent) {
      return NextResponse.json(
        { error: "Bu telefon numarası zaten kayıtlı." },
        { status: 409 }
      );
    }

    let student = existingStudent;
    if (!student) {
      student = await prisma.student.create({
        data: {
          tcId: studentTcId,
          firmId: firm.id,
          firstName: "",
          lastName: "",
          birthDate: new Date(),
          school: "",
          class: "",
          studyTime: "MORNING",
        },
        include: { firm: { select: { firmCode: true } } },
      });
    }

    // Bu öğrenciye ait veli kaydı zaten varsa engelle
    const studentParent = await prisma.parent.findUnique({
      where: { studentId: student.id },
    });
    if (studentParent) {
      return NextResponse.json(
        { error: "Bu öğrenciye ait bir veli kaydı zaten mevcut. Giriş yapmayı deneyin." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const parent = await prisma.parent.create({
      data: {
        studentId: student.id,
        firstName: "",
        lastName: "",
        phone,
        password: hashed,
        address: "",
        phoneVerified: true,
        kvkkAccepted: true,
        kvkkAcceptedAt: new Date(),
      },
    });

    const token = signToken({ id: parent.id, userType: "PARENT" });

    return NextResponse.json({ token, studentId: student.id }, { status: 201 });
  } catch (e) {
    console.error("[veli/kayit]", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
