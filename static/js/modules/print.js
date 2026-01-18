import { Storage } from './storage.js';
import { UI } from './ui.js';

/**
 * Controller for Printing and PDF Export.
 */
export const PrintController = {
    /**
     * Binds print-related events.
     */
    bindEvents() {
        const btnPrint = document.getElementById('btn-print-native');
        if(btnPrint) btnPrint.addEventListener('click', () => window.print());

        const btnPdf = document.getElementById('btn-export-pdf');
        if(btnPdf) btnPdf.addEventListener('click', () => this.exportPDF());

        const btnClose = document.getElementById('btn-close-print');
        if(btnClose) btnClose.addEventListener('click', () => {
             // Only works if opened by script, but here it's SPA view
             window.location.hash = '#dashboard';
        });
    },

    /**
     * Renders the print view for a specific Pericia.
     * @param {number|string} id - The Pericia ID.
     */
    render(id) {
        const pericia = Storage.getPericia(id);
        const s = Storage.getSettings();
        if(!pericia) return;

        // Header
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.innerText = val || '';
        };

        setTxt('print-header-name', s.nome || 'Dr. Perito Judicial');
        setTxt('print-header-crm', s.crm || 'CRM-XX 00000');
        setTxt('print-header-contact', `${s.endereco ? s.endereco : ''} ${s.telefone ? ' | ' + s.telefone : ''}`);

        setTxt('p-tipo_acao', pericia.tipo_acao || 'Trabalhista');
        setTxt('p-processo', pericia.numero_processo);
        setTxt('p-autor', pericia.nome_autor);
        setTxt('p-data', pericia.data_pericia ? new Date(pericia.data_pericia + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/____');
        setTxt('p-local_pericia', pericia.local_pericia || '-');
        setTxt('p-assistentes', pericia.assistentes || '-');

        setTxt('p-objetivo', pericia.objetivo || DEFAULTS.OBJETIVO);
        setTxt('p-metodologia', pericia.metodologia || DEFAULTS.METODOLOGIA);

        // Helper for Age
        const dob = pericia.data_nascimento ? new Date(pericia.data_nascimento) : null;
        const age = dob ? Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970) : '-';

        let idDetails = `
            <strong>Nome:</strong> ${pericia.nome_autor}<br>
            <strong>Nascimento:</strong> ${pericia.data_nascimento ? new Date(pericia.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
            (${age} anos)<br>
            <strong>RG:</strong> ${pericia.rg || '-'} | <strong>CPF:</strong> ${pericia.cpf || '-'}<br>
            <strong>Escolaridade:</strong> ${pericia.escolaridade || '-'}
        `;
        document.getElementById('p-identificacao-detalhada').innerHTML = idDetails;

        setTxt('p-estado_civil', pericia.estado_civil || '-');
        setTxt('p-ctps', pericia.ctps || '-');
        setTxt('p-mao_dominante', pericia.mao_dominante || '-');

        let histOcup = `
            <strong>Profissão:</strong> ${pericia.profissao || '-'}<br>
            <strong>Tempo na Função:</strong> ${pericia.tempo_funcao || '-'}<br>
            <strong>Atividades/Riscos:</strong> ${pericia.desc_atividades || '-'}
        `;
        document.getElementById('p-ocupacional').innerHTML = histOcup;
        setTxt('p-epis', pericia.epis || 'Não informado/Não aplicável.');

        document.getElementById('p-anamnese').innerHTML = pericia.anamnese || 'Não informado.';
        setTxt('p-antecedentes', pericia.antecedentes || 'Nada digno de nota.');
        setTxt('p-historico_previdenciario', pericia.historico_previdenciario || 'Não informado.');

        document.getElementById('p-exame').innerHTML = pericia.exame_fisico || 'Não informado.';
        setTxt('p-exames-comp', pericia.exames_complementares || 'Não apresentados.');

        setTxt('p-discussao', pericia.discussao);
        setTxt('p-cid', pericia.cid || '-');
        setTxt('p-nexo', pericia.nexo || '-');
        setTxt('p-did', pericia.did || '-');
        setTxt('p-dii', pericia.dii || '-');
        setTxt('p-parecer', pericia.parecer || '-');
        document.getElementById('p-conclusao').innerHTML = pericia.conclusao || '';
        setTxt('p-bibliografia', pericia.bibliografia || '-');

        document.getElementById('p-quesitos').innerHTML = pericia.quesitos || 'Vide corpo do laudo.';

        setTxt('print-footer-name', s.nome || 'Dr. Perito Judicial');
        setTxt('print-footer-crm', s.crm || 'CRM-XX 00000');

        // Signature
        const sigImg = document.getElementById('print-signature');
        if (s.signature) {
            sigImg.src = s.signature;
            sigImg.classList.remove('hidden');
        } else {
            sigImg.classList.add('hidden');
        }
    },

    /**
     * Exports the current print view to PDF using html2pdf.
     */
    exportPDF() {
        const element = document.getElementById('view-print');
        const opt = {
          margin:       [10, 10, 10, 10],
          filename:     `Laudo_${new Date().toISOString().slice(0,10)}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const btnContainer = element.querySelector('.fixed.bottom-4.right-4');
        if(btnContainer) btnContainer.style.display = 'none';

        UI.Loading.show();
        // eslint-disable-next-line no-undef
        html2pdf().set(opt).from(element).save().then(() => {
             if(btnContainer) btnContainer.style.display = 'flex';
             UI.Loading.hide();
        }).catch(err => {
            UI.Toast.show("Erro ao gerar PDF: " + err.message, 'error');
            if(btnContainer) btnContainer.style.display = 'flex';
            UI.Loading.hide();
        });
    }
};
