import { prisma } from "./db";
import { createNotification } from "./notifications";

export async function runPaymentReminders() {
  const today = new Date();
  const todayDay = today.getDate();

  // Velileri ödeme gününe göre kontrol et
  const parents = await prisma.parent.findMany({
    where: { paymentDay: { not: null }, phoneVerified: true },
    select: {
      id: true,
      firstName: true,
      paymentDay: true,
      student: { select: { firmId: true } },
    },
  });

  for (const parent of parents) {
    const payDay = parent.paymentDay!;

    // 2 gün öncesi: bugün = ödeme günü - 2
    if (todayDay === payDay - 2) {
      await createNotification({
        parentId: parent.id,
        title: "Ödeme Hatırlatması",
        body: `Ayın ${payDay}'i olan ödeme gününüz 2 gün sonra. Lütfen ödemenizi hazırlayın.`,
      });
    }

    // 3 gün geçtikten sonra: bugün = ödeme günü + 3
    if (todayDay === payDay + 3) {
      // Bu ay APPROVED ödeme var mı kontrol et
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const approvedThisMonth = await prisma.payment.findFirst({
        where: {
          studentId: parent.student?.firmId ? undefined : undefined,
          status: "APPROVED",
          paidDate: { gte: startOfMonth },
        },
      });

      if (!approvedThisMonth) {
        await createNotification({
          parentId: parent.id,
          title: "Ödeme Gecikme Uyarısı",
          body: `Ödeme tarihiniz (ayın ${payDay}'i) ${today.getDate() - payDay} gün geçti. Lütfen en kısa sürede ödemenizi gerçekleştirin.`,
        });
      }
    }
  }
}
