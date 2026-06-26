import Link from "next/link";
import { Bus, Building2, User, Shield, Bell, MapPin, Smartphone, ChevronRight, CheckCircle, MessageCircle, Mail, Phone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-2">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Öğrenci Servis</p>
              <p className="text-xs text-gray-400 leading-tight">Yönetim Sistemi</p>
            </div>
          </div>
          <Link
            href="#giris"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Giriş Yap <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <CheckCircle className="w-4 h-4 text-green-300" />
            <span className="text-sm font-medium">iOS · Android · HarmonyOS uyumlu</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Öğrenci Servisini<br />
            <span className="text-yellow-300">Dijital Yönetin</span>
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto mb-8">
            Servis firmalarına, şoförlere ve velilere özel ayrı paneller.
            Gerçek zamanlı takip, anlık bildirimler, kolay yönetim.
          </p>
          <Link
            href="#giris"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-7 py-3.5 rounded-2xl text-base shadow-lg transition-all"
          >
            Hemen Başla <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Özellikler */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Neden Öğrenci Servis Sistemi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="bg-blue-100 rounded-xl p-3 w-fit mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Gerçek Zamanlı Takip</h3>
              <p className="text-sm text-gray-500">Servis nerede? Öğrenciniz bindi mi? Anlık konumu ve yoklama durumunu anında görün.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="bg-green-100 rounded-xl p-3 w-fit mb-4">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Anlık Bildirimler</h3>
              <p className="text-sm text-gray-500">Çocuğunuz servise bindi, okula ulaştı, eve döndü — her adımda anlık bildirim alın.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="bg-purple-100 rounded-xl p-3 w-fit mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Güvenli & Kolay</h3>
              <p className="text-sm text-gray-500">Her kullanıcı tipi için ayrı, güvenli panel. Firma, şoför ve veli birbirini görmez.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Giriş Panelleri */}
      <section id="giris" className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">Paneline Giriş Yap</h2>
          <p className="text-center text-gray-500 text-sm mb-10">Rolünüze uygun paneli seçin ve telefona ekleyin.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Firma */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 flex flex-col">
              <div className="bg-blue-600 rounded-2xl p-3 w-fit mb-4 shadow">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Firma Paneli</h3>
              <p className="text-sm text-gray-600 mb-2">Servis firması yöneticisi</p>
              <ul className="text-xs text-gray-500 space-y-1 mb-5 flex-1">
                <li>✓ Şoför & öğrenci yönetimi</li>
                <li>✓ Güzergah planlama</li>
                <li>✓ Ödeme takibi & onay</li>
                <li>✓ Toplu mesaj gönderimi</li>
              </ul>
              <Link
                href="/firma/giris"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-xl transition-all text-sm"
              >
                Firma Girişi <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/firma/kayit"
                className="mt-2 text-center text-xs text-blue-600 hover:underline"
              >
                Yeni firma kaydı →
              </Link>
            </div>

            {/* Şoför */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 flex flex-col">
              <div className="bg-green-600 rounded-2xl p-3 w-fit mb-4 shadow">
                <Bus className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Şoför Paneli</h3>
              <p className="text-sm text-gray-600 mb-2">Servis şoförü</p>
              <ul className="text-xs text-gray-500 space-y-1 mb-5 flex-1">
                <li>✓ Güzergah & öğrenci listesi</li>
                <li>✓ Yoklama işaretleme</li>
                <li>✓ Veli bildirim yönetimi</li>
                <li>✓ Konum paylaşımı</li>
              </ul>
              <Link
                href="/sofor/giris"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-xl transition-all text-sm"
              >
                Şoför Girişi <ChevronRight className="w-4 h-4" />
              </Link>
              <p className="mt-2 text-center text-xs text-gray-400">Şoför Giriş Kodu firmanız tarafından verilir.</p>
            </div>

            {/* Veli */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 flex flex-col">
              <div className="bg-purple-600 rounded-2xl p-3 w-fit mb-4 shadow">
                <User className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Veli Paneli</h3>
              <p className="text-sm text-gray-600 mb-2">Öğrenci velisi</p>
              <ul className="text-xs text-gray-500 space-y-1 mb-5 flex-1">
                <li>✓ Servis takibi & bildirimler</li>
                <li>✓ Devamsızlık bildirimi</li>
                <li>✓ Ödeme yönetimi</li>
                <li>✓ Öğrenci bilgileri güncelleme</li>
              </ul>
              <Link
                href="/veli/giris"
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-3 rounded-xl transition-all text-sm"
              >
                Veli Girişi <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/veli/kayit"
                className="mt-2 text-center text-xs text-purple-600 hover:underline"
              >
                Kayıt ol →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Telefona Ekle */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 rounded-xl p-2.5">
              <Smartphone className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Uygulamayı Telefona Ekle</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Uygulama mağazasına gerek yok. Tarayıcınızdan direkt ana ekrana ekleyin.
            iOS, Android ve HarmonyOS&apos;ta çalışır.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gray-900 text-white rounded-lg px-2 py-0.5 text-xs font-bold">iOS</div>
                <span className="text-sm font-semibold text-gray-700">iPhone / iPad</span>
              </div>
              <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
                <li>Kendi panelinizin linkini Safari&apos;de açın</li>
                <li>Alt menüdeki <strong>Paylaş</strong> düğmesine basın</li>
                <li><strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin</li>
                <li><strong>Ekle</strong> butonuna basın</li>
              </ol>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-600 text-white rounded-lg px-2 py-0.5 text-xs font-bold">Android</div>
                <span className="text-sm font-semibold text-gray-700">Android Telefon</span>
              </div>
              <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
                <li>Kendi panelinizin linkini Chrome&apos;da açın</li>
                <li>Sağ üstteki <strong>3 nokta</strong> menüsüne basın</li>
                <li><strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin</li>
                <li><strong>Ekle</strong> butonuna basın</li>
              </ol>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-600 text-white rounded-lg px-2 py-0.5 text-xs font-bold">Huawei</div>
                <span className="text-sm font-semibold text-gray-700">HarmonyOS</span>
              </div>
              <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
                <li>Kendi panelinizin linkini tarayıcıda açın</li>
                <li>Sağ üstteki <strong>menüye</strong> basın</li>
                <li><strong>"Kısayol Ekle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçin</li>
                <li><strong>Tamam</strong> butonuna basın</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800 font-medium mb-2">Her kullanıcı sadece kendi panelini eklesin:</p>
            <div className="space-y-1.5 text-xs text-blue-700">
              <p><strong>Firmalar:</strong> <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">/firma/giris</span> adresini Ana Ekrana Ekle</p>
              <p><strong>Şoförler:</strong> <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">/sofor/giris</span> adresini Ana Ekrana Ekle</p>
              <p><strong>Veliler:</strong> <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">/veli/giris</span> adresini Ana Ekrana Ekle</p>
            </div>
          </div>
        </div>
      </section>

      {/* İletişim */}
      <section id="iletisim" className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">İletişim</h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            Sorularınız, kayıt işlemleriniz veya destek için bize ulaşın.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <a
              href="https://wa.me/905444475096"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl p-5 transition-colors group"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-green-600 transition-colors">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">WhatsApp</p>
                <p className="text-green-700 font-mono text-base font-bold">0544 447 50 96</p>
                <p className="text-xs text-gray-500 mt-0.5">Hızlı yanıt için WhatsApp tercih edin</p>
              </div>
            </a>

            <a
              href="mailto:info@ogrenciservisi.online"
              className="flex items-center gap-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl p-5 transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-blue-700 transition-colors">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">E-posta</p>
                <p className="text-blue-700 font-medium text-sm">info@ogrenciservisi.online</p>
                <p className="text-xs text-gray-500 mt-0.5">Evrak ve resmi talepler için</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Öğrenci Servis Yönetim Sistemi</span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 mb-3">
            <a href="https://wa.me/905444475096" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition-colors">
              <Phone className="w-3.5 h-3.5" /> 0544 447 50 96
            </a>
            <span className="text-gray-700">·</span>
            <a href="mailto:info@ogrenciservisi.online"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors">
              <Mail className="w-3.5 h-3.5" /> info@ogrenciservisi.online
            </a>
          </div>
          <p className="text-xs text-gray-600">Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
