export type SoundType =
  | "boarded"    // Öğrenci servise bindi
  | "school"     // Okula ulaştı
  | "home"       // Eve ulaştı
  | "absent"     // Öğrenci yok / binemedi
  | "absence"    // Devamsızlık bildirimi (veliden)
  | "message"    // Yeni mesaj / duyuru
  | "payment"    // Ödeme bildirimi
  | "horn";      // Genel / varsayılan korna

function getCtx(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.18,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.setValueAtTime(volume, startTime + duration - 0.03);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Öğrenci servise bindi — yükselen iki nota (neşeli)
function playBoarded(ctx: AudioContext) {
  playTone(ctx, 523, ctx.currentTime, 0.12, 0.15);        // Do
  playTone(ctx, 659, ctx.currentTime + 0.13, 0.18, 0.18); // Mi
}

// Okula ulaştı — üç yükselen nota (başarı)
function playSchool(ctx: AudioContext) {
  playTone(ctx, 523, ctx.currentTime, 0.1, 0.14);         // Do
  playTone(ctx, 659, ctx.currentTime + 0.11, 0.1, 0.14);  // Mi
  playTone(ctx, 784, ctx.currentTime + 0.22, 0.18, 0.18); // Sol
}

// Eve ulaştı — melodik iniş (huzurlu)
function playHome(ctx: AudioContext) {
  playTone(ctx, 784, ctx.currentTime, 0.1, 0.16);         // Sol
  playTone(ctx, 659, ctx.currentTime + 0.11, 0.1, 0.16);  // Mi
  playTone(ctx, 523, ctx.currentTime + 0.22, 0.2, 0.2);   // Do
}

// Öğrenci yok / binemedi — çift uyarı beep (dikkat)
function playAbsent(ctx: AudioContext) {
  playTone(ctx, 440, ctx.currentTime, 0.1, 0.2, "square");
  playTone(ctx, 440, ctx.currentTime + 0.15, 0.1, 0.2, "square");
}

// Devamsızlık bildirimi — alçalan iki nota (acil)
function playAbsence(ctx: AudioContext) {
  playTone(ctx, 587, ctx.currentTime, 0.12, 0.2, "triangle");       // Re
  playTone(ctx, 440, ctx.currentTime + 0.14, 0.18, 0.2, "triangle"); // La
}

// Yeni mesaj — yumuşak tek ding
function playMessage(ctx: AudioContext) {
  playTone(ctx, 880, ctx.currentTime, 0.25, 0.12, "sine");
}

// Ödeme — coin sesi (yüksek frekans, hızlı decay)
function playPayment(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1046, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

// Genel korna — mevcut ses (iki frekanslı sawtooth)
function playHorn(ctx: AudioContext) {
  [380, 480].forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const ws = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((Math.PI + 80) * x) / (Math.PI + 80 * Math.abs(x));
    }
    ws.curve = curve;
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.connect(ws);
    ws.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.015);
    gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.41);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  });
}

export function playNotificationSound(type: SoundType = "horn") {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    switch (type) {
      case "boarded":  playBoarded(ctx);  break;
      case "school":   playSchool(ctx);   break;
      case "home":     playHome(ctx);     break;
      case "absent":   playAbsent(ctx);   break;
      case "absence":  playAbsence(ctx);  break;
      case "message":  playMessage(ctx);  break;
      case "payment":  playPayment(ctx);  break;
      default:         playHorn(ctx);     break;
    }
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

export function soundTypeFromTitle(title: string, body = ""): SoundType {
  const t = (title + " " + body).toLowerCase();
  if (t.includes("eve") && (t.includes("ulaş") || t.includes("döndü"))) return "home";
  if (t.includes("okula") && t.includes("ulaş")) return "school";
  if (t.includes("bindi") || t.includes("servise bindi") || t.includes("alındı")) return "boarded";
  if (t.includes("binemedi") || t.includes("yok") || t.includes("inmedi")) return "absent";
  if (t.includes("devamsızlık") || t.includes("gelmeyecek")) return "absence";
  if (t.includes("ödeme")) return "payment";
  if (t.includes("mesaj") || t.includes("duyuru")) return "message";
  return "horn";
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
