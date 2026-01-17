// Template Definitions for Forensic Reports
// Defines the structure for Previdenciária, Trabalhista, and Civil reports

export const Templates = {
    previdenciaria: {
        id: 'previdenciaria',
        name: 'Perícia Previdenciária',
        description: 'Focado em incapacidade laborativa, datas técnicas (DID/DII) e nexo.',
        sections: [
            {
                id: 'identificacao',
                title: 'Identificação',
                fields: [
                    { id: 'numero_processo', label: 'Número do Processo', type: 'text', width: 'half', required: true },
                    { id: 'vara', label: 'Agência / Vara', type: 'text', width: 'half' },
                    { id: 'nome_autor', label: 'Nome do Periciado', type: 'text', width: 'half', required: true },
                    { id: 'data_nascimento', label: 'Data de Nascimento', type: 'date', width: 'quarter', listener: 'calcAge' },
                    { id: 'idade_display', label: 'Idade', type: 'display', width: 'quarter' },
                    { id: 'cpf', label: 'CPF', type: 'text', width: 'third', mask: 'cpf' },
                    { id: 'rg', label: 'RG / Documento', type: 'text', width: 'third' },
                    { id: 'escolaridade', label: 'Escolaridade', type: 'select', width: 'third', options: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Completo', 'Superior Completo'] },
                    { id: 'data_pericia', label: 'Data da Perícia', type: 'date', width: 'third' },
                    { id: 'valor_honorarios', label: 'Honorários (R$)', type: 'number', width: 'third' },
                    { id: 'status_pagamento', label: 'Pagamento', type: 'select', width: 'third', options: ['Pendente', 'Pago'] }
                ]
            },
            {
                id: 'historico',
                title: 'Histórico',
                fields: [
                    { id: 'profissao', label: 'Profissão Declarada', type: 'text', width: 'half' },
                    { id: 'tempo_funcao', label: 'Tempo na Função', type: 'text', width: 'half' },
                    { id: 'desc_atividades', label: 'Descrição das Atividades', type: 'textarea', rows: 4, width: 'full' },
                    { id: 'anamnese', label: 'História da Doença Atual (HDA)', type: 'richtext', macroCategory: 'anamnese' },
                    { id: 'antecedentes', label: 'Antecedentes Pessoais e Familiares', type: 'textarea', rows: 4, width: 'full' }
                ]
            },
            {
                id: 'exame',
                title: 'Exame Clínico',
                fields: [
                    { id: 'exame_fisico', label: 'Exame Físico', type: 'richtext', macroCategory: 'exame_fisico' },
                    { id: 'document_upload', type: 'custom_upload' },
                    { id: 'exames_complementares', label: 'Análise de Exames Complementares', type: 'textarea', rows: 6 }
                ]
            },
            {
                id: 'conclusao',
                title: 'Conclusão',
                fields: [
                    { id: 'discussao', label: 'Discussão do Caso', type: 'textarea', rows: 6 },
                    { id: 'cid', label: 'Diagnóstico (CID-10)', type: 'cid_search', width: 'half', required: true },
                    { id: 'nexo', label: 'Nexo Causal', type: 'select', width: 'half', options: ['Não há nexo', 'Nexo Causal Típico', 'Nexo Concausal', 'Nexo Agravamento'] },
                    { id: 'did', label: 'DID (Data Início Doença)', type: 'text', width: 'third' },
                    { id: 'dii', label: 'DII (Data Início Incapacidade)', type: 'text', width: 'third' },
                    { id: 'parecer', label: 'Parecer quanto à Capacidade', type: 'select', width: 'third', options: ['Capto', 'Incapaz Temporariamente', 'Incapaz Permanentemente', 'Incapaz Parcialmente'] },
                    { id: 'conclusao', label: 'Conclusão Final', type: 'richtext', macroCategory: 'conclusao', required: true }
                ]
            },
            {
                id: 'quesitos',
                title: 'Quesitos',
                fields: [
                    { id: 'quesitos', label: 'Respostas aos Quesitos', type: 'richtext' }
                ]
            }
        ]
    },

    trabalhista: {
        id: 'trabalhista',
        name: 'Perícia Trabalhista',
        description: 'Ênfase em riscos ocupacionais, EPIs, ergonomia e nexo trabalho-doença.',
        sections: [
            {
                id: 'identificacao',
                title: 'Identificação',
                fields: [
                    // Same as standard, maybe add Reclamante/Reclamada distinction
                    { id: 'numero_processo', label: 'Número do Processo', type: 'text', width: 'half', required: true },
                    { id: 'vara', label: 'Vara do Trabalho', type: 'text', width: 'half' },
                    { id: 'nome_autor', label: 'Reclamante', type: 'text', width: 'half', required: true },
                    { id: 'empresa_reu', label: 'Reclamada (Empresa)', type: 'text', width: 'half' }, // New field needs handling
                    { id: 'data_nascimento', label: 'Data de Nascimento', type: 'date', width: 'quarter', listener: 'calcAge' },
                    { id: 'idade_display', label: 'Idade', type: 'display', width: 'quarter' },
                    { id: 'cpf', label: 'CPF', type: 'text', width: 'third', mask: 'cpf' },
                    { id: 'rg', label: 'CTPS / RG', type: 'text', width: 'third' },
                    { id: 'data_pericia', label: 'Data da Diligência', type: 'date', width: 'third' },
                    { id: 'valor_honorarios', label: 'Honorários (R$)', type: 'number', width: 'third' },
                    { id: 'status_pagamento', label: 'Pagamento', type: 'select', width: 'third', options: ['Pendente', 'Pago'] }
                ]
            },
            {
                id: 'historico_ocupacional',
                title: 'Vínculo e Atividades',
                fields: [
                    { id: 'funcao_contratada', label: 'Função Contratada', type: 'text', width: 'half' },
                    { id: 'periodo_trabalho', label: 'Período do Vínculo', type: 'text', width: 'half' },
                    { id: 'local_trabalho', label: 'Local da Vistoria', type: 'text', width: 'full' },
                    { id: 'desc_atividades', label: 'Descrição das Atividades (Paradigma)', type: 'textarea', rows: 5 },
                    { id: 'riscos_ocupacionais', label: 'Riscos Ocupacionais Identificados', type: 'textarea', rows: 3 },
                    { id: 'epis_fornecidos', label: 'EPIs Fornecidos / Uso', type: 'textarea', rows: 3 }
                ]
            },
            {
                id: 'saude',
                title: 'Histórico Clínico',
                fields: [
                    { id: 'anamnese', label: 'História da Moléstia Atual', type: 'richtext', macroCategory: 'anamnese' },
                    { id: 'antecedentes', label: 'Antecedentes', type: 'textarea', rows: 3 },
                    { id: 'exame_fisico', label: 'Exame Físico Dirigido', type: 'richtext', macroCategory: 'exame_fisico' },
                    { id: 'document_upload', type: 'custom_upload' }
                ]
            },
            {
                id: 'conclusao',
                title: 'Nexo e Conclusão',
                fields: [
                     { id: 'discussao', label: 'Discussão Técnica (Nexo)', type: 'textarea', rows: 6 },
                     { id: 'cid', label: 'CID Principal', type: 'cid_search', width: 'half', required: true },
                     { id: 'nexo', label: 'Classificação do Nexo', type: 'select', width: 'half', options: ['Inexistente', 'Causal', 'Concausal', 'Agravamento'] },
                     { id: 'perda_capacidade', label: 'Perda da Capacidade (%)', type: 'text', width: 'half' }, // New
                     { id: 'conclusao', label: 'Conclusão Final', type: 'richtext', macroCategory: 'conclusao', required: true }
                ]
            },
            {
                id: 'quesitos',
                title: 'Quesitos',
                fields: [
                    { id: 'quesitos', label: 'Quesitos do Juízo e Partes', type: 'richtext' }
                ]
            }
        ]
    },

    civil: {
        id: 'civil',
        name: 'Perícia Cível (Dano Corporal)',
        description: 'Focado em quantificação de dano, danos estéticos e sequelas.',
        sections: [
            {
                id: 'identificacao',
                title: 'Identificação',
                fields: [
                    { id: 'numero_processo', label: 'Número do Processo', type: 'text', width: 'half', required: true },
                    { id: 'vara', label: 'Vara Cível', type: 'text', width: 'half' },
                    { id: 'nome_autor', label: 'Autor(a)', type: 'text', width: 'half', required: true },
                    { id: 'reu', label: 'Réu', type: 'text', width: 'half' },
                    { id: 'data_nascimento', label: 'Data de Nascimento', type: 'date', width: 'quarter', listener: 'calcAge' },
                    { id: 'idade_display', label: 'Idade', type: 'display', width: 'quarter' },
                    { id: 'cpf', label: 'CPF', type: 'text', width: 'third', mask: 'cpf' },
                    { id: 'data_evento', label: 'Data do Evento/Acidente', type: 'date', width: 'third' }, // Specific
                    { id: 'data_pericia', label: 'Data da Perícia', type: 'date', width: 'third' },
                    { id: 'valor_honorarios', label: 'Honorários', type: 'number', width: 'half' }
                ]
            },
            {
                id: 'historico',
                title: 'Histórico do Evento',
                fields: [
                    { id: 'dinamica_evento', label: 'Dinâmica do Evento (Acidente/Erro)', type: 'textarea', rows: 6 },
                    { id: 'tratamentos_realizados', label: 'Tratamentos e Evolução', type: 'textarea', rows: 4 },
                    { id: 'anamnese', label: 'Queixas Atuais', type: 'richtext', macroCategory: 'anamnese' }
                ]
            },
            {
                id: 'exame',
                title: 'Exame e Sequelas',
                fields: [
                    { id: 'exame_fisico', label: 'Exame Físico e Funcional', type: 'richtext', macroCategory: 'exame_fisico' },
                    { id: 'dano_estetico', label: 'Descrição Dano Estético', type: 'textarea', rows: 3 },
                    { id: 'document_upload', type: 'custom_upload' }
                ]
            },
            {
                id: 'baremo',
                title: 'Quantificação (Baremo)',
                fields: [
                    { id: 'discussao', label: 'Análise Médico-Legal', type: 'textarea', rows: 5 },
                    { id: 'cid', label: 'Sequela (CID)', type: 'cid_search', width: 'half' },
                    { id: 'consolidacao', label: 'Data da Consolidação', type: 'date', width: 'half' },
                    { id: 'score_dano', label: 'Déficit Funcional (%)', type: 'text', width: 'third' },
                    { id: 'score_estetico', label: 'Dano Estético (1-7)', type: 'select', width: 'third', options: ['1 - Muito Leve', '2 - Leve', '3 - Moderado', '4 - Médio', '5 - Grave', '6 - Muito Grave', '7 - Prejuízo Total'] },
                    { id: 'conclusao', label: 'Conclusão', type: 'richtext', macroCategory: 'conclusao', required: true }
                ]
            },
            {
                id: 'quesitos',
                title: 'Quesitos',
                fields: [
                    { id: 'quesitos', label: 'Respostas aos Quesitos', type: 'richtext' }
                ]
            }
        ]
    }
};
