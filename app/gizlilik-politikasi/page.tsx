export const metadata = {
  title: "Gizlilik Politikası — Online Öğrenci Servisi",
  description: "Online Öğrenci Servisi (ogrenciservisi.online) mobil ve web uygulamaları gizlilik politikası ve KVKK aydınlatma metni.",
};

export default function GizlilikPolitikasi() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 text-sm text-gray-700 space-y-6 leading-relaxed">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Gizlilik Politikası</h1>
          <p className="text-xs text-gray-500">
            Online Öğrenci Servisi (ogrenciservisi.online) — Son güncelleme: 2026
          </p>
        </div>

        <section>
          <p>
            Bu gizlilik politikası, <strong>Online Öğrenci Servisi</strong> mobil uygulamaları
            (Veli ve Şoför uygulamaları) ile ogrenciservisi.online web sitesinin ("Hizmet")
            kullanıcılarına ait kişisel verilerin nasıl toplandığını, kullanıldığını ve
            korunduğunu açıklar. Hizmeti kullanarak bu politikayı kabul etmiş olursunuz.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">1. Veri Sorumlusu</h2>
          <p>
            Hizmet üzerinde kayıtlı olan servis firması veri sorumlusudur. Uygulama, firmaların
            öğrenci servis hizmetini yönetebilmesi; velilerin çocuklarının servis durumunu takip
            edebilmesi; şoförlerin güzergahlarını yürütebilmesi için bir altyapı sağlar.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">2. Toplanan Bilgiler</h2>
          <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
            <li><strong>Kimlik bilgileri:</strong> Ad, soyad, TC kimlik numarası (veli ve öğrenci için kayıt/doğrulama amacıyla)</li>
            <li><strong>İletişim bilgileri:</strong> Cep telefonu numarası, adres</li>
            <li><strong>Öğrenci bilgileri:</strong> Ad, soyad, doğum tarihi, okul, sınıf, öğretmen, öğrenim saatleri, öğrenim kademesi</li>
            <li><strong>Konum bilgileri:</strong> Öğrencinin alış/bırakış adresi (koordinat), şoförün sefer sırasındaki anlık konumu</li>
            <li><strong>Araç bilgileri:</strong> Plaka numarası</li>
            <li><strong>Finansal bilgiler:</strong> Servis ücreti, ödeme bildirimleri, IBAN (ödeme takibi amacıyla; uygulama içinden ödeme alınmaz)</li>
            <li><strong>Kullanım bilgileri:</strong> Devamsızlık bildirimleri, yoklama (öğrenci alındı/inmedi) kayıtları, mesajlar ve bildirimler</li>
            <li><strong>Cihaz bilgileri:</strong> Bildirim gönderebilmek için anonim bir push bildirim belirteci (token)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">3. Konum Verisinin Kullanımı</h2>
          <p>
            <strong>Veli uygulaması</strong> yalnızca kullanıcı harita üzerinde alış noktasını
            belirlerken veya "Konumumu Bul" özelliğini kullandığında, uygulama açıkken tek seferlik
            konum erişimi ister. <strong>Şoför uygulaması</strong>, yalnızca şoför bir seferi
            "Başlat" olarak işaretlediği sürece (sefer aktifken) konumunu, o sefere kayıtlı
            öğrencilerin velilerine servisin yaklaştığını göstermek amacıyla arka planda da
            paylaşır. Sefer bitirildiğinde veya durdurulduğunda konum paylaşımı sona erer. Konum
            verisi başka hiçbir amaçla kullanılmaz ve reklam amacıyla işlenmez.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">4. Bilgilerin Kullanım Amaçları</h2>
          <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
            <li>Öğrenci servis hizmetinin planlanması ve yürütülmesi</li>
            <li>Güzergah ve durak yönetiminin sağlanması</li>
            <li>Devamsızlık ve yoklama takibinin yapılması</li>
            <li>Veli, şoför ve firma arasındaki iletişimin sağlanması (mesaj ve bildirimler)</li>
            <li>Ödeme bildirimlerinin takibi</li>
            <li>Hizmetin güvenli, doğru ve düzenli işletilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">5. Bilgilerin Paylaşılması</h2>
          <p>
            Kişisel verileriniz yalnızca hizmetin işleyişi için gerekli taraflarla (kayıtlı olduğunuz
            servis firması, öğrencinize atanan şoför, veli) sınırlı biçimde paylaşılır. Verileriniz
            hiçbir şekilde üçüncü taraflara satılmaz veya reklam amacıyla paylaşılmaz. Hizmetin
            teknik altyapısı için aşağıdaki alt yüklenicilerle sınırlı, teknik amaçlı veri paylaşımı
            yapılır:
          </p>
          <ul className="list-disc pl-5 space-y-0.5 text-gray-600 mt-1">
            <li>Sunucu ve veritabanı barındırma hizmeti (Railway)</li>
            <li>Konum/harita gösterimi (Google Maps)</li>
            <li>Push bildirim gönderimi (Expo / Google Firebase Cloud Messaging)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">6. Veri Saklama ve Silme</h2>
          <p>
            Verileriniz, hizmet ilişkisi devam ettiği sürece saklanır. Hesabınızın veya öğrenci
            kaydınızın kaldırılmasını talep etmek için aşağıdaki iletişim adresinden bize
            ulaşabilirsiniz; talebiniz makul bir süre içinde değerlendirilip yasal saklama
            yükümlülükleri dışındaki veriler silinir.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">7. KVKK Kapsamındaki Haklarınız</h2>
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 11. maddesi uyarınca:</p>
          <ul className="list-disc pl-5 space-y-0.5 text-gray-600 mt-1">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içi/yurt dışı aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Kanuni şartlar çerçevesinde silinmesini/yok edilmesini isteme</li>
            <li>Otomatik sistemlerle analiz sonucu aleyhinize bir sonuca itiraz etme</li>
            <li>Kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">8. Çocukların Verileri</h2>
          <p>
            Uygulama hesapları yalnızca yetişkin veliler ve şoförler tarafından oluşturulur;
            uygulama çocuklar tarafından doğrudan kullanılmak üzere tasarlanmamıştır. Öğrenciye
            ait bilgiler, velinin açık rızası ve servis hizmetinin verilebilmesi amacıyla, veli
            hesabı üzerinden veli tarafından girilir.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">9. Veri Güvenliği</h2>
          <p>
            Şifreleriniz geri döndürülemez biçimde şifrelenerek saklanır, veri iletimi HTTPS ile
            şifrelenir. Yetkisiz erişimi önlemek için makul teknik ve idari önlemler alınmaktadır.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">10. İletişim</h2>
          <p>
            Bu politika veya kişisel verilerinizle ilgili sorularınız için:{" "}
            <a href="mailto:timeshare59@gmail.com" className="text-purple-600 font-medium">
              timeshare59@gmail.com
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">11. Değişiklikler</h2>
          <p>
            Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler bu sayfa
            üzerinden yayınlanır.
          </p>
        </section>
      </div>
    </div>
  );
}
