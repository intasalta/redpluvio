document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar Mapa (Centrado preliminarmente en Salta)
    MapManager.init('map', [-24.89, -65.48], 8);

    // 2. Cargar datos en paralelo desde la API Proxy
    const [pluviometros, precipitaciones] = await Promise.all([
        API.getPluviometros(),
        API.getPrecipitaciones()
    ]);

    // 3. Poblar Selector de Pluviómetros
    const selectPluviometro = document.getElementById('select-pluviometro');
    if (selectPluviometro) {
        pluviometros.forEach(item => {
            const nombre = item.Nombre_del_Pluviometro || 'Pluviómetro';
            const codigo = item.Codigo_txt_del_pluviometro || item.cod || '';
            
            const option = document.createElement('option');
            option.value = codigo || nombre;
            option.textContent = `${nombre} (${codigo})`;
            selectPluviometro.appendChild(option);
        });
    }

    // 4. Renderizar Marcadores del Mapa de inmediato
    MapManager.renderPluviometros(pluviometros);

    // 5. Filtrar para mostrar ÚNICAMENTE el último día registrado al iniciar
    let registrosIniciales = [];
    if (Array.isArray(precipitaciones) && precipitaciones.length > 0) {
        // Ordenar registros de más reciente a más antiguo
        const ordenados = [...precipitaciones].sort((a, b) => {
            const fA = new Date(a.Fecha_del_dato || a.start || a._submission_time);
            const fB = new Date(b.Fecha_del_dato || b.start || b._submission_time);
            return fB - fA;
        });

        // Obtener la fecha del registro más reciente (YYYY-MM-DD)
        const ultimaFecha = (ordenados[0].Fecha_del_dato || ordenados[0].start || ordenados[0]._submission_time || '').split('T')[0];

        // Filtrar solo las mediciones asociadas a ese último día
        registrosIniciales = ordenados.filter(item => {
            const f = (item.Fecha_del_dato || item.start || item._submission_time || '').split('T')[0];
            return f === ultimaFecha;
        });

        // Autocompletar los campos de fecha en el formulario
        const inputInicio = document.getElementById('fecha-inicio');
        const inputFin = document.getElementById('fecha-fin');
        if (inputInicio) inputInicio.value = ultimaFecha;
        if (inputFin) inputFin.value = ultimaFecha;
    }

    // Cargar la tabla liviana solo con los datos de ese día
    TableManager.render(registrosIniciales);

    // 6. Manejar Filtros (Busca en el historial completo al presionar el botón)
    const btnFiltrar = document.getElementById('btn-filtrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            const pluviometroSeleccionado = selectPluviometro ? selectPluviometro.value : 'todos';
            const fechaInicio = document.getElementById('fecha-inicio')?.value;
            const fechaFin = document.getElementById('fecha-fin')?.value;

            let datosFiltrados = Array.isArray(precipitaciones) ? precipitaciones : [];

            // Filtrar por Pluviómetro
            if (pluviometroSeleccionado && pluviometroSeleccionado !== 'todos') {
                datosFiltrados = datosFiltrados.filter(item => {
                    const cod = item.Pluviometros || item.pluviometro || item.Codigo_txt_del_pluviometro || '';
                    return cod === pluviometroSeleccionado;
                });
            }

            // Filtrar por Rango de Fechas
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

            // Actualizar Tabla con los resultados filtrados
            TableManager.render(datosFiltrados);
        });
    }
});
