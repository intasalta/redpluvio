document.addEventListener('DOMContentLoaded', async () => {
    MapManager.init('map', [-24.89, -65.48], 8);

    const [pluviometros, precipitaciones] = await Promise.all([
        API.getPluviometros(),
        API.getPrecipitaciones()
    ]);

    const selectPluviometro = document.getElementById('select-pluviometro');
    if (selectPluviometro && Array.isArray(pluviometros)) {
        pluviometros.forEach(item => {
            const nombre = item.Nombre_del_Pluviometro || 'Pluviómetro';
            const codigo = item.Codigo_txt_del_pluviometro || item.cod || '';
            const option = document.createElement('option');
            option.value = codigo || nombre;
            option.textContent = `${nombre} (${codigo})`;
            selectPluviometro.appendChild(option);
        });
    }

    // 1. Determinar el último día con datos registrados
    let registrosUltimoDia = [];
    if (Array.isArray(precipitaciones) && precipitaciones.length > 0) {
        const ordenados = [...precipitaciones].sort((a, b) => {
            const fA = new Date(a.Fecha_del_dato || a.start || a._submission_time);
            const fB = new Date(b.Fecha_del_dato || b.start || b._submission_time);
            return fB - fA;
        });

        const ultimaFecha = (ordenados[0].Fecha_del_dato || ordenados[0].start || ordenados[0]._submission_time || '').split('T')[0];

        registrosUltimoDia = ordenados.filter(item => {
            const f = (item.Fecha_del_dato || item.start || item._submission_time || '').split('T')[0];
            return f === ultimaFecha;
        });

        // Setear campos de fecha
        const inputInicio = document.getElementById('fecha-inicio');
        const inputFin = document.getElementById('fecha-fin');
        if (inputInicio) inputInicio.value = ultimaFecha;
        if (inputFin) inputFin.value = ultimaFecha;
    }

    // 2. Renderizar Inicial: solo los puntos con registros de esa fecha y sus mm
    MapManager.renderPluviometros(pluviometros, registrosUltimoDia);
    TableManager.render(registrosUltimoDia);

    // 3. Renderizar Filtrado Manual
    const btnFiltrar = document.getElementById('btn-filtrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            const pluviometroSeleccionado = selectPluviometro ? selectPluviometro.value : 'todos';
            const fechaInicio = document.getElementById('fecha-inicio')?.value;
            const fechaFin = document.getElementById('fecha-fin')?.value;

            let datosFiltrados = Array.isArray(precipitaciones) ? precipitaciones : [];

            if (pluviometroSeleccionado && pluviometroSeleccionado !== 'todos') {
                datosFiltrados = datosFiltrados.filter(item => {
                    const cod = item.Pluviometros || item.pluviometro || item.Codigo_txt_del_pluviometro || '';
                    return cod === pluviometroSeleccionado;
                });
            }

            if (fechaInicio) {
                datosFiltrados = datosFiltrados.filter(item => {
                    const f = (item.Fecha_del_dato || item.start || '').split('T')[0];
                    return f >= fechaInicio;
                });
            }
            if (fechaFin) {
                datosFiltrados = datosFiltrados.filter(item => {
                    const f = (item.Fecha_del_dato || item.start || '').split('T')[0];
                    return f <= fechaFin;
                });
            }

            // Actualizar tabla y actualizar el mapa con los mm exactos del rango filtrado
            TableManager.render(datosFiltrados);
            MapManager.renderPluviometros(pluviometros, datosFiltrados);
        });
    }
});
