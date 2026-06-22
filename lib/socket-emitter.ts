// Singleton Socket.io server referansı

import { Server as SocketServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var _io: SocketServer | undefined;
}

export function getSocketServer(): SocketServer | null {
  return global._io || null;
}

export function setSocketServer(io: SocketServer) {
  global._io = io;
}

export function emitNotification(notification: {
  id: string;
  firmId?: string | null;
  driverId?: string | null;
  parentId?: string | null;
  title: string;
  body: string;
}) {
  const io = getSocketServer();
  if (!io) return;

  if (notification.firmId) {
    io.to(`firm:${notification.firmId}`).emit("notification", notification);
  }
  if (notification.driverId) {
    io.to(`driver:${notification.driverId}`).emit("notification", notification);
  }
  if (notification.parentId) {
    io.to(`parent:${notification.parentId}`).emit("notification", notification);
  }
}

export function emitAttendance(data: {
  studentId: string;
  driverId: string;
  parentId: string;
  status: string;
  type: string;
}) {
  const io = getSocketServer();
  if (!io) return;
  io.to(`parent:${data.parentId}`).emit("attendance", data);
  io.to(`driver:${data.driverId}`).emit("attendance", data);
}

export function emitAbsenceNotification(data: {
  studentId: string;
  driverId: string;
  type: string;
}) {
  const io = getSocketServer();
  if (!io) return;
  io.to(`driver:${data.driverId}`).emit("absence", data);
}

export function emitDriverLocation(data: {
  parentIds: string[];
  lat: number;
  lng: number;
  eta?: number | null;
  updatedAt: string;
}) {
  const io = getSocketServer();
  if (!io) return;
  const payload = { lat: data.lat, lng: data.lng, eta: data.eta, updatedAt: data.updatedAt };
  for (const parentId of data.parentIds) {
    io.to(`parent:${parentId}`).emit("driverLocation", payload);
  }
}
