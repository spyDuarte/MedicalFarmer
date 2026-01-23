
/* Simple CID-10 Mock Data for Autocomplete - Expanded */
export const CID10 = {
    search(query) {
        if (!query || query.length < 3) return [];
        query = query.toLowerCase();

        // This is a small subset. Real app would load a full JSON or fetch from API.
        const data = [
            {code: "M54.4", desc: "Lumbago com ciática"},
            {code: "M54.5", desc: "Dor lombar baixa (Lombalgia)"},
            {code: "M51.1", desc: "Transtorno de disco lombar e de outros discos intervertebrais com radiculopatia"},
            {code: "M75.1", desc: "Síndrome do manguito rotador"},
            {code: "G56.0", desc: "Síndrome do túnel do carpo"},
            {code: "F32",   desc: "Episódios depressivos"},
            {code: "F32.2", desc: "Episódio depressivo grave sem sintomas psicóticos"},
            {code: "F41.1", desc: "Ansiedade generalizada"},
            {code: "S82",   desc: "Fratura da perna, incluindo tornozelo"},
            {code: "M17",   desc: "Gonartrose [artrose do joelho]"},
            {code: "M16",   desc: "Coxartrose [artrose do quadril]"},
            {code: "M25.5", desc: "Dor articular"},
            {code: "Z02.7", desc: "Emissão de atestado médico"}
        ];

        return data.filter(item =>
            item.code.toLowerCase().includes(query) ||
            item.desc.toLowerCase().includes(query)
        );
    }
};
