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

  try {
    const { emitNotification } = await import("./socket-emitter");
    emitNotification(notif);
  } catch {}

  // Web Push — tarayıcıda açık olan cihazlara bildirim gönder
  try {
    const { sendPushToUser } = await import("./push");
    if (opts.firmId) {
      await sendPushToUser("FIRM", opts.firmId, { title: opts.title, body: opts.body });
    }
    if (opts.driverId) {
      await sendPushToUser("DRIVER", opts.driverId, { title: opts.title, body: opts.body });
    }
    if (opts.parentId) {
      await sendPushToUser("PARENT", opts.parentId, { title: opts.title, body: opts.body });
    }
  } catch {}

  // Expo Push — mobil uygulamaya bildirim gönder
  try {
    const { sendExpoPush } = await import("./expo-push");
    if (opts.parentId) {
      const parent = await prisma.parent.findUnique({
        where: { id: opts.parentId },
        select: { expoPushToken: true },
      });
      if (parent?.expoPushToken) {
        await sendExpoPush(parent.expoPushToken, opts.title, opts.body);
      }
    }
    if (opts.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: opts.driverId },
        select: { expoPushToken: true },
      });
      if (driver?.expoPushToken) {
        await sendExpoPush(driver.expoPushToken, opts.title, opts.body);
      }
    }
  } catch {}

  return notif;
}
