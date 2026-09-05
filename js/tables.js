const TableManager = {
    tbody: document.getElementById('tabla-body'),

    // Mapa oficial extraído de la pestaña choices (qp0ta92)
    mapaFenomenos: {
        'granizo': 'Granizo',
        'tormenta': 'Tormentas eléctricas',
        'viento': 'Vientos fuertes',
        'sinfeno': 'Sin obs. de fenómenos',
        'ninguno': 'Sin obs. de fenómenos',
        'sinfenomeno': 'Sin obs. de fenómenos',
        'sin_fenomeno': 'Sin obs. de fenómenos'
    },

    // Función auxiliar para formatear YYYY-MM-DD a DD/MM/AAAA
    formatearFecha(fechaStr) {
        if (!fechaStr || fechaStr === 'S/D') return 'S/D';
        
        // Limpiar hora si viene en formato ISO (T00:00:00...)
        const limpia = fechaStr.split('T')[0];
        const partes = limpia.split('-');

        if (partes.length === 3) {
            const [anio, mes, dia] = partes;
            return `${dia}/${mes}/${anio}`;
        }

        return limpia;
    },

    render(registros, pluviometros = []) {
        if (!this.tbody) {
            this.tbody = document.getElementById('tabla-body');
            if (!this.tbody) return;
        }

        const lista = Array.isArray(registros) ? registros : [];

        if (lista.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 1rem;">
                        No se encontraron registros de lluvia.
                    </td>
                </tr>
            `;
            return;
        }

        // Mapa dinámico para traducir código de pluviómetro -> Nombre real
        const mapaNombresPluvio = {};
        if (Array.isArray(pluviometros)) {
            pluviometros.forEach(p => {
                const cod = (p.Codigo_txt_del_pluviometro || p.cod || '').toString().trim().toLowerCase();
                const nom = p.Nombre_del_Pluviometro || p.nombre || '';
                if (cod && nom) mapaNombresPluvio[cod] = nom;
            });
        }

        const rowsHtml = lista.map(reg => {
            // 1. Formatear la Fecha a Día/Mes/Año
            const fechaRaw = reg.Fecha_del_dato || reg.start || reg._submission_time || 'S/D';
            const fechaFormateada = this.formatearFecha(fechaRaw);

            // 2. Traducir Nombre del Pluviómetro
            const codigoRaw = (reg.Pluviometros || reg.pluviometro || reg.Codigo_txt_del_pluviometro || '').toString().trim();
            const codigoKey = codigoRaw.toLowerCase();
            const nombrePluviometro = reg.Nombre_del_Pluviometro || mapaNombresPluvio[codigoKey] || codigoRaw || 'Desconocido';

            // 3. Obtener Milímetros de Lluvia
            const milimetros = reg.Mil_metros_registrados ?? reg.precipitacion ?? reg.lluvia ?? 0;

            // 4. Traducir Fenómeno según la pestaña choices de Kobo
            const fenomenoRaw = (reg.fenomeno || reg.observaciones || reg.notes?.[0] || 'sinfeno').toString().trim().toLowerCase();
            const fenomenoLimpio = this.mapaFenomenos[fenomenoRaw] || (fenomenoRaw.charAt(0).toUpperCase() + fenomenoRaw.slice(1));

            return `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td><strong>${nombrePluviometro}</strong></td>
                    <td>${milimetros} mm</td>
                    <td>${fenomelLimpio}</td>
                </tr>
            `;
        }).join('');

        this.tbody.innerHTML = rowsHtml;
    }
};
