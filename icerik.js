const YZ_Analizci = {
    ortalamaHesapla: (dizi) => dizi.reduce((a, b) => a + b, 0) / dizi.length,

    standartSapmaHesapla: (dizi, ortalama) => {
        return Math.sqrt(dizi.map(x => Math.pow(x - ortalama, 2)).reduce((a, b) => a + b) / dizi.length);
    },

    kelimeAnalizi: (metin, liste) => {
        let tespitSayisi = 0;
        let bulunanlar = [];
        const kucukMetin = metin.toLowerCase();

        liste.forEach(kalip => {
            if (kucukMetin.includes(kalip)) {
                tespitSayisi++;
                bulunanlar.push(kalip);
            }
        });
        return { sayi: tespitSayisi, kelimeler: bulunanlar.slice(0, 3) };
    },

    ozelKarakterAnalizi: (metin) => {
        const maddeIsaretleri = (metin.match(/^[-*•] /gm) || []).length;
        return maddeIsaretleri;
    },

    yerelAnalizEt: (metin) => {
        if (!metin || metin.length < 50) {
            return {
                skor: 1,
                nedenler: [],
                detaylar: ["metin çok kısa (doğal/insan yazımı)"]
            };
        }

        let skor = 0;
        const nedenler = [];
        const detaylar = [];

        const cumleler = metin.split(/[.!?]+/).filter(c => c.trim().length > 0);
        const kelimeler = metin.trim().split(/\s+/);

        const cumleUzunluklari = cumleler.map(c => c.trim().split(/\s+/).length);
        const ortalamaUzunluk = YZ_Analizci.ortalamaHesapla(cumleUzunluklari);
        const stdSapma = YZ_Analizci.standartSapmaHesapla(cumleUzunluklari, ortalamaUzunluk);
        const varyasyonKatsayisi = stdSapma / ortalamaUzunluk;

        if (cumleler.length > 3) {
            if (varyasyonKatsayisi < 0.35) {
                skor += 20;
                nedenler.push("robotik cümle ritmi");
            } else if (varyasyonKatsayisi > 0.6) {
                detaylar.push("doğal cümle akışı");
            }
        }

        const yzKaliplari = [
            "sonuç olarak", "özetle", "özetlemek gerekirse", "buna ek olarak", "diğer taraftan",
            "bir başka deyişle", "öncelikle şunu belirtmeliyim", "genel hatlarıyla",
            "ifade etmek gerekir", "şunu söyleyebilirim", "ele aldığımızda",
            "önemli rol oynamaktadır", "göz ardı edilmemelidir", "şüphesiz ki", "kaçınılmazdır",
            "bünyesinde barındırır", "söz konusudur", "bağlamında", "perspektifinden",
            "büyük önem arz etmektedir", "altını çizmek gerekir", "ne var ki", "mamafih"
        ];

        const kalipSonuc = YZ_Analizci.kelimeAnalizi(metin, yzKaliplari);
        if (kalipSonuc.sayi > 0) {
            const kalipPuani = Math.min(45, kalipSonuc.sayi * 10);
            skor += kalipPuani;
            nedenler.push(`yz kalıpları: "${kalipSonuc.kelimeler.join('", "')}"...`);
        }

        const dengeKaliplari = [
            "bir yandan", "diğer yandan", "her ne kadar", "olsa da", "bununla birlikte",
            "rağmen", "öte yandan"
        ];
        const dengeSonuc = YZ_Analizci.kelimeAnalizi(metin, dengeKaliplari);
        if (dengeSonuc.sayi >= 2) {
            skor += 15;
            nedenler.push("yapay dengeleyici dil kullanımı");
        }

        const bkzSayisi = (metin.match(/\(bkz:.*?\)/g) || []).length + (metin.match(/`.*?`/g) || []).length;
        if (bkzSayisi > 0) {
            skor -= 20;
            detaylar.push("sözlük formatı kullanımı (bkz/link)");
        }

        const ortalamaKelimeHarf = metin.length / kelimeler.length;
        if (ortalamaKelimeHarf > 7) {
            skor += 10;
            nedenler.push("aşırı resmi/didaktik dil");
        }

        const maddeSayisi = YZ_Analizci.ozelKarakterAnalizi(metin);
        if (maddeSayisi > 2 && metin.length < 500) {
            skor += 15;
            nedenler.push("yoğun liste kullanımı");
        }

        const benSayisi = (metin.match(/\b(ben|benim|bana|kendim|bence|bana göre)\b/gi) || []).length;
        if (benSayisi > 1) {
            skor -= 15;
            detaylar.push("kişisel deneyim aktarımı");
        }

        let toplamSkor = Math.max(0, Math.min(99, skor));

        if (metin.length < 150 && kalipSonuc.sayi === 0) {
            toplamSkor = Math.min(toplamSkor, 30);
            detaylar.push("kısa metin (düşük risk)");
        }

        return {
            skor: Math.round(toplamSkor),
            nedenler: nedenler.length > 0 ? nedenler : ["belirgin yz izi bulunamadı."],
            detaylar: detaylar
        };
    }
};

const Arayuz = {
    butonEkle: () => {
        const tarihLinkleri = document.querySelectorAll('a.entry-date.permalink');

        tarihLinkleri.forEach(link => {
            if (link.querySelector('.yz-tespit-butonu')) return;

            const buton = document.createElement('span');
            buton.className = 'yz-tespit-butonu';
            buton.innerHTML = Simgeler.analizEt;
            buton.title = "yz analizi";

            buton.onclick = (e) => Islevler.butonaTikla(e, buton, link);

            link.prepend(buton);
        });
    },

    sonucGoster: (buton, sonuc, kaynak = "yerel") => {
        let ikon = Simgeler.insan;

        if (sonuc.skor >= 70) {
            ikon = Simgeler.yzTespitEdildi;
        } else if (sonuc.skor >= 40) {
            ikon = Simgeler.supheli;
        }

        buton.innerHTML = ikon;
        buton.title = `yz skoru: %${sonuc.skor} (${kaynak})`;

        buton.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            Arayuz.dropdownAc(buton, sonuc, kaynak);
        };
    },

    dropdownAc: (buton, sonuc, kaynak) => {
        const mevcutDropdown = document.querySelector('.yz-sonuc-dropdown');
        if (mevcutDropdown) mevcutDropdown.remove();

        const dropdown = document.createElement('div');
        dropdown.className = 'yz-sonuc-dropdown';

        let durumMetni = "insan yazımı";
        let renkClass = "yz-dusuk";

        if (sonuc.skor >= 40 && sonuc.skor < 70) {
            durumMetni = "şüpheli / karma";
            renkClass = "yz-orta";
        } else if (sonuc.skor >= 70) {
            durumMetni = "yz / bot yazımı";
            renkClass = "yz-yuksek";
        }

        let nedenlerHtml = "";
        if (sonuc.nedenler) {
            sonuc.nedenler.forEach(neden => nedenlerHtml += `<li class="negatif">• ${neden}</li>`);
        }
        if (sonuc.detaylar) {
            sonuc.detaylar.forEach(detay => nedenlerHtml += `<li class="pozitif">• ${detay}</li>`);
        }

        const motorBilgisi = sonuc.modelAdi ? sonuc.modelAdi : (kaynak === "api" ? "bilinmeyen api" : "yerel analiz");

        dropdown.innerHTML = `
            <div class="yz-sonuc-baslik ${renkClass}">
                <span>${durumMetni}</span>
                <span>%${sonuc.skor}</span>
            </div>
            <div class="yz-skor-cubugu">
                <div class="yz-skor-doluluk ${renkClass}" style="width: ${sonuc.skor}%"></div>
            </div>
            <div class="yz-analiz-basligi">analiz bulguları (${motorBilgisi}):</div>
            <ul class="yz-detay-listesi">
                ${nedenlerHtml}
            </ul>
        `;

        document.body.appendChild(dropdown);

        const rect = buton.getBoundingClientRect();
        dropdown.style.position = 'absolute';
        dropdown.style.top = (window.scrollY + rect.bottom + 8) + 'px';
        dropdown.style.left = (window.scrollX + rect.left) + 'px';

        const kapatmaDinleyicisi = (e) => {
            if (!dropdown.contains(e.target) && !buton.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', kapatmaDinleyicisi);
            }
        };

        setTimeout(() => document.addEventListener('click', kapatmaDinleyicisi), 0);
    }
};

const Islevler = {
    butonaTikla: (e, buton, referansEleman) => {
        e.stopPropagation();
        e.preventDefault();

        const entryLi = referansEleman.closest('li');
        const entryIcerik = entryLi ? entryLi.querySelector('.content')?.innerText : null;

        if (!entryIcerik) return;

        buton.innerHTML = Simgeler.yukleniyor;
        buton.querySelector('svg').classList.add('yz-dondur');

        try {
            chrome.runtime.sendMessage({
                tur: 'GEMINI_ANALIZ',
                metin: entryIcerik
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("background bağlantı hatası:", chrome.runtime.lastError.message);
                    const sonuc = YZ_Analizci.yerelAnalizEt(entryIcerik);
                    Arayuz.sonucGoster(buton, sonuc, "yerel (bağlantı hatası)");
                    return;
                }

                if (response && response.basarili) {
                    Arayuz.sonucGoster(buton, response.veri, "api");
                } else if (response && (response.hata === 'NO_KEY' || response.hata === 'NO_ACTIVE_KEY' || response.hata === 'NO_CONFIG')) {
                    console.log("api kullanılmıyor, yerel motora geçiliyor.");
                    const sonuc = YZ_Analizci.yerelAnalizEt(entryIcerik);
                    Arayuz.sonucGoster(buton, sonuc, "yerel");
                } else {
                    console.error('api hatası:', response?.hata);
                    const sonuc = YZ_Analizci.yerelAnalizEt(entryIcerik);
                    Arayuz.sonucGoster(buton, sonuc, "yerel (api hatası)");
                }
            });
        } catch (e) {
            console.error("uzantı bağlamı hatası:", e);
            const sonuc = YZ_Analizci.yerelAnalizEt(entryIcerik);
            Arayuz.sonucGoster(buton, sonuc, "yerel (sayfayı yenileyin)");
        }
    }
};

const gozlemci = new MutationObserver((mutations) => {
    Arayuz.butonEkle();
});

gozlemci.observe(document.body, { childList: true, subtree: true });

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Arayuz.butonEkle);
} else {
    Arayuz.butonEkle();
}
