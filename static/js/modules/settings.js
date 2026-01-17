import { Storage } from './storage.js';
import { Mask } from './utils.js';

export const SettingsController = {
    sigCanvas: null,
    sigCtx: null,

    render() {
        const s = Storage.getSettings();
        document.getElementById('s-nome').value = s.nome || '';
        document.getElementById('s-crm').value = s.crm || '';
        document.getElementById('s-endereco').value = s.endereco || '';
        document.getElementById('s-telefone').value = s.telefone || '';

        // Add Listeners
        document.querySelectorAll('#view-settings input').forEach(el => {
            const newEl = el.cloneNode(true);
            newEl.value = el.value;
            el.parentNode.replaceChild(newEl, el);

            if(newEl.id === 's-telefone') {
                newEl.addEventListener('input', (e) => e.target.value = Mask.phone(e.target.value));
            }
        });

        // Render signature preview
        const container = document.querySelector('#view-settings .max-w-2xl');
        const oldPreview = document.getElementById('signature-preview');
        if(oldPreview) oldPreview.remove();

        if (s.signature) {
            const img = document.createElement('img');
            img.src = s.signature;
            img.id = 'signature-preview';
            img.className = 'mt-4 border rounded max-h-24';
            container.appendChild(img);
        }
    },

    save() {
        const settings = {
            nome: document.getElementById('s-nome').value,
            crm: document.getElementById('s-crm').value,
            endereco: document.getElementById('s-endereco').value,
            telefone: document.getElementById('s-telefone').value,
            signature: Storage.getSettings().signature // preserve signature
        };
        Storage.saveSettings(settings);
        alert('Configurações salvas!');
    },

    // Signature Modal
    openSignatureModal() {
        const modal = document.getElementById('signature-modal');
        const canvas = document.getElementById('signature-canvas');
        this.sigCanvas = canvas;
        this.sigCtx = canvas.getContext('2d');

        this.sigCtx.clearRect(0, 0, canvas.width, canvas.height);
        this.sigCtx.lineWidth = 2;
        this.sigCtx.strokeStyle = '#000';

        let drawing = false;
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        canvas.onmousedown = (e) => { drawing = true; this.sigCtx.beginPath(); this.sigCtx.moveTo(getPos(e).x, getPos(e).y); };
        canvas.onmousemove = (e) => { if(drawing) { this.sigCtx.lineTo(getPos(e).x, getPos(e).y); this.sigCtx.stroke(); } };
        canvas.onmouseup = () => { drawing = false; };

        modal.classList.remove('hidden');
    },

    clearSignature() {
        this.sigCtx.clearRect(0, 0, this.sigCanvas.width, this.sigCanvas.height);
    },

    saveSignature() {
        const dataUrl = this.sigCanvas.toDataURL('image/png');
        const s = Storage.getSettings();
        s.signature = dataUrl;
        Storage.saveSettings(s);
        document.getElementById('signature-modal').classList.add('hidden');
        this.render();
        alert('Assinatura salva!');
    }
};
