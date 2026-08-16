import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { trUpperCase } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const firm = await prisma.firm.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      firmCode: true,
      taxOrTcId: true,
      phone: true,
      status: true,
      name: true,
      address: true,
      iban: true,
      documents: true,
      createdAt: true,
    },
  });

  if (!firm) return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
  return NextResponse.json(firm);
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { name, address, iban, documents } = await req.json();

  // Mevcut statüyü oku — sadece PRE_REGISTERED ise PENDING_APPROVAL'a geç
  const current = await prisma.firm.findUnique({ where: { id: user.id }, select: { status: true } });
  const newStatus = current?.status === "PRE_REGISTERED" && name && address
    ? "PENDING_APPROVAL"
    : undefined; // APPROVED veya PENDING_APPROVAL ise statüye dokunma

  const firm = await prisma.firm.update({
    where: { id: user.id },
    data: {
      name: name ? trUpperCase(name) : name,
      address: address ? trUpperCase(address) : address,
      iban,
      documents,
      ...(newStatus ? { status: newStatus } : {}),
    },
    select: {
      id: true,
      firmCode: true,
      name: true,
      address: true,
      iban: true,
      status: true,
    },
  });

  return NextResponse.json(firm);
}
