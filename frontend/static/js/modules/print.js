import { Storage } from './storage.js';
import { UI } from './ui.js';
import { DEFAULTS } from './constants.js';
import { Format } from './utils.js';

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

        setTxt('p-tipo_acao', pericia.tipoAcao || 'Trabalhista');
        setTxt('p-processo', pericia.numeroProcesso);
        setTxt('p-autor', pericia.nomeAutor);
        setTxt('p-data', pericia.dataPericia ? Format.date(pericia.dataPericia) : '___/___/____');
        setTxt('p-local_pericia', pericia.localPericia || '-');
        setTxt('p-assistentes', pericia.assistentes || '-');

        setTxt('p-objetivo', pericia.objetivo || DEFAULTS.OBJETIVO);
        setTxt('p-metodologia', pericia.metodologia || DEFAULTS.METODOLOGIA);

        // Helper for Age
        const dob = pericia.dataNascimento ? new Date(pericia.dataNascimento) : null;
        const age = dob ? Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970) : '-';

        let idDetails = `
            <strong>Nome:</strong> ${pericia.nomeAutor}<br>
            <strong>Nascimento:</strong> ${pericia.dataNascimento ? Format.date(pericia.dataNascimento) : '-'}
            (${age} anos)<br>
            <strong>RG:</strong> ${pericia.rg || '-'} | <strong>CPF:</strong> ${pericia.cpf || '-'}<br>
            <strong>Escolaridade:</strong> ${pericia.escolaridade || '-'}
        `;
        document.getElementById('p-identificacao-detalhada').innerHTML = idDetails;

        setTxt('p-estado_civil', pericia.estadoCivil || '-');
        setTxt('p-ctps', pericia.ctps || '-');
        setTxt('p-cnh', pericia.cnh || '-');
        setTxt('p-mao_dominante', pericia.maoDominante || '-');

        let histOcup = `
            <strong>Profissão:</strong> ${pericia.profissao || '-'}<br>
            <strong>Tempo na Função:</strong> ${pericia.tempoFuncao || '-'}<br>
            <strong>Atividades/Riscos:</strong> ${pericia.descAtividades || '-'}
        `;
        document.getElementById('p-ocupacional').innerHTML = histOcup;
        setTxt('p-data_acidente', pericia.dataAcidente ? Format.date(pericia.dataAcidente) : '-');
        setTxt('p-epis', pericia.epis || 'Não informado/Não aplicável.');

        document.getElementById('p-anamnese').innerHTML = pericia.anamnese || 'Não informado.';
        setTxt('p-antecedentes', pericia.antecedentes || 'Nada digno de nota.');
        setTxt('p-historico_previdenciario', pericia.historicoPrevidenciario || 'Não informado.');

        document.getElementById('p-exame').innerHTML = pericia.exameFisico || 'Não informado.';
        setTxt('p-exames-comp', pericia.examesComplementares || 'Não apresentados.');

        setTxt('p-discussao', pericia.discussao);
        setTxt('p-cid', pericia.cid || '-');
        setTxt('p-nexo', pericia.nexo || '-');
        setTxt('p-did', pericia.did || '-');
        setTxt('p-dii', pericia.dii || '-');
        setTxt('p-parecer', pericia.parecer || '-');
        setTxt('p-prognostico', pericia.prognostico || '-');
        setTxt('p-necessidade_assistencia', pericia.necessidadeAssistencia || '-');
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
