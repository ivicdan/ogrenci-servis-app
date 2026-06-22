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
}: {
  driverPos: [number, number];
  homePos: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (homePos) {
      const bounds = L.latLngBounds([driverPos, homePos]);
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1.2 });
    } else {
      map.flyTo(driverPos, 15, { duration: 1.2 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverPos[0], driverPos[1], homePos?.[0], homePos?.[1]]);
  return null;
}

interface DriverTrackingMapProps {
  driverLat: number;
  driverLng: number;
  driverName: string;
  homeLat?: number | null;
  homeLng?: number | null;
  height?: number;
}

export default function DriverTrackingMap({
  driverLat,
  driverLng,
  driverName,
  homeLat,
  homeLng,
  height = 260,
}: DriverTrackingMapProps) {
  const driverPos: [number, number] = [driverLat, driverLng];
  const homePos: [number, number] | null =
    homeLat != null && homeLng != null ? [homeLat, homeLng] : null;

  const initialCenter: [number, number] = homePos
    ? [(driverLat + homeLat!) / 2, (driverLng + homeLng!) / 2]
    : driverPos;

  const line: [number, number][] = homePos ? [driverPos, homePos] : [];

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

      <BoundsFitter driverPos={driverPos} homePos={homePos} />

      {line.length === 2 && (
        <Polyline positions={line} color="#3b82f6" weight={3} dashArray="8,6" opacity={0.75} />
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
