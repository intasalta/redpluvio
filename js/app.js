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
    pluviometros.forEach(item => {
        const nombre = item.Nombre_del_Pluviometro || 'Pluviómetro';
        const codigo = item.Codigo_txt_del_pluviometro || item.cod || '';
        
        const option = document.createElement('option');
        option.value = codigo || nombre;
        option.textContent = `${nombre} (${codigo})`;
        selectPluviometro.appendChild(option);
    });

    // 4. Renderizar Vista Inicial
    MapManager.renderPluviometros(pluviometros);
    TableManager.render(precipitaciones);

    // 5. Manejar Filtros
    const btnFiltrar = document.getElementById('btn-filtrar');
    btnFiltrar.addEventListener('click', () => {
        const pluviometroSeleccionado = selectPluviometro.value;
        const fechaInicio = document.getElementById('fecha-inicio').value;
        const fechaFin = document.getElementById('fecha-fin').value;

        let datosFiltrados = precipitaciones;

        // Filtrar por Pluviómetro
        if (pluviometroSeleccionado !== 'todos') {
            datosFiltrados = datosFiltrados.filter(item => {
                const cod = item.Pluviometros || item.pluviometro || '';
                return cod === pluviometroSeleccionado;
            });
        }

        // Filtrar por Rango de Fechas
        if (fechaInicio) {
            datosFiltrados = datosFiltrados.filter(item => item.Fecha_del_dato >= fechaInicio);
        }
        if (fechaFin) {
            datosFiltrados = datosFiltrados.filter(item => item.Fecha_del_dato <= fechaFin);
        }

        // Actualizar Tabla con resultados filtrados
        TableManager.render(datosFiltrados);
    });
});
