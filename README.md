# ![logo](simgeler/simge32.png) yapay entry ifşaatörü

**ekşi sözlük entry'lerinin yapay zeka (chatgpt, claude, gemini, grok vb.) tarafından yazılıp yazılmadığını analiz eden chrome uzantısı.**

## nedir?
bu eklenti, kullanıcıların ekşi sözlük'te okudukları içeriklerin gerçek bir insan tarafından mı yoksa bir yapay zeka modeli tarafından mı yazıldığını anlamalarına yardımcı olur. tarayıcı tabanlı çalışan yerel analiz motoru ve opsiyonel olarak bağlanabilen gelişmiş bulut modelleriyle (gemini, llama) çalışır.

## özellikler
*   **çoklu model desteği:** gemini ve llama yapay zeka sağlayıcılarını entegre edebilirsiniz.
*   **hibrit mimari:** api anahtarı olmasa bile yerel algoritma ile temel düzeyde analiz yapmaya devam eder.
*   **akıllı fallback (zincirleme analiz):** öncelikli modeliniz hata verirse (kota aşımı, sunucu hatası vb.), sistem otomatik olarak sıradaki diğer modele geçer.
*   **sürükle-bırak sıralama:** ayarlar menüsünden model önceliklerini kolayca değiştirebilirsiniz.
*   **gizlilik dostu:** api anahtarlarınız sadece tarayıcınızın yerel hafızasında (`chrome.storage.local`) saklanır, başka bir sunucuya gönderilmez.

## desteklenen modeller
1.  **gemini** - 2.5 flash
2.  **llama** - 3.3 70b versatile

## kurulum ve ayarlar

1.  bu repoyu indirin veya klonlayın.
2.  chrome tarayıcısında `chrome://extensions` adresine gidin. (diğer chromium varyasyonlarında `arc://extensions` gibi tarayıcı adı değişir)
3.  sağ üstteki "**geliştirici modu**"nu açın.
4.  **"paketlenmemiş öğe yükle"** butonuna tıklayın ve indirilen klasörü seçin.

### api anahtarı ekleme
daha hassas sonuçlar almak için ücretsiz api anahtarlarınızı ekleyebilirsiniz:

1.  uzantı simgesine sağ tıklayın ve **"seçenekler"** menüsünü açın.
2.  ilgili modelin anahtar giriş kutusunun yanındaki **"anahtarı al"** linkine tıklayın.
3.  aldığınız anahtarı kutucuğa yapıştırın ve **"kaydet"** butonuna basın.
4.  modelleri sürükleyerek hangisinin önce çalışacağını belirleyebilirsiniz.

## renk kodları

analiz sonuçları renkli bir şekilde gösterilir:

*   🟢 **%0 - %39 (yeşil):** insan yazımı / doğal
*   🟠 **%40 - %69 (turuncu):** şüpheli / karma yapı
*   🔴 **%70 - %100 (kırmızı):** yapay zeka / robot

## ipuçları
*   analiz yapmak için entry tarihinin solundaki simgeye tıklayın.
*   herhangi bir api hatası durumunda sistem otomatik olarak **yerel motor** ile analiz yapar.
*   api kullanmak istemiyorsanız anahtar girmeyin ya da kutulardaki tikleri kaldırın.
