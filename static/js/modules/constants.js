export const DB_KEYS = {
    PERICIAS: 'pericia_sys_data',
    MACROS: 'pericia_sys_macros',
    SETTINGS: 'pericia_sys_settings',
    TEMPLATES: 'pericia_sys_templates',
    DRAFT: 'pericia_draft'
};

export const STATUS = {
    PENDING: 'Pendente',
    DONE: 'Concluido',
    SCHEDULED: 'Agendado',
    IN_PROGRESS: 'Em Andamento',
    WAITING: 'Aguardando'
};

export const PAYMENT_STATUS = {
    PAID: 'Pago',
    PENDING: 'Pendente'
};

export const DEFAULTS = {
    NEXO: 'Não há nexo',
    PARECER: 'Apto',
    OBJETIVO: 'O presente trabalho pericial tem por objetivo avaliar a capacidade laborativa da parte autora, bem como estabelecer o nexo causal entre a patologia alegada e suas atividades laborais.',
    METODOLOGIA: 'Para a elaboração deste laudo, foram utilizados os seguintes métodos: Anamnese ocupacional e clínica, Exame Físico direcionado, Análise documental (laudos, exames de imagem e documentos médicos) e Revisão da literatura médica especializada.'
};

export const UI_STRINGS = {
    ERROR_PROCESS: "Número do Processo é obrigatório.",
    ERROR_AUTHOR: "Nome do Autor é obrigatório.",
    ERROR_CID: "Diagnóstico (CID) é obrigatório.",
    ERROR_CONCLUSION: "Conclusão é obrigatória.",
    ERROR_CPF: "CPF inválido.",
    ERROR_SAVE: "Erro ao salvar.",
    SUCCESS_SAVE: "Salvo com sucesso!",
    SUCCESS_FINISH: "Perícia finalizada!"
};
