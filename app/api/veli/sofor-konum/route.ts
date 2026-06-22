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

async function osrmRoute(lat1: number, lng1: number, lat2: number, lng2: number) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${lng1},${lat1};${lng2},${lat2}` +
      `?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const r = data.routes[0];
    // GeoJSON coords → [lat, lng] for Leaflet
    const geometry: [number, number][] = r.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    return {
      distance: Math.round(r.distance) as number,
      duration: Math.round(r.duration) as number, // saniye
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
                select: {
                  id: true,
                  name: true,
                  type: true,
                  tripStartedAt: true,
                },
                orderBy: { tripStartedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!parent?.student?.driver) {
    return NextResponse.json({ tripActive: false });
  }

  const driver = parent.student.driver;
  const activeRoute = driver.routes[0] ?? null;

  if (!activeRoute) {
    return NextResponse.json({ tripActive: false });
  }

  let etaMinutes: number | null = null;
  let distanceMeters: number | null = null;
  let routeGeometry: [number, number][] | null = null;

  if (
    driver.currentLat != null &&
    driver.currentLng != null &&
    parent.pickupLat != null &&
    parent.pickupLng != null
  ) {
    // Yol tabanlı rota: OSRM
    const osrm = await osrmRoute(
      driver.currentLat,
      driver.currentLng,
      parent.pickupLat,
      parent.pickupLng
    );

    if (osrm) {
      distanceMeters = osrm.distance;
      etaMinutes = Math.max(1, Math.round(osrm.duration / 60));
      routeGeometry = osrm.geometry;
    } else {
      // OSRM erişilemez ise Haversine yedek
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
    route: {
      id: activeRoute.id,
      name: activeRoute.name,
      type: activeRoute.type,
      startedAt: activeRoute.tripStartedAt,
    },
    driver: {
      firstName: driver.firstName,
      lastName: driver.lastName,
      plateNumber: driver.plateNumber,
      lat: driver.currentLat,
      lng: driver.currentLng,
      updatedAt: driver.locationUpdatedAt,
    },
    pickup: {
      lat: parent.pickupLat,
      lng: parent.pickupLng,
    },
    eta: etaMinutes,
    distance: distanceMeters,
    routeGeometry,   // Leaflet Polyline için [lat, lng][]
  });
}
