import { Storage } from './storage.js';

export const PrintController = {
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

        setTxt('p-processo', pericia.numero_processo);
        setTxt('p-autor', pericia.nome_autor); // Added missing mapping for p-autor
        setTxt('p-data', pericia.data_pericia ? new Date(pericia.data_pericia + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/____');

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

        let histOcup = `
            <strong>Profissão:</strong> ${pericia.profissao || '-'}<br>
            <strong>Tempo na Função:</strong> ${pericia.tempo_funcao || '-'}<br>
            <strong>Atividades/Riscos:</strong> ${pericia.desc_atividades || '-'}
        `;
        document.getElementById('p-ocupacional').innerHTML = histOcup;
        document.getElementById('p-anamnese').innerHTML = pericia.anamnese || 'Não informado.';
        setTxt('p-antecedentes', pericia.antecedentes || 'Nada digno de nota.');

        document.getElementById('p-exame').innerHTML = pericia.exame_fisico || 'Não informado.';
        setTxt('p-exames-comp', pericia.exames_complementares || 'Não apresentados.');

        setTxt('p-discussao', pericia.discussao);
        setTxt('p-cid', pericia.cid || '-');
        setTxt('p-nexo', pericia.nexo || '-');
        setTxt('p-did', pericia.did || '-');
        setTxt('p-dii', pericia.dii || '-');
        setTxt('p-parecer', pericia.parecer || '-');
        document.getElementById('p-conclusao').innerHTML = pericia.conclusao || '';

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

        html2pdf().set(opt).from(element).save().then(() => {
             if(btnContainer) btnContainer.style.display = 'flex';
        }).catch(err => {
            console.error(err);
            alert("Erro ao gerar PDF: " + err.message);
            if(btnContainer) btnContainer.style.display = 'flex';
        });
    }
};
