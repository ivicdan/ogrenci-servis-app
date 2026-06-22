"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const busIcon = L.divIcon({
  className: "",
  html: `<div style="background:#1d4ed8;color:white;width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1">🚌</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const homeIcon = L.divIcon({
  className: "",
  html: `<div style="background:#7c3aed;color:white;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1">🏠</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function BoundsFitter({
  driverPos,
  homePos,
  routeCoords,
}: {
  driverPos: [number, number];
  homePos: [number, number] | null;
  routeCoords: [number, number][];
}) {
  const map = useMap();
  useEffect(() => {
    // Yol geometrisi varsa tüm koordinatları kapsayan sınır kullan
    const allPoints = routeCoords.length > 1
      ? routeCoords
      : homePos
        ? [driverPos, homePos]
        : [driverPos];

    if (allPoints.length === 1) {
      map.flyTo(allPoints[0], 15, { duration: 1.2 });
    } else {
      const bounds = L.latLngBounds(allPoints);
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1.2 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    driverPos[0], driverPos[1],
    homePos?.[0], homePos?.[1],
    routeCoords.length,
  ]);
  return null;
}

interface DriverTrackingMapProps {
  driverLat: number;
  driverLng: number;
  driverName: string;
  homeLat?: number | null;
  homeLng?: number | null;
  /** Yol tabanlı rota noktaları (backend OSRM'den) */
  routeGeometry?: [number, number][] | null;
  height?: number;
}

export default function DriverTrackingMap({
  driverLat,
  driverLng,
  driverName,
  homeLat,
  homeLng,
  routeGeometry,
  height = 260,
}: DriverTrackingMapProps) {
  const driverPos: [number, number] = [driverLat, driverLng];
  const homePos: [number, number] | null =
    homeLat != null && homeLng != null ? [homeLat, homeLng] : null;

  const routeCoords: [number, number][] =
    routeGeometry && routeGeometry.length > 1 ? routeGeometry : [];

  // Yol yoksa düz çizgi yedek
  const fallbackLine: [number, number][] =
    routeCoords.length === 0 && homePos ? [driverPos, homePos] : [];

  const initialCenter: [number, number] = homePos
    ? [(driverLat + homeLat!) / 2, (driverLng + homeLng!) / 2]
    : driverPos;

  return (
    <MapContainer
      center={initialCenter}
      zoom={13}
      style={{ height }}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={20}
      />

      <BoundsFitter
        driverPos={driverPos}
        homePos={homePos}
        routeCoords={routeCoords}
      />

      {/* Gerçek yol rotası */}
      {routeCoords.length > 1 && (
        <Polyline
          positions={routeCoords}
          color="#3b82f6"
          weight={4}
          opacity={0.85}
        />
      )}

      {/* OSRM yoksa düz çizgi */}
      {fallbackLine.length === 2 && (
        <Polyline
          positions={fallbackLine}
          color="#94a3b8"
          weight={3}
          dashArray="8,6"
          opacity={0.7}
        />
      )}

      <Marker position={driverPos} icon={busIcon}>
        <Tooltip direction="top" offset={[0, -22]} permanent opacity={0.92}>
          <span className="text-xs font-semibold">{driverName}</span>
        </Tooltip>
      </Marker>

      {homePos && (
        <Marker position={homePos} icon={homeIcon}>
          <Tooltip direction="top" offset={[0, -20]} opacity={0.92}>
            <span className="text-xs font-semibold">Durağınız</span>
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
