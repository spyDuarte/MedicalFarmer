
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
 * @property {string} nome - Nome do arquivo
 * @property {number} tamanho - Tamanho em bytes
 * @property {string} tipo - Tipo MIME
 * @property {string} data_upload - Data do upload (ISO 8601)
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
 * @property {boolean} nexo_causal - Se há nexo causal
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
        this.created_at = data.created_at || new Date().toISOString();

        /** @type {string} - Status do laudo (e.g. "Em Andamento", "Concluído") */
        this.status = data.status || "Aguardando";

        /** @type {string} */
        this.objetivo = data.objetivo || DEFAULTS.OBJETIVO;

        /** @type {string} */
        this.metodologia = data.metodologia || DEFAULTS.METODOLOGIA;

        /** @type {string} */
        this.local_pericia = data.local_pericia || "";

        /** @type {string} */
        this.assistentes = data.assistentes || "Ausentes";

        /** @type {string} */
        this.historico_previdenciario = data.historico_previdenciario || "";

        /** @type {string} */
        this.bibliografia = data.bibliografia || "";

        /** @type {string} */
        this.tipo_acao = data.tipo_acao || "Trabalhista";

        /** @type {string} */
        this.estado_civil = data.estado_civil || "";

        /** @type {string} */
        this.ctps = data.ctps || "";

        /** @type {string} */
        this.mao_dominante = data.mao_dominante || "Destro";

        /** @type {string} */
        this.epis = data.epis || "";

        /** @type {string} */
        this.cnh = data.cnh || "";

        /** @type {string|null} */
        this.data_acidente = data.data_acidente || null;

        /** @type {string} */
        this.prognostico = data.prognostico || "Bom";

        /** @type {string} */
        this.necessidade_assistencia = data.necessidade_assistencia || "Não";

        /** @type {Processo} */
        this.processo = {
            numero: data.processo?.numero || "",
            vara: data.processo?.vara || "",
            uf: data.processo?.uf || "",
            comarca: data.processo?.comarca || ""
        };

        /** @type {Partes} */
        this.partes = {
            autor: data.partes?.autor || "",
            reu: data.partes?.reu || ""
        };

        /** @type {Datas} */
        this.datas = {
            nomeacao: data.datas?.nomeacao || null,
            diligencia: data.datas?.diligencia || null,
            entrega: data.datas?.entrega || null
        };

        /** @type {DocumentoMetadata[]} */
        this.documentos = Array.isArray(data.documentos) ? data.documentos : [];

        /** @type {Quesitos} */
        this.quesitos = {
            juizo: Array.isArray(data.quesitos?.juizo) ? data.quesitos.juizo : [],
            autor: Array.isArray(data.quesitos?.autor) ? data.quesitos.autor : [],
            reu: Array.isArray(data.quesitos?.reu) ? data.quesitos.reu : []
        };

        /** @type {string} - Anamnese (texto rico/HTML) */
        this.anamnese = data.anamnese || "";

        /** @type {string} - Exame Físico (texto rico/HTML) */
        this.exame_fisico = data.exame_fisico || "";

        /** @type {Conclusao} */
        this.conclusao = {
            texto: data.conclusao?.texto || "",
            nexo_causal: typeof data.conclusao?.nexo_causal === 'boolean' ? data.conclusao.nexo_causal : false,
            diagnostico: data.conclusao?.diagnostico || "",
            did: data.conclusao?.did || "",
            dii: data.conclusao?.dii || ""
        };
    }

    /**
     * Adiciona um documento à lista de anexos.
     * @param {DocumentoMetadata} doc
     */
    addDocumento(doc) {
        this.documentos.push(doc);
    }

    /**
     * Remove um documento pelo ID.
     * @param {string} id
     */
    removeDocumento(id) {
        this.documentos = this.documentos.filter(d => d.id !== id);
    }

    /**
     * Adiciona um quesito para uma das partes.
     * @param {'juizo'|'autor'|'reu'} parte
     * @param {string} texto
     */
    addQuesito(parte, texto) {
        if (this.quesitos[parte]) {
            this.quesitos[parte].push({
                id: Date.now().toString() + Math.random().toString().slice(2, 5),
                texto: texto,
                resposta: ""
            });
        }
    }
}
