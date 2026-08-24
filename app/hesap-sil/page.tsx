export const metadata = {
  title: "Hesap Silme — Online Öğrenci Servisi",
  description: "Online Öğrenci Servisi hesabınızı ve verilerinizi silme talebi nasıl yapılır.",
};

export default function HesapSil() {
  const mailSubject = encodeURIComponent("Hesap Silme Talebi — Online Öğrenci Servisi");
  const mailBody = encodeURIComponent(
    "Merhaba,\n\nOnline Öğrenci Servisi uygulamasındaki hesabımın ve kişisel verilerimin silinmesini talep ediyorum.\n\nKayıtlı telefon numaram: \nAdım Soyadım: \n\nTeşekkürler."
  );
  const mailtoHref = `mailto:timeshare59@gmail.com?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 text-sm text-gray-700 space-y-6 leading-relaxed">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Hesap ve Veri Silme Talebi</h1>
          <p className="text-xs text-gray-500">Online Öğrenci Servisi (Veli ve Şoför uygulamaları)</p>
        </div>

        <section>
          <p>
            Online Öğrenci Servisi hesabınızı ve hesabınızla ilişkili kişisel verilerinizi
            silmemizi istiyorsanız aşağıdaki adımları izleyebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">Talep Nasıl Yapılır?</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>
              Aşağıdaki butona basarak kayıtlı telefon numaranızla bize e-posta gönderin, ya da
              doğrudan{" "}
              <a href="mailto:timeshare59@gmail.com" className="text-purple-600 font-medium">
                timeshare59@gmail.com
              </a>{" "}
              adresine yazın.
            </li>
            <li>Talebinizde hesabınıza kayıtlı telefon numarasını mutlaka belirtin.</li>
            <li>
              Talebiniz en geç <strong>30 gün</strong> içinde değerlendirilir ve hesabınız ile
              ilişkili kişisel verileriniz, yasal saklama yükümlülükleri dışında kalan kısımlarıyla
              tamamen silinir.
            </li>
          </ol>
          <a
            href={mailtoHref}
            className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg"
          >
            Hesap Silme Talebi Gönder
          </a>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">Neler Silinir?</h2>
          <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
            <li>Ad, soyad, telefon numarası, adres ve konum bilgileriniz</li>
            <li>Giriş bilgileriniz (şifreniz)</li>
            <li>Push bildirim belirteciniz</li>
            <li>Hesabınıza bağlı mesaj ve bildirim geçmişiniz</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">Neler Saklanabilir?</h2>
          <p>
            Servis firmasının yasal muhasebe/fatura yükümlülükleri kapsamında ödeme kayıtları gibi
            bazı veriler, ilgili mevzuatta öngörülen süre boyunca anonim hale getirilerek
            saklanabilir. Öğrenciye ait kayıtlar, servis firması ile aranızdaki hizmet ilişkisinin
            bir parçası olduğundan, veli hesabı silindiğinde öğrenci kaydının firma tarafındaki
            yönetimi devam edebilir; öğrenci kaydının da silinmesini istiyorsanız bunu talebinizde
            ayrıca belirtin.
          </p>
        </section>

        <section>
          <p className="text-xs text-gray-500">
            Daha fazla bilgi için{" "}
            <a href="/gizlilik-politikasi" className="text-purple-600 font-medium">
              Gizlilik Politikamızı
            </a>{" "}
            inceleyebilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
