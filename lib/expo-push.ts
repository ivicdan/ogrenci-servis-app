export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  options?: { channelId?: string; badge?: number }
) {
  if (!token?.startsWith("ExponentPushToken[")) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: "default",
        ...(options?.channelId ? { channelId: options.channelId } : {}),
        ...(options?.badge != null ? { badge: options.badge } : {}),
      }),
    });
  } catch {}
}
