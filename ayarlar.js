const VarsayilanModeller = [
    {
        id: 'gemini',
        ad: 'gemini',
        badge: '2.5 flash',
        aktif: true,
        apiKey: '',
        placeholder: 'gemini api anahtarı...',
        link: 'https://aistudio.google.com/app/apikey'
    },
    {
        id: 'groq',
        ad: 'llama',
        badge: '3.3 70b versatile',
        aktif: true,
        apiKey: '',
        placeholder: 'groq api anahtarı (gsk_...)',
        link: 'https://console.groq.com/keys'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    yukleVeListele();

    document.getElementById('kaydet').addEventListener('click', kaydet);
});

function yukleVeListele() {
    chrome.storage.local.get(['kayitliModeller', 'geminiApiAnahtari'], (result) => {
        let modeller = result.kayitliModeller;

        if (!modeller) {
            modeller = JSON.parse(JSON.stringify(VarsayilanModeller));
            if (result.geminiApiAnahtari) {
                const geminiModel = modeller.find(m => m.id === 'gemini');
                if (geminiModel) geminiModel.apiKey = result.geminiApiAnahtari;
            }
        } else {
            VarsayilanModeller.forEach(varsayilan => {
                const mevcutModel = modeller.find(m => m.id === varsayilan.id);
                if (!mevcutModel) {
                    modeller.push(varsayilan);
                } else {
                    mevcutModel.ad = varsayilan.ad;
                    mevcutModel.badge = varsayilan.badge;
                    mevcutModel.placeholder = varsayilan.placeholder;
                    mevcutModel.link = varsayilan.link;
                }
            });
        }

        renderListe(modeller);
    });
}

function renderListe(modeller) {
    const konteyner = document.getElementById('modelListesi');
    konteyner.innerHTML = '';

    modeller.forEach((model, index) => {
        const kart = document.createElement('div');
        kart.className = 'model-karti';
        kart.draggable = true;
        kart.dataset.index = index;
        kart.dataset.id = model.id;

        kart.innerHTML = `
            <div class="kart-ust">
                <div class="kart-baslik-grup">
                    <div class="tutamac" title="sıralamayı değiştir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </div>
                    <span class="model-adi">${model.ad}</span>
                    ${model.badge ? `<span class="badge">${model.badge}</span>` : ''}
                </div>
                <div class="aktif-switch">
                    <input type="checkbox" class="model-aktif" ${model.aktif ? 'checked' : ''}>
                </div>
            </div>
            <div class="api-input-grup">
                <input type="text" class="model-key" value="${model.apiKey || ''}" placeholder="${model.placeholder}">
                ${model.link ? `<a href="${model.link}" target="_blank" class="api-link">anahtarı al</a>` : ''}
            </div>
        `;

        kart.addEventListener('dragstart', handleDragStart);
        kart.addEventListener('dragover', handleDragOver);
        kart.addEventListener('drop', handleDrop);
        kart.addEventListener('dragenter', handleDragEnter);
        kart.addEventListener('dragleave', handleDragLeave);

        konteyner.appendChild(kart);
    });
}

let suruklenenOge = null;

function handleDragStart(e) {
    suruklenenOge = this;
    this.classList.add('surukleniyor');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    suruklenenOge.classList.remove('surukleniyor');

    if (suruklenenOge !== this) {
        const konteyner = document.getElementById('modelListesi');
        const tumKartlar = [...konteyner.querySelectorAll('.model-karti')];
        const suruklenenIndex = tumKartlar.indexOf(suruklenenOge);
        const hedefIndex = tumKartlar.indexOf(this);

        if (suruklenenIndex < hedefIndex) {
            this.after(suruklenenOge);
        } else {
            this.before(suruklenenOge);
        }
    }
    return false;
}

function kaydet() {
    const kartlar = document.querySelectorAll('.model-karti');
    const yeniModeller = [];

    kartlar.forEach(kart => {
        yeniModeller.push({
            id: kart.dataset.id,
            ad: kart.querySelector('.model-adi').innerText,
            badge: kart.querySelector('.badge') ? kart.querySelector('.badge').innerText : '',
            aktif: kart.querySelector('.model-aktif').checked,
            apiKey: kart.querySelector('.model-key').value.trim(),
            placeholder: kart.querySelector('.model-key').placeholder,
            link: kart.querySelector('.api-link') ? kart.querySelector('.api-link').href : ''
        });
    });

    chrome.storage.local.set({ kayitliModeller: yeniModeller }, () => {
        const durum = document.getElementById('durum');
        durum.style.display = 'block';
        setTimeout(() => durum.style.display = 'none', 2000);
    });
}
