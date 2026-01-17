
const DB_KEY = 'pericia_sys_data';
const MACROS_KEY = 'pericia_sys_macros';
const SETTINGS_KEY = 'pericia_sys_settings';

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
        if (!localStorage.getItem(SETTINGS_KEY)) {
            const defaultSettings = {
                nome: "Dr. Perito Judicial",
                crm: "CRM-XX 00000",
                endereco: "",
                telefone: ""
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
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
    },

    // --- Settings ---
    getSettings() {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    },

    saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    },

    // --- Backup & Restore ---
    exportData() {
        const data = {
            pericias: this.getPericias(),
            macros: this.getMacros(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_pericias_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData(input) {
        const file = input.files[0];
        if(!file) return;

        if(!confirm("ATENÇÃO: Isso irá substituir todos os dados atuais pelos do backup. Deseja continuar?")) {
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if(data.pericias && Array.isArray(data.pericias)) {
                    localStorage.setItem(DB_KEY, JSON.stringify(data.pericias));
                }
                if(data.macros && Array.isArray(data.macros)) {
                    localStorage.setItem(MACROS_KEY, JSON.stringify(data.macros));
                }
                if(data.settings) {
                    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
                }
                alert("Dados restaurados com sucesso!");
                location.reload();
            } catch (err) {
                console.error(err);
                alert("Erro ao ler arquivo de backup.");
            }
        };
        reader.readAsText(file);
    }
};

Storage.init();
