const TableManager = {
    getTbody() {
        return document.getElementById('tabla-body');
    },

    mapaFenomenos: {
        'granizo': 'Granizo',
        'tormenta': 'Tormentas eléctricas',
        'viento': 'Vientos fuertes',
        'sinfeno': 'Sin obs. de fenómenos',
        'ninguno': 'Sin obs. de fenómenos',
        'sinfenomeno': 'Sin obs. de fenómenos',
        'sin_fenomeno': 'Sin obs. de fenómenos'
    },

    limpiarClave(txt) {
        return (txt || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    },

    formatearFecha(fechaStr) {
        if (!fechaStr || fechaStr === 'S/D') return 'S/D';
        try {
            const limpia = String(fechaStr).split('T')[0];
            const partes = limpia.split('-');
            if (partes.length === 3) {
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
            return limpia;
        } catch (e) {
            return String(fechaStr);
        }
    },

    render(registros, pluviometros = []) {
        const tbody = this.getTbody();
        if (!tbody) return;

        const lista = Array.isArray(registros) ? registros : [];
        const listaPluvio = Array.isArray(pluviometros) ? pluviometros : [];

        if (lista.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 1rem;">
                        No se encontraron registros de lluvia.
                    </td>
                </tr>
            `;
            return;
        }

        // Mapeo dinámico leyendo todas las claves posibles que envía Kobo
        const mapaNombresPluvio = {};
        listaPluvio.forEach(p => {
            if (!p) return;

            const codRaw = p.name || p.Codigo_txt_del_pluviometro || p.codigo || p.cod || p._id || p.id || '';
            const nomRaw = p.label || p.Nombre_del_Pluviometro || p.nombre || p.Pluviometro || p.titulo || '';

            const keyLimpia = this.limpiarClave(codRaw);
            if (keyLimpia && nomRaw) {
                mapaNombresPluvio[keyLimpia] = nomRaw;
            }
        });

        const rowsHtml = lista.map(reg => {
            if (!reg) return '';

            // Fecha
            const fechaRaw = reg.Fecha_del_dato || reg.start || reg._submission_time || 'S/D';
            const fechaFormateada = this.formatearFecha(fechaRaw);

            // Código enviado en el registro
            const codigoRaw = (reg.Pluviometros || reg.pluviometro || reg.Codigo_txt_del_pluviometro || reg.codigo || '').toString();
            const codigoLimpio = this.limpiarClave(codigoRaw);

            // Búsqueda en el mapa de ASSET_PLUVIOMETROS
            let nombrePluviometro = reg.Nombre_del_Pluviometro 
                || mapaNombresPluvio[codigoLimpio];

            // Si no cruzó con la lista, muestra el valor original con mayúscula inicial
            if (!nombrePluviometro) {
                nombrePluviometro = codigoRaw ? (codigoRaw.charAt(0).toUpperCase() + codigoRaw.slice(1)) : 'Desconocido';
            }

            // Milímetros
            const milimetros = reg.Mil_metros_registrados ?? reg.precipitacion ?? reg.lluvia ?? 0;

            // Fenómeno
            const fenomenoRaw = (reg.fenomeno || reg.observaciones || 'sinfeno').toString().trim().toLowerCase();
            const fenomenoLimpio = this.mapaFenomenos[fenomenoRaw] || (fenomenoRaw ? fenomenoRaw.charAt(0).toUpperCase() + fenomenoRaw.slice(1) : 'Sin obs. de fenómenos');

            return `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td><strong>${nombrePluviometro}</strong></td>
                    <td>${milimetros} mm</td>
                    <td>${fenomenoLimpio}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rowsHtml;
    }
};
