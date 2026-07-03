import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(ipKey(req, "veli-kayit"), 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çok fazla kayıt denemesi. ${rl.retryAfter} saniye bekleyin.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { firmCode, studentTcId, phone, password } = await req.json();

    if (!firmCode || !studentTcId || !phone || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    const phoneDigits = phone.replace(/[\s\-]/g, "");
    if (!/^\d{11}$/.test(phoneDigits) || phoneDigits[0] !== "0") {
      return NextResponse.json({ error: "Telefon 11 haneli ve 0 ile başlamalıdır." }, { status: 400 });
    }
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: "Şifre 6-128 karakter arasında olmalıdır." }, { status: 400 });
    }
    if (!/^\d{11}$/.test(studentTcId)) {
      return NextResponse.json({ error: "Öğrenci TC kimlik no 11 rakam olmalıdır." }, { status: 400 });
    }

    const firm = await prisma.firm.findUnique({ where: { firmCode } });
    if (!firm) {
      return NextResponse.json(
        { error: "Geçersiz Firma Kodu. Lütfen servis firmanızdan doğru kodu alın." },
        { status: 404 }
      );
    }
    if (firm.status !== "ACTIVE") {
      return NextResponse.json({ error: "Bu firma henüz aktif değil." }, { status: 403 });
    }

    const existingStudent = await prisma.student.findFirst({
      where: { tcId: studentTcId, firmId: firm.id, status: "ACTIVE" },
    });

    if (existingStudent?.parentId) {
      return NextResponse.json(
        { error: "Bu öğrenciye ait bir veli kaydı zaten mevcut. Giriş yapmayı deneyin." },
        { status: 409 }
      );
    }

    const existingParent = await prisma.parent.findUnique({ where: { phone: phoneDigits } });
    if (existingParent) {
      return NextResponse.json({ error: "Bu telefon numarası zaten kayıtlı." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const sessionToken = randomUUID();

    const result = await prisma.$transaction(async (tx) => {
      const parent = await tx.parent.create({
        data: {
          firstName: "",
          lastName: "",
          phone: phoneDigits,
          password: hashed,
          address: "",
          phoneVerified: true,
          kvkkAccepted: true,
          kvkkAcceptedAt: new Date(),
          sessionToken,
        },
      });

      let studentId: string;
      if (existingStudent) {
        await tx.student.update({ where: { id: existingStudent.id }, data: { parentId: parent.id } });
        studentId = existingStudent.id;
      } else {
        const newStudent = await tx.student.create({
          data: {
            tcId: studentTcId,
            firmId: firm.id,
            parentId: parent.id,
            firstName: "",
            lastName: "",
            birthDate: new Date(),
            school: "",
            class: "",
            studyTime: "MORNING",
          },
        });
        studentId = newStudent.id;
      }

      return { parentId: parent.id, studentId };
    });

    const token = signToken({ id: result.parentId, userType: "PARENT", sessionToken });
    return NextResponse.json({ token, studentId: result.studentId }, { status: 201 });
  } catch (e) {
    console.error("[veli/kayit]", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
