chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.tur === 'GEMINI_ANALIZ') {
        const metin = request.metin;

        chrome.storage.local.get(['kayitliModeller'], async (result) => {
            let modeller = result.kayitliModeller;

            if (!modeller || modeller.length === 0) {
                sendResponse({ basarili: false, hata: 'NO_CONFIG' });
                return;
            }

            const denenecekModeller = modeller.filter(m => m.aktif && m.apiKey && m.apiKey.length > 5);

            if (denenecekModeller.length === 0) {
                sendResponse({ basarili: false, hata: 'NO_ACTIVE_KEY' });
                return;
            }

            let enSonHata = null;

            for (const model of denenecekModeller) {
                try {
                    console.log(`model deneniyor: ${model.ad} (${model.id})`);
                    const sonuc = await modelIleAnalizEt(model, metin);

                    let guncelAd = model.ad + " " + (model.badge || "");

                    if (model.id === 'groq') guncelAd = 'llama 3.3';
                    if (model.id === 'gemini') guncelAd = 'gemini 2.5';

                    sonuc.modelAdi = guncelAd;
                    sendResponse({ basarili: true, veri: sonuc });
                    return;

                } catch (error) {
                    console.error(`${model.ad} başarısız:`, error);
                    enSonHata = error.message;
                }
            }

            sendResponse({ basarili: false, hata: 'ALL_FAILED', sonHata: enSonHata });
        });

        return true;
    }
});

async function modelIleAnalizEt(modelAyar, metin) {
    if (modelAyar.id === 'gemini') {
        return await geminiAnaliz(modelAyar.apiKey, metin);
    } else if (modelAyar.id === 'groq') {
        return await groqAnaliz(modelAyar.apiKey, metin);
    }
    throw new Error("bilinmeyen model sağlayıcısı");
}

async function geminiAnaliz(apiKey, metin) {
    return await geminiCall(apiKey, metin, 'gemini-2.5-flash');
}

async function geminiCall(apiKey, metin, model, denemeSayisi = 0) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const prompt = getSystemPrompt(metin);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            if ((response.status === 503 || response.status === 500) && denemeSayisi < 3) {
                const beklemeSuresi = 1000 * Math.pow(2, denemeSayisi);
                console.log(`gemini ${response.status} hatası (deneme ${denemeSayisi + 1}/3), ${beklemeSuresi}ms bekleniyor...`);
                await new Promise(res => setTimeout(res, beklemeSuresi));
                return geminiCall(apiKey, metin, model, denemeSayisi + 1);
            }
            throw new Error(`gemini api: ${response.status}`);
        }

        const data = await response.json();
        const metinCevap = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!metinCevap) throw new Error("boş yanıt");

        return parseJson(metinCevap);
    } catch (e) {
        throw e;
    }
}

async function groqAnaliz(apiKey, metin) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const prompt = getSystemPrompt(metin);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) throw new Error(`groq api: ${response.status}`);
    const data = await response.json();
    const metinCevap = data.choices?.[0]?.message?.content;
    if (!metinCevap) throw new Error("boş yanıt");

    return parseJson(metinCevap);
}

function getSystemPrompt(metin) {
    return `
aşağıdaki ekşi sözlük entry'sini analiz et. yazarın bir yapay zeka olup olmadığını veya yapay zeka desteği alıp almadığını tespit et.
ekşi sözlük formatına (bkz kullanımı, link yapısı vb.) dikkat et.
sadece geçerli bir json formatında cevap ver.
json şeması:
{
    "skor": 0-100 (100=yz),
    "nedenler": ["yz belirtisi 1", "yz belirtisi 2"],
    "detaylar": ["insan belirtisi 1"]
}
analiz edilecek metin:
"${metin}"
    `;
}

function parseJson(raw) {
    const temiz = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(temiz);
}
