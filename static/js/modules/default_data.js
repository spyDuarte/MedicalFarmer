
export const DEFAULT_MACROS = [
    {
        id: 'def_1',
        titulo: "Anamnese - Dor Lombar",
        categoria: "anamnese",
        conteudo: "Paciente refere dor lombar crônica, irradiada para membro inferior esquerdo, com piora aos esforços físicos e melhora ao repouso. Nega trauma recente. Relata uso de analgésicos e anti-inflamatórios sem melhora significativa."
    },
    {
        id: 'def_2',
        titulo: "Exame Físico - Coluna Lombar",
        categoria: "exame_fisico",
        conteudo: "Deambulação normal, sem claudicação. Mobilidade da coluna lombar preservada, com dor à flexão máxima. Lasègue negativo bilateralmente. Reflexos patelares e aquileus presentes e simétricos. Força muscular grau V global."
    },
    {
        id: 'def_3',
        titulo: "Conclusão - Incapacidade Temporária",
        categoria: "conclusao",
        conteudo: "Com base nos elementos clínicos e documentais apresentados, conclui-se que o periciado apresenta incapacidade total e temporária para o exercício de suas atividades laborais habituais, devendo permanecer afastado para tratamento médico."
    },
    {
        id: 'def_4',
        titulo: "Conclusão - Capacidade Laborativa",
        categoria: "conclusao",
        conteudo: "Não foram constatadas alterações clínicas objetivas que justifiquem a incapacidade laborativa no momento. O periciado encontra-se apto para o exercício de suas atividades laborais."
    },
    {
        id: 'def_5',
        titulo: "Anamnese - Transtorno Depressivo",
        categoria: "anamnese",
        conteudo: "Paciente relata quadro de humor deprimido, anedonia, isolamento social e insônia inicial há aproximadamente 6 meses. Refere fatores estressores no ambiente de trabalho. Em uso de psicofármacos."
    },
    {
        id: 'def_6',
        titulo: "Exame Físico - Psiquiátrico",
        categoria: "exame_fisico",
        conteudo: "Vigil, orientado globalmente. Atenção hipovigil. Memória preservada. Humor hipotímico, afeto embotado. Pensamento de curso lentificado, conteúdo com ideias de menosvalia. Sem alterações de sensopercepção aparentes."
    },
    {
        id: 'def_7',
        titulo: "Conclusão - Nexo Causal (Não há)",
        categoria: "conclusao",
        conteudo: "A análise da fisiopatologia da doença apresentada e das atividades laborais descritas não permite estabelecer nexo de causalidade ou concausalidade entre a moléstia e o trabalho."
    }
];

export const DEFAULT_TEMPLATES = [
    {
        id: 'tmpl_def_1',
        title: "Modelo Ortopedia - Lombalgia",
        data: {
            profissao: "Trabalhador Braçal",
            tempo_funcao: "5 anos",
            desc_atividades: "Carregamento de peso, movimentos repetitivos de flexão e extensão de tronco.",
            antecedentes: "Nega hipertensão ou diabetes. Nega cirurgias prévias.",
            exames_complementares: "Ressonância Magnética de Coluna Lombar (Data: --/--/----): Protrusão discal em L4-L5 e L5-S1, com compressão radicular incipiente.",
            discussao: "O periciado apresenta quadro de lombalgia mecânico-postural crônica, com exames de imagem corroborando a clínica. As atividades laborais exigem esforço físico que atua como concausa para o agravamento da patologia.",
            cid: "M54.5 - Dor lombar baixa",
            nexo: "Concausa",
            did: "",
            dii: "",
            parecer: "Incapaz parcialmente",
            anamnese: "<p><strong>Queixa Principal:</strong> Dor na região lombar.</p><p><strong>História da Doença Atual:</strong> Periciado relata início de dor lombar há aproximadamente 2 anos. Refere que a dor irradia para o membro inferior direito. Piora com esforços de levantamento de peso e melhora parcial com repouso. Faz uso esporádico de anti-inflamatórios.</p><p><strong>História Ocupacional:</strong> Trabalha na empresa Reclamada na função de Ajudante Geral. Realiza atividades de carga e descarga de caminhões.</p>",
            exame_fisico: "<p><strong>Geral:</strong> Bom estado geral, corado, hidratado, eupneico.</p><p><strong>Osteomuscular:</strong> Deambulação normal, sem claudicação. Coluna lombar: Dor à palpação da musculatura paravertebral lombar, contratura muscular presente. Teste de Lasègue negativo bilateralmente. Reflexos patelares e aquileus preservados. Força muscular grau V em membros inferiores. Sem atrofias musculares.</p>",
            conclusao: "<p>Com base no exame clínico e análise documental, conclui-se que o periciado é portador de patologia lombar degenerativa, agravada pelas atividades laborais (Concausa). Há incapacidade parcial e permanente para atividades que exijam sobrecarga de coluna vertebral.</p>",
            quesitos: "<p><strong>1. O periciado é portador de doença ou lesão?</strong><br>Sim, vide diagnóstico.</p><p><strong>2. Há nexo causal com o trabalho?</strong><br>Sim, nexo de concausalidade (agravamento).</p><p><strong>3. Há incapacidade laborativa?</strong><br>Sim, parcial e permanente.</p>"
        }
    },
    {
        id: 'tmpl_def_2',
        title: "Modelo Psiquiatria - Depressão",
        data: {
            profissao: "Assistente Administrativo",
            tempo_funcao: "10 anos",
            desc_atividades: "Atendimento ao cliente, rotinas administrativas, uso de computador e telefone.",
            antecedentes: "Histórico familiar de depressão.",
            exames_complementares: "Relatório Médico (Dr. Fulano - CRM 0000): Paciente em tratamento para Transtorno Depressivo Recorrente, em uso de Sertralina 50mg.",
            discussao: "O quadro clínico é compatível com episódio depressivo moderado. Não há elementos que permitam estabelecer nexo causal direto com as atividades laborais administrativas, tampouco situações traumáticas específicas no trabalho (assédio, acidentes) documentadas.",
            cid: "F33.1 - Transtorno depressivo recorrente, episódio atual moderado",
            nexo: "Não há nexo",
            did: "",
            dii: "",
            parecer: "Incapaz temporariamente",
            anamnese: "<p><strong>Queixa Principal:</strong> Tristeza, desânimo.</p><p><strong>História da Doença Atual:</strong> Relata início dos sintomas há cerca de 6 meses, caracterizados por humor deprimido na maior parte do dia, anedonia, insônia inicial e fadiga. Nega ideação suicida atual. Atribui piora do quadro a problemas financeiros e familiares.</p><p><strong>História Ocupacional:</strong> Nega conflitos com chefia ou colegas de trabalho.</p>",
            exame_fisico: "<p><strong>Exame Psíquico:</strong></p><ul><li>Apresentação: Cuidados pessoais preservados.</li><li>Consciência: Vigil.</li><li>Orientação: Orientado autopsiquicamente e alopsiquicamente.</li><li>Atenção: Hipovigil.</li><li>Memória: Preservada para fatos recentes e remotos.</li><li>Humor: Hipotímico.</li><li>Afeto: Embotado, modulando pouco.</li><li>Pensamento: Curso normal, forma lógica, conteúdo com ideias de ruína e menosvalia.</li><li>Sensopercepção: Sem alterações.</li><li>Juízo Crítico: Preservado.</li></ul>",
            conclusao: "<p>O periciado apresenta quadro de Transtorno Depressivo Recorrente em fase ativa, determinando incapacidade total e temporária para o trabalho. Não há nexo causal ou concausal com as atividades laborais na Reclamada.</p>",
            quesitos: "<p><strong>1. O periciado é portador de doença mental?</strong><br>Sim.</p><p><strong>2. A doença tem relação com o trabalho?</strong><br>Não.</p><p><strong>3. O periciado está incapacitado?</strong><br>Sim, temporariamente, necessitando de tratamento psiquiátrico e afastamento laboral por sugeridos 60 dias.</p>"
        }
    },
    {
        id: 'tmpl_def_3',
        title: "Modelo Neurologia - Túnel do Carpo",
        data: {
            profissao: "Digitador / Operador de Telemarketing",
            tempo_funcao: "8 anos",
            desc_atividades: "Digitação contínua, uso de mouse, atendimento telefônico com headset.",
            antecedentes: "Hipotireoidismo em tratamento.",
            exames_complementares: "Eletroneuromiografia de MMSS: Síndrome do Túnel do Carpo bilateral, grau moderado à direita e leve à esquerda.",
            discussao: "A Síndrome do Túnel do Carpo é uma neuropatia compressiva do nervo mediano. Atividades com movimentos repetitivos de punhos e dedos e/ou vibração são fatores de risco biomecânicos reconhecidos. O nexo causal é estabelecido pela exposição ergonômica comprovada.",
            cid: "G56.0 - Síndrome do túnel do carpo",
            nexo: "Nexo Causal Individual",
            did: "",
            dii: "",
            parecer: "Incapaz temporariamente",
            anamnese: "<p><strong>Queixa Principal:</strong> Dormência nas mãos.</p><p><strong>História da Doença Atual:</strong> Refere parestesias (formigamento) em ambas as mãos, predominantemente nos dedos polegar, indicador e médio, com piora noturna. Início há 1 ano. Relata diminuição de força de preensão e queda de objetos das mãos.</p><p><strong>História Ocupacional:</strong> Realiza digitação por cerca de 6 horas diárias.</p>",
            exame_fisico: "<p><strong>Membros Superiores:</strong></p><ul><li>Inspeção: Sem atrofias tenares ou hipotenares visíveis. Sem deformidades.</li><li>Palpação: Sem dor à palpação de epicôndilos.</li><li>Testes Específicos:</li><li>Phalen: Positivo bilateralmente (reprodução de parestesia em 30 segundos).</li><li>Tinel: Positivo à percussão do nervo mediano em punho direito.</li><li>Finkelstein: Negativo.</li><li>Força e Sensibilidade: Diminuição tátil em território de nervo mediano à direita. Força de pinça preservada.</li></ul>",
            conclusao: "<p>Conclui-se que o(a) periciado(a) é portador(a) de Síndrome do Túnel do Carpo Bilateral, relacionada às atividades laborais (LER/DORT). Há incapacidade total e temporária para atividades que exijam movimentos repetitivos de punhos, devendo realizar tratamento fisioterápico.</p>",
            quesitos: "<p><strong>1. Qual o diagnóstico?</strong><br>Síndrome do Túnel do Carpo (G56.0).</p><p><strong>2. É doença ocupacional?</strong><br>Sim, classificada como LER/DORT.</p><p><strong>3. Há incapacidade?</strong><br>Sim, temporária para a função habitual.</p>"
        }
    }
];
