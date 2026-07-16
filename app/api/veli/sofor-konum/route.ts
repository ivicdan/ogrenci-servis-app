import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function osrmMultiRoute(waypoints: [number, number][]) {
  if (waypoints.length < 2) return null;
  try {
    const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const r = data.routes[0];
    const geometry: [number, number][] = r.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    return {
      distance: Math.round(r.distance) as number,
      duration: Math.round(r.duration) as number,
      geometry,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["PARENT"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") || null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: { pickupLat: true, pickupLng: true },
  });

  const student = await prisma.student.findFirst({
    where: {
      parentId: user.id,
      status: "ACTIVE",
      ...(studentId ? { id: studentId } : {}),
    },
    select: {
      id: true,
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          plateNumber: true,
          assistantName: true,
          assistantPhone: true,
          currentLat: true,
          currentLng: true,
          locationUpdatedAt: true,
          routes: {
            where: { tripStartedAt: { gte: todayStart } },
            select: { id: true, name: true, type: true, tripStartedAt: true },
            orderBy: { tripStartedAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!parent || !student?.driver) return NextResponse.json({ tripActive: false });

  const driver = student.driver;
  const activeRoute = driver.routes[0] ?? null;
  if (!activeRoute) return NextResponse.json({ tripActive: false });

  const isDropoff = activeRoute.type.includes("DROPOFF");
  const myStudentId = student.id;

  const pickedUp = await prisma.attendance.findFirst({
    where: {
      studentId: myStudentId,
      date: { gte: todayStart },
      type: isDropoff ? "DROPOFF" : "PICKUP",
      status: "PICKED_UP",
    },
  });
  if (pickedUp) return NextResponse.json({ tripActive: false });

  let etaMinutes: number | null = null;
  let distanceMeters: number | null = null;
  let routeGeometry: [number, number][] | null = null;

  // Diğer duraklar üzerinden değil, şoförün mevcut konumundan doğrudan bu veliye
  // ait alış noktasına olan güzergah hesaplanır (aradaki duraklar üzerinden hesaplama
  // gerçek konuma göre anlamsız uzun rotalar üretebiliyordu)
  if (
    driver.currentLat != null &&
    driver.currentLng != null &&
    parent.pickupLat != null &&
    parent.pickupLng != null
  ) {
    const osrm = await osrmMultiRoute([
      [driver.currentLat, driver.currentLng],
      [parent.pickupLat, parent.pickupLng],
    ]);
    if (osrm) {
      distanceMeters = osrm.distance;
      etaMinutes = Math.max(1, Math.round(osrm.duration / 60));
      routeGeometry = osrm.geometry;
    } else {
      const dist = haversineMeters(
        driver.currentLat,
        driver.currentLng,
        parent.pickupLat,
        parent.pickupLng
      );
      distanceMeters = Math.round(dist);
      etaMinutes = Math.max(1, Math.round((dist / 1000 / 30) * 60));
    }
  }

  return NextResponse.json({
    tripActive: true,
    route: { id: activeRoute.id, name: activeRoute.name, type: activeRoute.type, startedAt: activeRoute.tripStartedAt },
    driver: {
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      plateNumber: driver.plateNumber,
      assistantName: driver.assistantName,
      assistantPhone: driver.assistantPhone,
      lat: driver.currentLat,
      lng: driver.currentLng,
      updatedAt: driver.locationUpdatedAt,
    },
    pickup: { lat: parent.pickupLat, lng: parent.pickupLng },
    eta: etaMinutes,
    distance: distanceMeters,
    routeGeometry,
  });
}
