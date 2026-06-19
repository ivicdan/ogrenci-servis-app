"use client";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface StudentMapPoint {
  id: string;
  firstName: string;
  lastName: string;
  lat: number;
  lng: number;
  status: "pending" | "picked_up" | "absent" | "notified_absent" | "dropped_off";
  routeOrder: number;
}

interface RouteMapProps {
  students: StudentMapPoint[];
  driverLat?: number | null;
  driverLng?: number | null;
  height?: number;
}

function statusColor(status: string) {
  switch (status) {
    case "picked_up": return "#16a34a";
    case "dropped_off": return "#2563eb";
    case "absent": return "#dc2626";
    case "notified_absent": return "#ea580c";
    default: return "#6b7280";
  }
}

function studentMarker(status: string, order: number) {
  const bg = statusColor(status);
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:white;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${order}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const driverMarker = L.divIcon({
  className: "",
  html: `<div style="background:#1d4ed8;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function RouteMap({ students, driverLat, driverLng, height = 280 }: RouteMapProps) {
  const valid = students.filter((s) => s.lat && s.lng);
  if (valid.length === 0) return null;

  const avgLat = valid.reduce((a, s) => a + s.lat, 0) / valid.length;
  const avgLng = valid.reduce((a, s) => a + s.lng, 0) / valid.length;

  const ordered = [...valid].sort((a, b) => a.routeOrder - b.routeOrder);
  const polyline: [number, number][] = ordered.map((s) => [s.lat, s.lng]);

  return (
    <MapContainer
      center={[avgLat, avgLng]}
      zoom={13}
      style={{ height, borderRadius: 12 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={20}
      />

      {polyline.length > 1 && (
        <Polyline positions={polyline} color="#94a3b8" weight={2} dashArray="6,5" />
      )}

      {valid.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={studentMarker(s.status, s.routeOrder)}
        >
          <Tooltip direction="top" offset={[0, -15]} opacity={0.95}>
            <span className="text-sm font-medium">{s.firstName} {s.lastName}</span>
          </Tooltip>
        </Marker>
      ))}

      {driverLat && driverLng && (
        <Marker position={[driverLat, driverLng]} icon={driverMarker}>
          <Tooltip direction="top" opacity={0.95}>Şoför</Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
