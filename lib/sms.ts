export async function sendOtp(phone: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    const usercode = process.env.NETGSM_USERCODE;
    const password = process.env.NETGSM_PASSWORD;
    const msgheader = process.env.NETGSM_MSGHEADER;

    if (!usercode || !password || !msgheader) {
      console.error("[SMS] NETGSM_USERCODE, NETGSM_PASSWORD veya NETGSM_MSGHEADER eksik");
      return;
    }

    // Türkiye formatı: 905XXXXXXXXX
    const gsm = phone.replace(/^0/, "90").replace(/\D/g, "");
    const message = `Ogrenci Servis dogrulama kodunuz: ${code}`;

    const url = new URL("https://api.netgsm.com.tr/sms/send/get/");
    url.searchParams.set("usercode", usercode);
    url.searchParams.set("password", password);
    url.searchParams.set("gsmno", gsm);
    url.searchParams.set("text", message);
    url.searchParams.set("msgheader", msgheader);

    const res = await fetch(url.toString());
    const body = await res.text();

    // Netgsm başarı kodu: 00, 01, 02
    if (!body.startsWith("00") && !body.startsWith("01") && !body.startsWith("02")) {
      console.error(`[SMS] Netgsm hata kodu: ${body}`);
    }
    return;
  }

  console.log(`[SMS Mock] ${phone} → OTP: ${code}`);
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
