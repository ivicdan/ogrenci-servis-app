export function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();

    // Araba kornası: iki frekanslı sawtooth (major third aralığı)
    const hornFreqs = [380, 480];
    const duration = 0.45;

    hornFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Hafif distortion için WaveShaper
      const waveshaper = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = ((Math.PI + 80) * x) / (Math.PI + 80 * Math.abs(x));
      }
      waveshaper.curve = curve;

      osc.type = "sawtooth";
      osc.frequency.value = freq;

      osc.connect(waveshaper);
      waveshaper.connect(gain);
      gain.connect(ctx.destination);

      // Hızlı başla, düz tut, hızlı kes
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.015);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + duration - 0.04);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    });

    setTimeout(() => ctx.close(), 700);
  } catch {}
}

export function requestNotificationPermission() {
  if (typeof window === "undefined") return;
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function showPushNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {}
}
