
const DB_KEY = 'pericia_sys_data';
const MACROS_KEY = 'pericia_sys_macros';

const Storage = {
    // --- Data Initialization ---
    init() {
        if (!localStorage.getItem(DB_KEY)) {
            localStorage.setItem(DB_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(MACROS_KEY)) {
            // Default Macros
            const defaults = [
                {id: 1, titulo: "Anamnese Padrão", categoria: "anamnese", conteudo: "Paciente refere dor..."},
                {id: 2, titulo: "Exame Físico Normal", categoria: "exame_fisico", conteudo: "BEG, LOTE, Mote..."},
                {id: 3, titulo: "Conclusão - Incapaz", categoria: "conclusao", conteudo: "Há incapacidade laborativa..."}
            ];
            localStorage.setItem(MACROS_KEY, JSON.stringify(defaults));
        }
    },

    // --- Pericias ---
    getPericias() {
        return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    },

    getPericia(id) {
        const pericias = this.getPericias();
        return pericias.find(p => p.id == id);
    },

    savePericia(pericia) {
        const pericias = this.getPericias();
        if (pericia.id) {
            const index = pericias.findIndex(p => p.id == pericia.id);
            if (index !== -1) {
                pericias[index] = { ...pericias[index], ...pericia }; // Update
            }
        } else {
            pericia.id = Date.now(); // Simple ID
            pericia.created_at = new Date().toISOString();
            pericias.push(pericia);
        }
        localStorage.setItem(DB_KEY, JSON.stringify(pericias));
        return pericia;
    },

    deletePericia(id) {
        let pericias = this.getPericias();
        pericias = pericias.filter(p => p.id != id);
        localStorage.setItem(DB_KEY, JSON.stringify(pericias));
    },

    // --- Macros ---
    getMacros() {
        return JSON.parse(localStorage.getItem(MACROS_KEY) || '[]');
    },

    addMacro(macro) {
        const macros = this.getMacros();
        macro.id = Date.now();
        macros.push(macro);
        localStorage.setItem(MACROS_KEY, JSON.stringify(macros));
    },

    deleteMacro(id) {
         let macros = this.getMacros();
         macros = macros.filter(m => m.id != id);
         localStorage.setItem(MACROS_KEY, JSON.stringify(macros));
    }
};

Storage.init();
