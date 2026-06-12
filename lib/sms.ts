// Mock SMS servisi — production'da Netgsm ile değiştir

export async function sendOtp(phone: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    // TODO: Netgsm entegrasyonu
    // await netgsm.send({ to: phone, message: `Doğrulama kodunuz: ${code}` })
  }
  console.log(`[SMS Mock] ${phone} → OTP: ${code}`);
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
