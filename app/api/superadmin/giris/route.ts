import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  const ADMIN_SECRET = process.env.ADMIN_SECRET;

  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin paneli yapılandırılmamış." }, { status: 503 });
  }

  if (!secret || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  }

  return NextResponse.json({ token: ADMIN_SECRET });
}
