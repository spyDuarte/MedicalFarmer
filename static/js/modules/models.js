
import { DEFAULTS } from './constants.js';

/**
 * @typedef {Object} Processo
 * @property {string} numero - Número do processo
 * @property {string} vara - Vara judicial
 * @property {string} uf - Unidade Federativa
 * @property {string} comarca - Comarca
 */

/**
 * @typedef {Object} Partes
 * @property {string} autor - Nome do autor
 * @property {string} reu - Nome do réu
 */

/**
 * @typedef {Object} Datas
 * @property {string|null} nomeacao - Data da nomeação (ISO 8601)
 * @property {string|null} diligencia - Data da diligência (ISO 8601)
 * @property {string|null} entrega - Data da entrega do laudo (ISO 8601)
 */

/**
 * @typedef {Object} DocumentoMetadata
 * @property {string} id - Identificador único do arquivo
 * @property {string} originalName - Nome do arquivo
 * @property {number} tamanho - Tamanho em bytes
 * @property {string} tipo - Tipo MIME
 * @property {string} dataUpload - Data do upload (ISO 8601)
 */

/**
 * @typedef {Object} Quesito
 * @property {string} id - ID único do quesito
 * @property {string} texto - O texto da pergunta
 * @property {string} [resposta] - A resposta dada (opcional inicialmente)
 */

/**
 * @typedef {Object} Quesitos
 * @property {Quesito[]} juizo - Quesitos do Juízo
 * @property {Quesito[]} autor - Quesitos do Autor
 * @property {Quesito[]} reu - Quesitos do Réu
 */

/**
 * @typedef {Object} Conclusao
 * @property {string} texto - Texto da conclusão
 * @property {boolean} nexoCausal - Se há nexo causal
 * @property {string} [diagnostico] - CID ou diagnóstico
 * @property {string} [did] - Data de Início da Doença
 * @property {string} [dii] - Data de Início da Incapacidade
 */

/**
 * Classe que representa um modelo de Caso Pericial completo.
 */
export class Pericia {
    /**
     * Cria uma nova instância de Pericia.
     * @param {Object} [data={}] - Dados iniciais para popular o modelo
     */
    constructor(data = {}) {
        /** @type {string|number} */
        this.id = data.id || Date.now();

        /** @type {string} */
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();

        /** @type {string} - Status do laudo (e.g. "Em Andamento", "Concluído") */
        this.status = data.status || "Aguardando";

        /** @type {string} */
        this.objetivo = data.objetivo || DEFAULTS.OBJETIVO;

        /** @type {string} */
        this.metodologia = data.metodologia || DEFAULTS.METODOLOGIA;

        /** @type {string} */
        this.localPericia = data.localPericia || data.local_pericia || "";

        /** @type {string} */
        this.assistentes = data.assistentes || "Ausentes";

        /** @type {string} */
        this.historicoPrevidenciario = data.historicoPrevidenciario || data.historico_previdenciario || "";

        /** @type {string} */
        this.bibliografia = data.bibliografia || "";

        /** @type {string} */
        this.tipoAcao = data.tipoAcao || data.tipo_acao || "Trabalhista";

        /** @type {string} */
        this.estadoCivil = data.estadoCivil || data.estado_civil || "";

        /** @type {string} */
        this.ctps = data.ctps || "";

        /** @type {string} */
        this.maoDominante = data.maoDominante || data.mao_dominante || "Destro";

        /** @type {string} */
        this.epis = data.epis || "";

        /** @type {string} */
        this.cnh = data.cnh || "";

        // Dados Pessoais Flat (para facilitar binding)
        this.nomeAutor = data.nomeAutor || data.nome_autor || "";
        this.dataNascimento = data.dataNascimento || data.data_nascimento || "";
        this.cpf = data.cpf || "";
        this.rg = data.rg || "";
        this.escolaridade = data.escolaridade || "";

        // Endereço do Periciado
        this.endereco = {
            cep: data.endereco?.cep || "",
            logradouro: data.endereco?.logradouro || "",
            numero: data.endereco?.numero || "",
            complemento: data.endereco?.complemento || "",
            bairro: data.endereco?.bairro || "",
            cidade: data.endereco?.cidade || "",
            uf: data.endereco?.uf || ""
        };

        // Histórico Ocupacional
        this.profissao = data.profissao || "";
        this.tempoFuncao = data.tempoFuncao || data.tempo_funcao || "";
        this.descAtividades = data.descAtividades || data.desc_atividades || "";
        this.antecedentes = data.antecedentes || "";

        /** @type {string|null} */
        this.dataAcidente = data.dataAcidente || data.data_acidente || null;

        /** @type {string} */
        this.prognostico = data.prognostico || "Bom";

        /** @type {string} */
        this.necessidadeAssistencia = data.necessidadeAssistencia || data.necessidade_assistencia || "Não";

        // Financeiro
        this.dataPericia = data.dataPericia || data.data_pericia || "";
        this.valorHonorarios = data.valorHonorarios || data.valor_honorarios || 0;
        this.statusPagamento = data.statusPagamento || data.status_pagamento || "Pendente";

        // Campos de Texto Rico
        this.anamnese = data.anamnese || "";
        this.exameFisico = data.exameFisico || data.exame_fisico || "";
        this.examesComplementares = data.examesComplementares || data.exames_complementares || "";
        this.discussao = data.discussao || "";
        this.conclusao = data.conclusao || ""; // Texto HTML

        // Conclusão Estruturada
        this.cid = data.cid || "";
        this.nexo = data.nexo || "";
        this.did = data.did || "";
        this.dii = data.dii || "";
        this.parecer = data.parecer || "Apto";

        /** @type {Processo} */
        this.processo = {
            numero: data.processo?.numero || data.numeroProcesso || data.numero_processo || "", // Fallback
            vara: data.processo?.vara || data.vara || "",
            uf: data.processo?.uf || "",
            comarca: data.processo?.comarca || ""
        };

        // Flat properties for compatibility with existing UI logic if needed,
        // but prefer using the structured objects or flat ones above.
        // We exposed flat properties for author/process above to match current FormController logic.
        this.numeroProcesso = this.processo.numero;
        this.vara = this.processo.vara;

        /** @type {DocumentoMetadata[]} */
        const rawDocs = data.documents || data.documentos;
        this.documents = Array.isArray(rawDocs) ? rawDocs.map(d => ({
            ...d,
            originalName: d.originalName || d.original_name // Migrate on load
        })) : [];

        /** @type {Quesitos} */
        this.quesitos = {
            juizo: Array.isArray(data.quesitos?.juizo) ? data.quesitos.juizo : [],
            autor: Array.isArray(data.quesitos?.autor) ? data.quesitos.autor : [],
            reu: Array.isArray(data.quesitos?.reu) ? data.quesitos.reu : []
        };
        // If 'quesitos' came as a string (HTML), it overrides the object structure in some legacy contexts,
        // but here we keep strict separation. If 'quesitos' is a string in data, it goes to 'this.quesitosHTML' maybe?
        // The current app uses 'quesitos' as a HTML string in the FormController!
        // "quesitos: this.editors['quesitos'].root.innerHTML"
        // So 'quesitos' property is actually a STRING in the current app, not an object.
        // I will fix this definition to match reality.
        if (typeof data.quesitos === 'string') {
             this.quesitos = data.quesitos;
        } else if (!this.quesitos || typeof this.quesitos === 'object') {
             // If it was an object (from the Type definition I saw earlier), convert to string or keep?
             // The previous model defined it as an object, but form.js saved it as HTML string.
             // I will assume it is a STRING for the text editor.
             this.quesitos = typeof data.quesitos === 'string' ? data.quesitos : "";
        }
    }

    /**
     * Adiciona um documento à lista de anexos.
     * @param {DocumentoMetadata} doc
     */
    addDocumento(doc) {
        this.documents.push(doc);
    }

    /**
     * Remove um documento pelo ID.
     * @param {string} id
     */
    removeDocumento(id) {
        this.documents = this.documents.filter(d => d.id !== id);
    }
}
