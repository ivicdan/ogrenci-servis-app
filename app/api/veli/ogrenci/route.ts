import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    include: {
      student: {
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              plateNumber: true,
              assistantName: true,
              driverCode: true,
            },
          },
          firm: {
            select: {
              id: true,
              firmCode: true,
              name: true,
              iban: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!parent) return NextResponse.json({ error: "Veli bulunamadı." }, { status: 404 });

  return NextResponse.json(parent);
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const {
    firstName,
    lastName,
    profession,
    address,
    spouseName,
    spousePhone,
    spouseProfession,
    studentFirstName,
    studentLastName,
    studentBirthDate,
    studentSchool,
    studentClass,
    studentTeacher,
    studentStudyTime,
    studentPhone,
  } = await req.json();

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: { studentId: true },
  });

  if (!parent) return NextResponse.json({ error: "Veli bulunamadı." }, { status: 404 });

  await Promise.all([
    prisma.parent.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        profession,
        address,
        spouseName,
        spousePhone,
        spouseProfession,
      },
    }),
    prisma.student.update({
      where: { id: parent.studentId },
      data: {
        firstName: studentFirstName,
        lastName: studentLastName,
        birthDate: studentBirthDate ? new Date(studentBirthDate) : undefined,
        school: studentSchool,
        class: studentClass,
        teacher: studentTeacher,
        studyTime: studentStudyTime,
        phone: studentPhone || null,
      },
    }),
  ]);

  return NextResponse.json({ message: "Bilgiler güncellendi." });
}
