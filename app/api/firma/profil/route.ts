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

  const firm = await prisma.firm.update({
    where: { id: user.id },
    data: {
      name: name ? trUpperCase(name) : name,
      address: address ? trUpperCase(address) : address,
      iban,
      documents,
      status: name && address ? "ACTIVE" : undefined,
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
