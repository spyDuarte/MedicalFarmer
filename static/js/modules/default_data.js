
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
    },
    {
        id: 'tmpl_def_4',
        title: "Modelo Ortopedia - Ombro Doloroso",
        data: {
            profissao: "Pintor / Armazenista",
            tempo_funcao: "8 anos",
            desc_atividades: "Movimentos de elevação e abdução de membros superiores acima da linha dos ombros, carregamento de peso.",
            antecedentes: "Nega trauma em ombros. Nega diabetes.",
            exames_complementares: "Ultrassom de Ombro Direito (Data: --/--/----): Tendinopatia do supraespinhal e bursite subacromial/subdeltoidea.",
            discussao: "O quadro clínico e os exames de imagem evidenciam patologia inflamatória/degenerativa em ombro direito. As atividades laborais descritas, exigindo elevação de braços e esforço físico, atuam como fator de risco biomecânico (Nexo Técnico Epidemiológico presente para diversas atividades).",
            cid: "M75.1 - Síndrome do manguito rotador",
            nexo: "Concausa",
            did: "",
            dii: "",
            parecer: "Incapaz temporariamente",
            anamnese: "<p><strong>Queixa Principal:</strong> Dor em ombro direito.</p><p><strong>História da Doença Atual:</strong> Relata início de dor no ombro direito há cerca de 1 ano, com dificuldade para elevar o braço e pentear o cabelo. Dor noturna ao deitar sobre o ombro afetado.</p>",
            exame_fisico: "<p><strong>Membros Superiores:</strong></p><ul><li>Inspeção: Sem atrofias importantes.</li><li>Mobilidade: Elevação ativa limitada a 90º por dor. Rotações preservadas.</li><li>Manobras Específicas:</li><li>Neer: Positivo.</li><li>Hawkins: Positivo.</li><li>Jobe: Doloroso, força preservada.</li><li>Patte: Negativo.</li><li>Gerber: Negativo.</li></ul>",
            conclusao: "<p>Há incapacidade temporária para a função habitual devido à sintomatologia álgica e limitação funcional. Há nexo de concausalidade com o trabalho.</p>",
            quesitos: "<p><strong>1. Diagnóstico?</strong><br>Síndrome do Manguito Rotador (M75.1).</p><p><strong>2. Nexo?</strong><br>Sim, concausa.</p>"
        }
    },
    {
        id: 'tmpl_def_5',
        title: "Modelo Ortopedia - Gonartrose",
        data: {
            profissao: "Pedreiro",
            tempo_funcao: "15 anos",
            desc_atividades: "Agachamentos frequentes, subida e descida de escadas, carregamento de peso.",
            antecedentes: "Obesidade Grau I.",
            exames_complementares: "RX de Joelhos: Redução do espaço articular femorotibial medial, esclerose subcondral e osteófitos marginais.",
            discussao: "A gonartrose é uma doença degenerativa da cartilagem articular. Fatores constitucionais (idade, peso) são preponderantes. O trabalho com sobrecarga pode atuar como fator agravante (concausa) em casos específicos de alta demanda.",
            cid: "M17 - Gonartrose [artrose do joelho]",
            nexo: "Concausa",
            did: "",
            dii: "",
            parecer: "Incapaz parcialmente",
            anamnese: "<p><strong>Queixa Principal:</strong> Dor nos joelhos.</p><p><strong>História da Doença Atual:</strong> Dor progressiva nos joelhos, pior à direita, tipo mecânica. Dificuldade para agachar e subir escadas. Nega bloqueios articulares.</p>",
            exame_fisico: "<p><strong>Membros Inferiores:</strong></p><ul><li>Alinhamento: Varo de joelhos.</li><li>Edema: Ausente.</li><li>Palpação: Dor na interlinha articular medial.</li><li>Movimento: Flexão limitada a 100º. Extensão completa.</li><li>Crepitação: Presente à mobilização.</li><li>Gavetas e Lachman: Negativos.</li><li>McMurray: Prejudicado pela dor/limitação.</li></ul>",
            conclusao: "<p>Incapacidade parcial e permanente para atividades que exijam agachamento repetitivo e sobrecarga de joelhos.</p>",
            quesitos: "<p><strong>1. Diagnóstico?</strong><br>Gonartrose (M17).</p><p><strong>2. Nexo?</strong><br>Concausa (agravamento).</p>"
        }
    },
    {
        id: 'tmpl_def_6',
        title: "Modelo Psiquiatria - Ansiedade",
        data: {
            profissao: "Bancário / Atendente",
            tempo_funcao: "4 anos",
            desc_atividades: "Atendimento ao público, metas de vendas.",
            antecedentes: "Nega tratamento psiquiátrico prévio.",
            exames_complementares: "Atestado Médico: CID F41.1, em uso de Escitalopram 10mg.",
            discussao: "O Transtorno de Ansiedade Generalizada caracteriza-se por preocupação excessiva e persistente. O ambiente de trabalho pode atuar como estressor, mas a etiologia é multifatorial.",
            cid: "F41.1 - Transtorno de ansiedade generalizada",
            nexo: "Não há nexo",
            did: "",
            dii: "",
            parecer: "Apto",
            anamnese: "<p><strong>Queixa Principal:</strong> Nervosismo, taquicardia.</p><p><strong>História da Doença Atual:</strong> Relata que há 1 ano sente-se muito ansioso, com palpitações, sudorese e medo constante. Relata cobrança por metas no trabalho.</p>",
            exame_fisico: "<p><strong>Exame Psíquico:</strong></p><ul><li>Apresentação: Colaborativo, ansioso.</li><li>Humor: Ansioso.</li><li>Afeto: Modulante.</li><li>Pensamento: Acelerado, conteúdo de preocupação.</li><li>Sem sintomas psicóticos.</li></ul>",
            conclusao: "<p>Ao exame atual, não se observam elementos de descompensação aguda que justifiquem incapacidade laborativa. O tratamento medicamentoso está em curso e é compatível com a manutenção do labor.</p>",
            quesitos: "<p><strong>1. Há doença?</strong><br>Sim, transtorno de ansiedade.</p><p><strong>2. Há incapacidade?</strong><br>Não há incapacidade laborativa no momento.</p>"
        }
    },
    {
        id: 'tmpl_def_7',
        title: "Modelo ORL - PAIR",
        data: {
            profissao: "Operador de Máquinas",
            tempo_funcao: "12 anos",
            desc_atividades: "Operação de prensa em ambiente ruidoso (88dB).",
            antecedentes: "Nega otites de repetição.",
            exames_complementares: "Audiometria Tonal: Perda auditiva neurossensorial bilateral, simétrica, com entalhe audiométrico em 4kHz e 6kHz.",
            discussao: "O traçado audiométrico é sugestivo de Perda Auditiva Induzida por Ruído (PAIR), caracterizada por ser neurossensorial, bilateral, irreversível e não progressiva após cessada a exposição.",
            cid: "H83.3 - Efeitos do ruído sobre o ouvido interno",
            nexo: "Nexo Causal",
            did: "",
            dii: "",
            parecer: "Apto com restrições",
            anamnese: "<p><strong>Queixa Principal:</strong> Dificuldade para ouvir em ambientes barulhentos.</p><p><strong>História:</strong> Relata zumbido ocasional. Nega tonturas.</p>",
            exame_fisico: "<p><strong>Otoscopia:</strong> Membranas timpânicas íntegras e translúcidas, triângulo luminoso presente.</p>",
            conclusao: "<p>Portador de PAIR. Há redução da capacidade auditiva, porém não há incapacidade para o trabalho, desde que haja uso regular de EPI (protetor auricular) e monitoramento audiométrico.</p>",
            quesitos: "<p><strong>1. Diagnóstico?</strong><br>PAIR (H83.3).</p><p><strong>2. Nexo?</strong><br>Sim, nexo causal.</p>"
        }
    }
];
