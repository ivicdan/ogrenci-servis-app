import { prisma } from "./db";

interface NotifyOptions {
  firmId?: string;
  driverId?: string;
  parentId?: string;
  title: string;
  body: string;
}

export async function createNotification(opts: NotifyOptions) {
  const notif = await prisma.notification.create({
    data: {
      firmId: opts.firmId,
      driverId: opts.driverId,
      parentId: opts.parentId,
      title: opts.title,
      body: opts.body,
    },
  });

  // Socket.io emit — server-side emitter sunucu üzerinden çağrılır
  // emit() fonksiyonu /app/api/socket/route.ts'den export edilir
  try {
    const { emitNotification } = await import("./socket-emitter");
    emitNotification(notif);
  } catch {
    // Socket sunucusu hazır değilse sessizce geç
  }

  return notif;
}
