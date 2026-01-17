export const Modals = {
    init() {
        this.renderConfirmationModal();
        this.renderSignatureModal();
        this.renderAnnotationModal();
    },

    renderConfirmationModal() {
        if (document.getElementById('custom-modal')) return;
        const div = document.createElement('div');
        div.id = 'custom-modal';
        div.className = 'fixed inset-0 z-50 hidden flex items-center justify-center bg-black bg-opacity-50';
        div.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 transform transition-all scale-100">
                <h3 id="modal-title" class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Confirmação</h3>
                <p id="modal-message" class="text-gray-600 dark:text-gray-300 mb-6">Tem certeza?</p>
                <div class="flex justify-end gap-3">
                    <button id="modal-cancel" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                    <button id="modal-confirm" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },

    renderSignatureModal() {
        if (document.getElementById('signature-modal')) return;
        const div = document.createElement('div');
        div.id = 'signature-modal';
        div.className = 'fixed inset-0 z-50 hidden flex items-center justify-center bg-black bg-opacity-50';
        div.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 transform transition-all scale-100">
                <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Assinatura Digital</h3>
                <div class="border border-gray-300 dark:border-gray-600 rounded bg-white h-40 flex justify-center items-center cursor-crosshair">
                    <canvas id="signature-canvas" width="340" height="150"></canvas>
                </div>
                <div class="flex justify-between mt-2">
                    <button id="btn-signature-clear" class="text-xs text-red-500 hover:underline">Limpar</button>
                </div>
                <div class="flex justify-end gap-3 mt-4">
                    <button id="btn-signature-cancel" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancelar</button>
                    <button id="btn-signature-save" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar Assinatura</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },

    renderAnnotationModal() {
        if (document.getElementById('annotation-modal')) return;
        const div = document.createElement('div');
        div.id = 'annotation-modal';
        div.className = 'fixed inset-0 z-50 hidden flex items-center justify-center bg-black bg-opacity-90';
        div.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Anotar Imagem</h3>
                    <div class="flex gap-2">
                        <button id="btn-tool-pen" class="tool-btn bg-gray-200 p-2 rounded hover:bg-gray-300 active" title="Caneta"><i class="fa-solid fa-pen"></i></button>
                        <button id="btn-tool-text" class="tool-btn bg-gray-200 p-2 rounded hover:bg-gray-300" title="Texto"><i class="fa-solid fa-font"></i></button>
                        <button id="btn-annotation-clear" class="bg-red-200 p-2 rounded hover:bg-red-300" title="Limpar"><i class="fa-solid fa-trash"></i></button>
                        <input type="color" id="annotation-color" value="#ff0000" class="h-10 w-10 p-1 border rounded cursor-pointer">
                    </div>
                    <button id="btn-annotation-close-x" class="text-gray-500 hover:text-gray-700"><i class="fa-solid fa-times fa-lg"></i></button>
                </div>
                <div class="flex-grow bg-gray-100 overflow-hidden relative border border-gray-300 rounded flex justify-center items-center">
                    <canvas id="annotation-canvas"></canvas>
                </div>
                <div class="mt-4 flex justify-end gap-3">
                    <button id="btn-annotation-cancel" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancelar</button>
                    <button id="btn-annotation-save" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar Anotação</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    }
};
