import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { emitDriverLocation } from "@/lib/socket-emitter";
import { createNotification } from "@/lib/notifications";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["DRIVER"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { lat, lng } = await req.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Geçersiz konum." }, { status: 400 });
  }

  const updatedAt = new Date();

  // Driver konumunu güncelle
  await prisma.driver.update({
    where: { id: user.id },
    data: { currentLat: lat, currentLng: lng, locationUpdatedAt: updatedAt },
  });

  // ETA bildirimi için: bu şoförün aktif güzergahlarındaki öğrencileri kontrol et
  const ETA_THRESHOLD_M = 800;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const students = await prisma.student.findMany({
    where: {
      driverId: user.id,
      status: "ACTIVE",
      parent: {
        pickupLat: { not: null },
        pickupLng: { not: null },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      parent: {
        select: {
          id: true,
          pickupLat: true,
          pickupLng: true,
        },
      },
    },
  });

  const etaNotifs: string[] = [];
  const parentIds: string[] = [];

  for (const student of students) {
    const p = student.parent;
    if (!p?.pickupLat || !p?.pickupLng) continue;

    parentIds.push(p.id);

    const dist = haversineMeters(lat, lng, p.pickupLat, p.pickupLng);

    if (dist <= ETA_THRESHOLD_M) {
      // Bugün zaten "Servis Yaklaşıyor" bildirimi gittiyse tekrar gönderme
      const alreadySent = await prisma.notification.findFirst({
        where: {
          parentId: p.id,
          title: "Servis Yaklaşıyor",
          createdAt: { gte: todayStart, lt: todayEnd },
        },
        select: { id: true },
      });

      if (!alreadySent) {
        const etaMin = Math.max(1, Math.round((dist / 1000 / 30) * 60));
        await createNotification({
          parentId: p.id,
          title: "Servis Yaklaşıyor",
          body: `Servisiniz yaklaşık ${etaMin} dakika içinde kapınızda olacak.`,
          channelId: "servis_yaklasiyor",
        });
        etaNotifs.push(student.id);
      }
    }
  }

  // Socket üzerinden anlık konum yay
  if (parentIds.length > 0) {
    emitDriverLocation({ parentIds, lat, lng, updatedAt: updatedAt.toISOString() });
  }

  return NextResponse.json({ ok: true, etaNotified: etaNotifs.length });
}
