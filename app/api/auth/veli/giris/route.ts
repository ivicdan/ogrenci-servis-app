import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const GENERIC_ERROR = "TC kimlik no veya şifre hatalı.";
const DUMMY_HASH = "$2a$10$dummyhashfortimingattackpreventiononlyxxxxxxxxxxxxxxxx";

export async function POST(req: NextRequest) {
  const rl = rateLimit(ipKey(req, "veli-giris"), 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çok fazla deneme. ${rl.retryAfter} saniye bekleyin.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { studentTcId, password } = await req.json();

    if (!studentTcId || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { tcId: studentTcId, status: "ACTIVE" },
    });

    const parent = student
      ? await prisma.parent.findUnique({
          where: { studentId: student.id },
          include: {
            student: { select: { id: true, firstName: true, lastName: true, firmId: true } },
          },
        })
      : null;

    const valid = parent
      ? await bcrypt.compare(password, parent.password)
      : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

    if (!student || !parent || !valid) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const sessionToken = randomUUID();
    await prisma.parent.update({ where: { id: parent.id }, data: { sessionToken } });
    const token = signToken({ id: parent.id, userType: "PARENT", sessionToken });

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
