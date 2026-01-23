
import { DEFAULTS } from './constants.js';

/**
 * @typedef {Object} DocumentMetadata
 * @property {string|number} id - Unique file identifier.
 * @property {string} originalName - Original file name.
 */

/**
 * @typedef {Object} Address
 * @property {string} cep - ZIP code.
 * @property {string} logradouro - Street name.
 * @property {string} numero - Number.
 * @property {string} complemento - Complement.
 * @property {string} bairro - Neighborhood.
 * @property {string} cidade - City.
 * @property {string} uf - State (2 chars).
 */

/**
 * Class representing a complete Forensic Case Model.
 */
export class Pericia {
    /**
     * Creates a new Pericia instance.
     * @param {Object} [data={}] - Initial data to populate the model.
     */
    constructor(data = {}) {
        /** @type {string|number} */
        this.id = data.id || Date.now();

        /** @type {string} */
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();

        /** @type {string} - Case status (e.g., "Em Andamento", "Concluído"). */
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

        // Personal Data (Flat structure for Binder compatibility)
        this.nomeAutor = data.nomeAutor || data.nome_autor || "";
        this.dataNascimento = data.dataNascimento || data.data_nascimento || "";
        this.cpf = data.cpf || "";
        this.rg = data.rg || "";
        this.escolaridade = data.escolaridade || "";

        /** @type {Address} */
        this.endereco = {
            cep: data.endereco?.cep || "",
            logradouro: data.endereco?.logradouro || "",
            numero: data.endereco?.numero || "",
            complemento: data.endereco?.complemento || "",
            bairro: data.endereco?.bairro || "",
            cidade: data.endereco?.cidade || "",
            uf: data.endereco?.uf || ""
        };

        // Occupational History
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

        // Financial Data
        this.dataPericia = data.dataPericia || data.data_pericia || "";
        this.valorHonorarios = data.valorHonorarios || data.valor_honorarios || 0;
        this.statusPagamento = data.statusPagamento || data.status_pagamento || "Pendente";

        // Rich Text Fields (HTML)
        this.anamnese = data.anamnese || "";
        this.exameFisico = data.exameFisico || data.exame_fisico || "";
        this.examesComplementares = data.examesComplementares || data.exames_complementares || "";
        this.discussao = data.discussao || "";
        this.conclusao = data.conclusao || "";

        // Structured Conclusion Data
        this.cid = data.cid || "";
        this.nexo = data.nexo || "";
        this.did = data.did || "";
        this.dii = data.dii || "";
        this.parecer = data.parecer || "Apto";

        // Process Data
        this.numeroProcesso = data.numeroProcesso || data.numero_processo || "";
        this.vara = data.vara || "";

        /** @type {DocumentMetadata[]} */
        const rawDocs = data.documents || data.documentos;
        this.documents = Array.isArray(rawDocs) ? rawDocs.map(d => ({
            id: d.id,
            originalName: d.originalName || d.original_name // Normalization
        })) : [];

        // Questions (Quesitos) - Stored as HTML string in current implementation
        this.quesitos = (typeof data.quesitos === 'string') ? data.quesitos : "";
    }

    /**
     * Adds a document to the list.
     * @param {DocumentMetadata} doc
     */
    addDocument(doc) {
        this.documents.push(doc);
    }

    /**
     * Removes a document by ID.
     * @param {string|number} id
     */
    removeDocument(id) {
        // eslint-disable-next-line eqeqeq
        this.documents = this.documents.filter(d => d.id != id);
    }
}
