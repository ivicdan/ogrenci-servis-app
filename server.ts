import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketServer } from "socket.io";
import { setSocketServer } from "./lib/socket-emitter";
import { verifyToken } from "./lib/auth";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const allowedOrigins = process.env.NEXT_PUBLIC_APP_URL
    ? [process.env.NEXT_PUBLIC_APP_URL]
    : ["http://localhost:3000"];

  const io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    path: "/api/socketio",
  });

  setSocketServer(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token gerekli"));
    const payload = verifyToken(token);
    if (!payload) return next(new Error("Geçersiz token"));
    socket.data.user = payload;
    next();
  });

  io.on("connection", (socket) => {
    const { id, userType } = socket.data.user;

    // Kullanıcıyı kendi odasına al
    if (userType === "FIRM") socket.join(`firm:${id}`);
    else if (userType === "DRIVER") socket.join(`driver:${id}`);
    else if (userType === "PARENT") socket.join(`parent:${id}`);

    socket.on("disconnect", () => {
      // otomatik temizlenir
    });
  });

  // Ödeme hatırlatma cron job'ını başlat
  startPaymentReminder();

  httpServer.listen(port, () => {
    console.log(`> Sunucu http://localhost:${port} adresinde çalışıyor`);
  });
});

function startPaymentReminder() {
  import("node-cron").then(({ default: cron }) => {
    import("./lib/payment-scheduler").then(({ runPaymentReminders }) => {
      // Her gün saat 09:00'da çalışır
      cron.schedule("0 9 * * *", runPaymentReminders);
      console.log("> Ödeme hatırlatma cron job başlatıldı");
    });
  });
}
