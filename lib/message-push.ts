import { prisma } from "./db";
import { sendExpoPush } from "./expo-push";

export async function notifyMessageRecipients(
  recipients: { userId: string; userType: string }[],
  title: string,
  body: string
) {
  await Promise.all(
    recipients.map(async (r) => {
      try {
        if (r.userType === "PARENT") {
          const parent = await prisma.parent.findUnique({
            where: { id: r.userId },
            select: { expoPushToken: true },
          });
          if (!parent?.expoPushToken) return;
          const badge = await prisma.messageRecipient.count({
            where: { userId: r.userId, userType: "PARENT", read: false },
          });
          await sendExpoPush(parent.expoPushToken, title, body, { badge, channelId: "mesajlar" });
        } else if (r.userType === "DRIVER") {
          const driver = await prisma.driver.findUnique({
            where: { id: r.userId },
            select: { expoPushToken: true },
          });
          if (!driver?.expoPushToken) return;
          const badge = await prisma.messageRecipient.count({
            where: { userId: r.userId, userType: "DRIVER", read: false },
          });
          await sendExpoPush(driver.expoPushToken, title, body, { badge, channelId: "mesajlar" });
        }
      } catch {}
    })
  );
}
