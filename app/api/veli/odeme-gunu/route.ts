import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { paymentDay } = await req.json();

  if (!paymentDay || paymentDay < 1 || paymentDay > 28) {
    return NextResponse.json(
      { error: "Ödeme günü 1 ile 28 arasında olmalıdır." },
      { status: 400 }
    );
  }

  await prisma.parent.update({
    where: { id: user.id },
    data: { paymentDay },
  });

  return NextResponse.json({ message: "Ödeme günü güncellendi.", paymentDay });
}
