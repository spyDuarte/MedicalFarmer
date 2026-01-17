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

        const setHTML = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.innerHTML = val || '';
        }

        setTxt('print-header-name', s.nome || 'Dr. Perito Judicial');
        setTxt('print-header-crm', s.crm || 'CRM-XX 00000');
        setTxt('print-header-contact', `${s.endereco ? s.endereco : ''} ${s.telefone ? ' | ' + s.telefone : ''}`);

        setTxt('p-processo', pericia.numero_processo);
        setTxt('p-autor', pericia.nome_autor);
        setTxt('p-data', pericia.data_pericia ? new Date(pericia.data_pericia + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/____');

        // Helper for Age
        const dob = pericia.data_nascimento ? new Date(pericia.data_nascimento) : null;
        const age = dob ? Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970) : '-';

        let idDetails = `
            <strong>Nome:</strong> ${pericia.nome_autor}<br>
            <strong>Nascimento:</strong> ${pericia.data_nascimento ? new Date(pericia.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
            (${age} anos)<br>
            <strong>RG:</strong> ${pericia.rg || '-'} | <strong>CPF:</strong> ${pericia.cpf || '-'}<br>
        `;

        // Add specific fields based on template type or existence
        if(pericia.escolaridade) idDetails += `<strong>Escolaridade:</strong> ${pericia.escolaridade}<br>`;
        if(pericia.empresa_reu) idDetails += `<strong>Empresa (Ré):</strong> ${pericia.empresa_reu}<br>`;
        if(pericia.data_evento) idDetails += `<strong>Data do Evento:</strong> ${pericia.data_evento ? new Date(pericia.data_evento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}<br>`;

        setHTML('p-identificacao-detalhada', idDetails);

        // History
        let histContent = '';
        if(pericia.profissao) histContent += `<strong>Profissão:</strong> ${pericia.profissao}<br>`;
        if(pericia.tempo_funcao) histContent += `<strong>Tempo na Função:</strong> ${pericia.tempo_funcao}<br>`;
        if(pericia.funcao_contratada) histContent += `<strong>Função Contratada:</strong> ${pericia.funcao_contratada}<br>`;
        if(pericia.local_trabalho) histContent += `<strong>Local de Trabalho:</strong> ${pericia.local_trabalho}<br>`;
        if(pericia.desc_atividades) histContent += `<strong>Atividades:</strong> ${pericia.desc_atividades}<br>`;
        if(pericia.riscos_ocupacionais) histContent += `<strong>Riscos:</strong> ${pericia.riscos_ocupacionais}<br>`;
        if(pericia.epis_fornecidos) histContent += `<strong>EPIs:</strong> ${pericia.epis_fornecidos}<br>`;
        if(pericia.dinamica_evento) histContent += `<strong>Dinâmica do Evento:</strong> ${pericia.dinamica_evento}<br>`;
        if(pericia.tratamentos_realizados) histContent += `<strong>Tratamentos:</strong> ${pericia.tratamentos_realizados}<br>`;

        setHTML('p-ocupacional', histContent);
        setHTML('p-anamnese', pericia.anamnese || 'Não informado.');
        setTxt('p-antecedentes', pericia.antecedentes || 'Nada digno de nota.');

        // Exame
        let exameExtras = '';
        if(pericia.dano_estetico) exameExtras += `<br><strong>Dano Estético:</strong> ${pericia.dano_estetico}`;

        setHTML('p-exame', (pericia.exame_fisico || 'Não informado.') + exameExtras);
        setTxt('p-exames-comp', pericia.exames_complementares || 'Não apresentados.');

        // Conclusao
        setTxt('p-discussao', pericia.discussao);
        setTxt('p-cid', pericia.cid || '-');
        setTxt('p-nexo', pericia.nexo || '-');

        let datasTecnicas = '';
        if(pericia.did) datasTecnicas += `DID: ${pericia.did} `;
        if(pericia.dii) datasTecnicas += `| DII: ${pericia.dii} `;
        if(pericia.consolidacao) datasTecnicas += `| Consolidação: ${new Date(pericia.consolidacao + 'T00:00:00').toLocaleDateString('pt-BR')} `;

        // We reuse p-did and p-dii spans if possible, or just overwrite parent container?
        // The HTML structure has specific spans. Let's fill them if they exist, or hide/clear.

        // This part is a bit tricky with dynamic fields mapping to static print layout.
        // Best effort:
        setTxt('p-did', pericia.did || '');
        setTxt('p-dii', pericia.dii || '');
        // If we have consolidacao, we might need to append it somewhere or change the label in print view.
        // For now, let's assume the print layout is standard.

        // Scores
        let parecerTxt = pericia.parecer || '';
        if(pericia.score_dano) parecerTxt += ` | Déficit Funcional: ${pericia.score_dano}%`;
        if(pericia.score_estetico) parecerTxt += ` | Dano Estético: ${pericia.score_estetico}`;
        if(pericia.perda_capacidade) parecerTxt += ` | Perda Capacidade: ${pericia.perda_capacidade}%`;

        setTxt('p-parecer', parecerTxt);
        setHTML('p-conclusao', pericia.conclusao || '');

        setHTML('p-quesitos', pericia.quesitos || 'Vide corpo do laudo.');

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
