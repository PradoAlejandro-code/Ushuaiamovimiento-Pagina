export const procesarDatosParaGraficos = (preguntas, respuestas) => {
    // Filtramos solo las preguntas "medibles" (Opciones o Números)
    const preguntasMedibles = preguntas.filter(p =>
        p.tipo === 'opciones' || p.tipo === 'numero'
    );

    return preguntasMedibles.map(pregunta => {
        const conteo = {};

        // Recorremos todas las respuestas de usuarios
        respuestas.forEach(respuestaHeader => {
            // Buscamos el detalle correspondiente a esta pregunta específica
            // Nota: En el backend 'pregunta' viene como ID en RespuestaDetalleOutputSerializer
            const detalle = respuestaHeader.detalles.find(d => d.pregunta === pregunta.id);

            if (detalle) {
                // Si es numérico, lo tratamos como categoría (ej: "5 estrellas")
                // Si es opción, usamos el texto (ej: "Secundario")
                const valor = detalle.valor_texto || (detalle.valor_numero !== null ? detalle.valor_numero.toString() : null);

                if (valor) {
                    conteo[valor] = (conteo[valor] || 0) + 1;
                }
            }
        });

        // Convertimos el objeto de conteo en Array para Recharts
        // De { "Si": 5, "No": 3 } a [ { name: "Si", value: 5 }, { name: "No", value: 3 } ]
        const dataGrafico = Object.keys(conteo).map(key => ({
            name: key,
            value: conteo[key]
        }));

        return {
            titulo: pregunta.titulo,
            id: pregunta.id,
            tipo: pregunta.tipo,
            data: dataGrafico
        };
    });
};

export const procesarParticipacionPorUsuario = (respuestas) => {
    if (!respuestas || respuestas.length === 0) return null;

    const conteo = {};

    respuestas.forEach(r => {
        const userId = r.usuario_id || 'anon';
        const userName = r.usuario_nombre || `Usuario #${userId}`;
        const userFoto = r.usuario_foto || null;

        if (!conteo[userId]) {
            conteo[userId] = {
                name: userName, // Esto se muestra en el Tooltip
                id: userId,
                image: userFoto, // URL de la foto
                value: 0
            };
        }
        conteo[userId].value += 1;
    });

    const dataGrafico = Object.values(conteo).sort((a, b) => b.value - a.value);

    return {
        titulo: "Participación por Usuario",
        id: "users_participation",
        tipo: "bar", // Forzamos tipo barra
        extraType: "users", // Flag para que el ChartCard sepa renderizar fotos
        data: dataGrafico
    };
};
