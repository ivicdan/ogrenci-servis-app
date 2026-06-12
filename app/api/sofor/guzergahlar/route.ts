import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const routes = await prisma.route.findMany({
    where: { driverId: user.id },
    include: {
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { name, type } = await req.json();
  if (!name || !type) {
    return NextResponse.json(
      { error: "Güzergah adı ve türü zorunludur." },
      { status: 400 }
    );
  }

  const driver = await prisma.driver.findUnique({ where: { id: user.id } });
  if (!driver) return NextResponse.json({ error: "Şoför bulunamadı." }, { status: 404 });

  const route = await prisma.route.create({
    data: { name, type, driverId: user.id, firmId: driver.firmId },
  });

  return NextResponse.json(route, { status: 201 });
}
