import { UI } from './ui.js';

/**
 * Service to handle Speech-to-Text using Web Speech API.
 */
export const SpeechService = {
    recognition: null,

    /**
     * Toggles speech recognition for a given editor.
     * @param {Object} quill - The Quill editor instance.
     * @param {HTMLElement} btn - The button element to toggle styles.
     */
    toggle(quill, btn) {
        if (!('webkitSpeechRecognition' in window)) {
            UI.Modal.alert("Navegador não suporta reconhecimento de voz.");
            return;
        }

        if (this.recognition && this.recognition.started) {
            this.recognition.stop();
            this.recognition.started = false;
            if (btn) btn.classList.remove('text-red-600', 'animate-pulse');
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.lang = 'pt-BR';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.recognition.onstart = () => {
            this.recognition.started = true;
            if (btn) btn.classList.add('text-red-600', 'animate-pulse');
        };

        this.recognition.onend = () => {
            this.recognition.started = false;
            if (btn) btn.classList.remove('text-red-600', 'animate-pulse');
        };

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript + ' ';
                }
            }
            if (transcript) {
                const range = quill.getSelection(true);
                if (range) {
                    quill.insertText(range.index, transcript);
                } else {
                    quill.insertText(quill.getLength(), transcript);
                }
            }
        };

        this.recognition.start();
    }
};
