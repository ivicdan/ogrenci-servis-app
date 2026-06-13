"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface KvkkDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KvkkDialog({ open, onClose }: KvkkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Kişisel Verilerin Korunması Hakkında Aydınlatma Metni</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto text-sm text-gray-700 space-y-4 pr-1">
          <p className="text-xs text-gray-500 font-medium">6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmıştır.</p>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">1. Veri Sorumlusu</h3>
            <p>Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 10. maddesi uyarınca, sistemimize kayıtlı firma, şoför ve velilerin kişisel verilerinin işlenmesine ilişkin bilgi vermek amacıyla hazırlanmıştır. Veri sorumlusu, sistemde kayıtlı servis firmasıdır.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">2. İşlenen Kişisel Veriler</h3>
            <p>Sisteme kayıt ve hizmet sürecinde aşağıdaki kişisel verileriniz işlenmektedir:</p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-gray-600">
              <li>Kimlik bilgileri: Ad, soyad, TC kimlik numarası</li>
              <li>İletişim bilgileri: Cep telefonu numarası, adres</li>
              <li>Öğrenci bilgileri: Ad, soyad, TC kimlik no, okul adı, sınıf, doğum tarihi, öğretmen adı</li>
              <li>Araç bilgileri: Plaka numarası</li>
              <li>Finansal bilgiler: IBAN numarası, ödeme bilgileri</li>
              <li>Konum bilgileri: Durak adresleri, güzergah bilgileri</li>
              <li>İşlem bilgileri: Servis devamsızlıkları, yoklama kayıtları</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">3. Kişisel Verilerin İşlenme Amaçları</h3>
            <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-gray-600">
              <li>Öğrenci servis hizmetinin planlanması ve yürütülmesi</li>
              <li>Güzergah ve durak yönetiminin sağlanması</li>
              <li>Devamsızlık ve yoklama takibinin yapılması</li>
              <li>Veli-şoför iletişiminin kolaylaştırılması</li>
              <li>Ödeme işlemlerinin takibi ve yönetimi</li>
              <li>Sistemin güvenli ve düzenli işletilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">4. Kişisel Verilerin Aktarılması</h3>
            <p>Kişisel verileriniz; hizmetin yürütülmesi amacıyla sistem üzerindeki ilgili taraflarla (firma, şoför, veli) paylaşılmaktadır. Verileriniz, KVKK'nın 8. ve 9. maddeleri kapsamındaki koşullar dışında üçüncü kişilerle paylaşılmamaktadır. Teknik altyapı sağlayıcıları (sunucu/bulut hizmetleri) ile gizlilik sözleşmeleri çerçevesinde paylaşım yapılabilir.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">5. Veri Saklama Süresi</h3>
            <p>Kişisel verileriniz, hizmet ilişkisinin devam ettiği süre boyunca ve ilgili mevzuatta öngörülen yasal süreler boyunca saklanmaktadır. Hizmet ilişkisinin sona ermesinin ardından yasal zorunluluklar kapsamında belirlenen süre kadar saklandıktan sonra silinmekte veya anonim hale getirilmektedir.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">6. KVKK Kapsamındaki Haklarınız</h3>
            <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-gray-600">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">7. Başvuru Yöntemi</h3>
            <p>Yukarıda belirtilen haklarınızı kullanmak için sisteme kayıtlı e-posta adresiniz veya iletişim kanallarımız aracılığıyla veri sorumlusuna başvurabilirsiniz. Başvurularınız 30 gün içinde yanıtlanacaktır.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">8. Onay</h3>
            <p>Bu metni okuyarak sisteme kaydolmanız, kişisel verilerinizin yukarıda açıklanan kapsamda işlenmesine açık rıza verdiğiniz anlamına gelmektedir.</p>
          </section>
        </div>

        <Button onClick={onClose} className="mt-4 bg-blue-600 hover:bg-blue-700 w-full">
          Anladım, Kapat
        </Button>
      </DialogContent>
    </Dialog>
  );
}
