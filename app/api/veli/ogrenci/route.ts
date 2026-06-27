import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { trUpperCase } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    include: {
      students: {
        where: { status: "ACTIVE" },
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
        orderBy: { createdAt: "asc" },
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
    studentId,
    firstName,
    lastName,
    phone,
    profession,
    address,
    pickupLat,
    pickupLng,
    spouseFirstName,
    spouseLastName,
    spousePhone,
    spouseProfession,
    extraContacts,
    parentRelation,
    spouseRelation,
    studentFirstName,
    studentLastName,
    studentBirthDate,
    studentSchool,
    studentClass,
    studentTeacher,
    studentStudyTime,
    studentSchoolType,
    studentPhone,
  } = await req.json();

  // Find which student to update
  const student = studentId
    ? await prisma.student.findFirst({ where: { id: studentId, parentId: user.id } })
    : await prisma.student.findFirst({ where: { parentId: user.id }, orderBy: { createdAt: "asc" } });

  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  const u = (s?: string) => (s ? trUpperCase(s) : s);

  await Promise.all([
    prisma.parent.update({
      where: { id: user.id },
      data: {
        firstName: u(firstName),
        lastName: u(lastName),
        ...(phone ? { phone } : {}),
        profession: u(profession),
        address: u(address),
        pickupLat: typeof pickupLat === "number" ? pickupLat : null,
        pickupLng: typeof pickupLng === "number" ? pickupLng : null,
        spouseFirstName: u(spouseFirstName),
        spouseLastName: u(spouseLastName),
        spousePhone,
        spouseProfession: u(spouseProfession),
        extraContacts: Array.isArray(extraContacts) ? extraContacts : undefined,
        parentRelation: parentRelation || null,
        spouseRelation: spouseRelation || null,
      },
    }),
    prisma.student.update({
      where: { id: student.id },
      data: {
        firstName: u(studentFirstName),
        lastName: u(studentLastName),
        birthDate: studentBirthDate ? new Date(studentBirthDate) : undefined,
        school: u(studentSchool),
        class: studentClass,
        teacher: u(studentTeacher),
        studyTime: studentStudyTime,
        schoolType: studentSchoolType || null,
        phone: studentPhone || null,
      },
    }),
  ]);

  return NextResponse.json({ message: "Bilgiler güncellendi." });
}
