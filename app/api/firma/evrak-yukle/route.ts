import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const DOC_LABELS: Record<string, string> = {
  imza_sirkuleri: "İmza Sirküsü",
  vergi_levhasi: "Vergi Levhası",
  kimlik_fotokopisi: "Kimlik Fotokopisi",
  ticaret_sicil: "Ticaret Sicil Gazetesi",
  faaliyet_belgesi: "Faaliyet Belgesi",
};

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["FIRM"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = (formData.get("docType") as string) ?? "";

  if (!file) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  if (!DOC_LABELS[docType]) return NextResponse.json({ error: "Geçersiz evrak türü." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Sadece PDF ve resim dosyaları (JPG, PNG) yüklenebilir." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Dosya boyutu 10 MB'den büyük olamaz." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${docType}_${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "firma", user.id);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  const fileUrl = `/uploads/firma/${user.id}/${filename}`;

  const firm = await prisma.firm.findUnique({ where: { id: user.id }, select: { documents: true } });
  const existing = (firm?.documents as Record<string, unknown>) ?? {};

  await prisma.firm.update({
    where: { id: user.id },
    data: {
      documents: {
        ...existing,
        [docType]: { url: fileUrl, name: file.name, uploadedAt: new Date().toISOString() },
      },
    },
  });

  return NextResponse.json({ url: fileUrl });
}
