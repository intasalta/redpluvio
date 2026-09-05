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

    // Normaliza textos removiendo guiones, espacios y símbolos para facilitar el cruce de datos
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

        // Mapeo dinámico de ASSET_PLUVIOMETROS
        const mapaNombresPluvio = {};
        listaPluvio.forEach(p => {
            if (!p) return;

            // Extrae el código desde cualquier posible nombre de clave de Kobo (name, Codigo, id, etc.)
            const codRaw = p.name || p.Codigo_txt_del_pluviometro || p.codigo || p.cod || p._id || '';
            
            // Extrae el nombre oficial desde label, Nombre_del_Pluviometro, etc.
            const nomRaw = p.label || p.Nombre_del_Pluviometro || p.nombre || p.Pluviometro || '';

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

            // Obtener el código enviado en la encuesta diaria de lluvias
            const codigoRaw = (reg.Pluviometros || reg.pluviometro || reg.Codigo_txt_del_pluviometro || reg.codigo || '').toString();
            const codigoLimpio = this.limpiarClave(codigoRaw);

            // Buscar en el mapa dinámico que proviene de ASSET_PLUVIOMETROS
            let nombrePluviometro = reg.Nombre_del_Pluviometro 
                || mapaNombresPluvio[codigoLimpio];

            // Si por algún motivo no coincide la clave, muestra el código limpio capitalizado
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
