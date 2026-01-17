
const CID10_DATA = [
    {code: "F32", desc: "Episódio depressivo"},
    {code: "F33", desc: "Transtorno depressivo recorrente"},
    {code: "F41", desc: "Outros transtornos ansiosos"},
    {code: "F43.1", desc: "Estado de estresse pós-traumático"},
    {code: "M54.5", desc: "Dor lombar baixa"},
    {code: "M51.1", desc: "Transtorno de disco lombar e de outros discos intervertebrais com radiculopatia"},
    {code: "M75.1", desc: "Síndrome do manguito rotador"},
    {code: "M77.1", desc: "Epicondilite lateral"},
    {code: "S82", desc: "Fratura da perna, incluindo tornozelo"},
    {code: "S62", desc: "Fratura ao nível do punho e da mão"},
    {code: "G56.0", desc: "Síndrome do túnel do carpo"},
    {code: "M17", desc: "Gonartrose [artrose do joelho]"},
    {code: "M16", desc: "Coxartrose [artrose do quadril]"},
    {code: "I10", desc: "Hipertensão essencial (primária)"},
    {code: "E11", desc: "Diabetes mellitus não-insulino-dependente"},
    {code: "Z00.0", desc: "Exame médico geral"}
];

const CID10 = {
    search(query) {
        if (!query || query.length < 2) return [];
        query = query.toLowerCase();
        return CID10_DATA.filter(c =>
            c.code.toLowerCase().includes(query) ||
            c.desc.toLowerCase().includes(query)
        );
    }
};
