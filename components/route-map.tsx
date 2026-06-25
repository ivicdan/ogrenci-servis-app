"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2 } from "lucide-react";

export interface StudentMapPoint {
  id: string;
  firstName: string;
  lastName: string;
  lat: number;
  lng: number;
  status: "pending" | "picked_up" | "absent" | "notified_absent" | "dropped_off";
  routeOrder: number;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Şoför sıradaki bekleyen öğrenciye yaklaştıkça otomatik yakınlaşır.
 * 500m'den uzakta: şoförü takip et; daha yakında: öğrenciye odaklan+zoom.
 */
function MapTracker({
  driverLat,
  driverLng,
  students,
}: {
  driverLat: number;
  driverLng: number;
  students: StudentMapPoint[];
}) {
  const map = useMap();
  const studentsRef = useRef(students);
  studentsRef.current = students;

  useEffect(() => {
    const pending = [...studentsRef.current]
      .filter(s => s.status === "pending" && s.lat && s.lng)
      .sort((a, b) => a.routeOrder - b.routeOrder)[0];

    if (!pending) {
      map.panTo([driverLat, driverLng], { animate: true, duration: 1 });
      return;
    }

    const dist = haversineM(driverLat, driverLng, pending.lat, pending.lng);

    if (dist < 500) {
      const zoom = dist < 50 ? 18 : dist < 100 ? 17 : dist < 200 ? 16 : 15;
      map.flyTo([pending.lat, pending.lng], zoom, { animate: true, duration: 1.2 });
    } else {
      map.panTo([driverLat, driverLng], { animate: true, duration: 1 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverLat, driverLng]);

  return null;
}

function MapResizer({ trigger }: { trigger: boolean }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

interface RouteMapProps {
  students: StudentMapPoint[];
  driverLat?: number | null;
  driverLng?: number | null;
  osrmRoute?: [number, number][] | null;
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

export default function RouteMap({ students, driverLat, driverLng, osrmRoute, height = 280 }: RouteMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const valid = students.filter((s) => s.lat && s.lng);
  if (valid.length === 0) return null;

  const avgLat = valid.reduce((a, s) => a + s.lat, 0) / valid.length;
  const avgLng = valid.reduce((a, s) => a + s.lng, 0) / valid.length;

  const ordered = [...valid].sort((a, b) => a.routeOrder - b.routeOrder);
  const polyline: [number, number][] = ordered.map((s) => [s.lat, s.lng]);

  return (
    <div
      className={isFullscreen ? "fixed inset-0 z-[9999]" : "relative"}
      style={isFullscreen ? undefined : { height }}
    >
      {/* Harita: overflow hidden + border-radius burada */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: isFullscreen ? 0 : 12 }}>
        <MapContainer
          center={[avgLat, avgLng]}
          zoom={13}
          style={{ height: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <MapResizer trigger={isFullscreen} />

          {polyline.length > 1 && (
            <Polyline positions={polyline} color="#94a3b8" weight={2} dashArray="6,5" />
          )}

          {osrmRoute && osrmRoute.length > 1 && (
            <Polyline positions={osrmRoute} color="#2563eb" weight={4} opacity={0.85} />
          )}

          {valid.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={studentMarker(s.status, s.routeOrder)}>
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

          {driverLat && driverLng && (
            <MapTracker driverLat={driverLat} driverLng={driverLng} students={valid} />
          )}
        </MapContainer>
      </div>

      {/* Tam ekran butonu — overflow dışında konumlandırıldı */}
      <button
        onClick={() => setIsFullscreen(v => !v)}
        title={isFullscreen ? "Küçült" : "Tam ekran"}
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          zIndex: 1000,
          background: "white",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: 5,
          cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
    </div>
  );
}
