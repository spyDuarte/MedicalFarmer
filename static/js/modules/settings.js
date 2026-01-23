import { Storage } from './storage.js';
import { Mask } from './utils.js';
import { UI } from './ui.js';

/**
 * Controller for the Settings View.
 * Handles Profile Editing and Signature Capture.
 */
export const SettingsController = {
    sigCanvas: null,
    sigCtx: null,

    /**
     * Binds events for settings page.
     */
    bindEvents() {
        // Static buttons
        const btnSave = document.getElementById('btn-save-settings');
        if (btnSave) btnSave.addEventListener('click', () => this.save());

        const btnSigOpen = document.getElementById('btn-open-signature');
        if (btnSigOpen) btnSigOpen.addEventListener('click', () => this.openSignatureModal());

        const btnSigClear = document.getElementById('btn-clear-signature');
        if (btnSigClear) btnSigClear.addEventListener('click', () => this.clearSignature());

        const btnSigSave = document.getElementById('btn-save-signature');
        if (btnSigSave) btnSigSave.addEventListener('click', () => this.saveSignature());

        const btnSigCancel = document.getElementById('btn-cancel-signature');
        if (btnSigCancel) btnSigCancel.addEventListener('click', () => {
            const modal = document.getElementById('signature-modal');
            modal.classList.add('hidden');
            UI.Modal.releaseFocus(modal);
        });

        // Input Masks
        const telInput = document.getElementById('s-telefone');
        if(telInput) {
            telInput.addEventListener('input', (e) => e.target.value = Mask.phone(e.target.value));
        }
    },

    /**
     * Renders the settings view.
     */
    render() {
        const s = Storage.getSettings();
        const elNome = document.getElementById('s-nome');
        const elCrm = document.getElementById('s-crm');
        const elEndereco = document.getElementById('s-endereco');
        const elTelefone = document.getElementById('s-telefone');

        if(elNome) elNome.value = s.nome || '';
        if(elCrm) elCrm.value = s.crm || '';
        if(elEndereco) elEndereco.value = s.endereco || '';
        if(elTelefone) elTelefone.value = s.telefone || '';

        // Render signature preview
        const container = document.querySelector('#view-settings .max-w-2xl');
        const oldPreview = document.getElementById('signature-preview');
        if(oldPreview) oldPreview.remove();

        if (s.signature && container) {
            const img = document.createElement('img');
            img.src = s.signature;
            img.id = 'signature-preview';
            img.className = 'mt-4 border rounded max-h-24 block mx-auto';
            img.alt = 'Assinatura Digital';
            container.appendChild(img);
        }
    },

    /**
     * Saves the settings (excluding signature, which is handled separately).
     */
    save() {
        const elNome = document.getElementById('s-nome');
        const elCrm = document.getElementById('s-crm');
        const elEndereco = document.getElementById('s-endereco');
        const elTelefone = document.getElementById('s-telefone');

        const settings = {
            nome: elNome ? elNome.value : '',
            crm: elCrm ? elCrm.value : '',
            endereco: elEndereco ? elEndereco.value : '',
            telefone: elTelefone ? elTelefone.value : '',
            signature: Storage.getSettings().signature // preserve signature
        };
        Storage.saveSettings(settings);
        UI.Toast.show('Configurações salvas!', 'success');
        this.render(); // Re-render to show updates or side effects
    },

    // --- Signature Modal ---

    /**
     * Opens the signature modal and initializes canvas.
     */
    openSignatureModal() {
        const modal = document.getElementById('signature-modal');
        const canvas = document.getElementById('signature-canvas');
        if (!modal || !canvas) return;

        this.sigCanvas = canvas;
        this.sigCtx = canvas.getContext('2d');

        this.sigCtx.clearRect(0, 0, canvas.width, canvas.height);
        this.sigCtx.lineWidth = 2;
        this.sigCtx.strokeStyle = '#000';

        let drawing = false;

        // Support Mouse and Touch events
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;

            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const startDraw = (e) => {
            if(e.type === 'touchstart') e.preventDefault(); // Prevent scroll
            drawing = true;
            this.sigCtx.beginPath();
            const pos = getPos(e);
            this.sigCtx.moveTo(pos.x, pos.y);
        };

        const moveDraw = (e) => {
            if (drawing) {
                 if(e.type === 'touchmove') e.preventDefault();
                 const pos = getPos(e);
                 this.sigCtx.lineTo(pos.x, pos.y);
                 this.sigCtx.stroke();
            }
        };

        const endDraw = () => { drawing = false; };

        canvas.onmousedown = startDraw;
        canvas.ontouchstart = startDraw;

        canvas.onmousemove = moveDraw;
        canvas.ontouchmove = moveDraw;

        canvas.onmouseup = endDraw;
        canvas.ontouchend = endDraw;
        canvas.onmouseleave = endDraw;

        modal.classList.remove('hidden');
        UI.Modal.trapFocus(modal);
    },

    /**
     * Clears the signature canvas.
     */
    clearSignature() {
        if(this.sigCanvas && this.sigCtx) {
            this.sigCtx.clearRect(0, 0, this.sigCanvas.width, this.sigCanvas.height);
        }
    },

    /**
     * Saves the signature from canvas to settings.
     */
    saveSignature() {
        if(!this.sigCanvas) return;

        const dataUrl = this.sigCanvas.toDataURL('image/png');
        const s = Storage.getSettings();
        s.signature = dataUrl;
        Storage.saveSettings(s);

        const modal = document.getElementById('signature-modal');
        if(modal) {
            modal.classList.add('hidden');
            UI.Modal.releaseFocus(modal);
        }

        this.render();
        UI.Toast.show('Assinatura salva!', 'success');
    }
};
