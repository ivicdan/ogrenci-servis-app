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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: {
      pickupLat: true,
      pickupLng: true,
      student: {
        select: {
          id: true,
          routeId: true,
          routeOrder: true,
          dropoffRouteId: true,
          dropoffRouteOrder: true,
          driverId: true,
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              plateNumber: true,
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
      },
    },
  });

  if (!parent?.student?.driver) return NextResponse.json({ tripActive: false });

  const driver = parent.student.driver;
  const activeRoute = driver.routes[0] ?? null;
  if (!activeRoute) return NextResponse.json({ tripActive: false });

  const isDropoff = activeRoute.type.includes("DROPOFF");
  const myStudentId = parent.student.id;
  const myOrder = isDropoff ? parent.student.dropoffRouteOrder : parent.student.routeOrder;
  const myRouteId = isDropoff ? parent.student.dropoffRouteId : parent.student.routeId;
  const onActiveRoute = myRouteId === activeRoute.id;

  // Öğrenci bugün zaten alındıysa velinin haritasını kapat
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

  if (driver.currentLat != null && driver.currentLng != null) {
    const waypoints: [number, number][] = [[driver.currentLat, driver.currentLng]];

    if (onActiveRoute) {
      // Rotadaki diğer öğrencileri güzergah sırasına göre çek
      const routeStudents = await prisma.student.findMany({
        where: isDropoff
          ? { dropoffRouteId: activeRoute.id, status: "ACTIVE" }
          : { routeId: activeRoute.id, status: "ACTIVE" },
        select: {
          id: true,
          routeOrder: true,
          dropoffRouteOrder: true,
          parent: { select: { pickupLat: true, pickupLng: true } },
          attendances: {
            where: {
              date: { gte: todayStart },
              type: isDropoff ? "DROPOFF" : "PICKUP",
            },
            select: { status: true },
            orderBy: { createdAt: "desc" as const },
            take: 1,
          },
        },
        orderBy: isDropoff
          ? { dropoffRouteOrder: "asc" }
          : { routeOrder: "asc" },
      });

      for (const s of routeStudents) {
        const order = isDropoff ? s.dropoffRouteOrder : s.routeOrder;
        if (order > myOrder) break; // Bu velinin durağından sonraki durağa gerek yok

        const status = s.attendances[0]?.status ?? "PENDING";
        // Zaten alınmış veya gelmeyecek ise atla
        if (status === "PICKED_UP" || status === "ABSENT" || status === "NOTIFIED_ABSENT") continue;

        const stopLat = s.id === myStudentId ? parent.pickupLat : s.parent?.pickupLat;
        const stopLng = s.id === myStudentId ? parent.pickupLng : s.parent?.pickupLng;
        if (stopLat != null && stopLng != null) {
          waypoints.push([stopLat, stopLng]);
        }
      }
    }

    // Ara durak eklenmediyse direkt velinin konumuna git
    if (waypoints.length === 1 && parent.pickupLat != null && parent.pickupLng != null) {
      waypoints.push([parent.pickupLat, parent.pickupLng]);
    }

    if (waypoints.length >= 2) {
      const osrm = await osrmMultiRoute(waypoints);
      if (osrm) {
        distanceMeters = osrm.distance;
        etaMinutes = Math.max(1, Math.round(osrm.duration / 60));
        routeGeometry = osrm.geometry;
      } else if (parent.pickupLat != null && parent.pickupLng != null) {
        const dist = haversineMeters(
          driver.currentLat, driver.currentLng,
          parent.pickupLat, parent.pickupLng
        );
        distanceMeters = Math.round(dist);
        etaMinutes = Math.max(1, Math.round((dist / 1000 / 30) * 60));
      }
    }
  }

  return NextResponse.json({
    tripActive: true,
    route: { id: activeRoute.id, name: activeRoute.name, type: activeRoute.type, startedAt: activeRoute.tripStartedAt },
    driver: {
      firstName: driver.firstName,
      lastName: driver.lastName,
      plateNumber: driver.plateNumber,
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
