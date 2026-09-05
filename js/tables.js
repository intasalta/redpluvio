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

    formatearFecha(fechaStr) {
        if (!fechaStr || fechaStr === 'S/D') return 'S/D';
        try {
            const limpia = String(fechaStr).split('T')[0];
            const partes = limpia.split('-');
            if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
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

        // 1. CONSTRUIR LA RELACIÓN (JOIN)
        // Mapeamos todas las estaciones asociando cada posible código con su Nombre_del_Pluviometro
        const relacionEstaciones = {};

        listaPluvio.forEach(estacion => {
            if (!estacion) return;

            // Extraer el nombre legible de la estación
            const nombreLegible = estacion.Nombre_del_Pluviometro || estacion.nombre || estacion.label;
            if (!nombreLegible) return;

            // Inspeccionar TODAS las claves del objeto de la estación para encontrar el código
            Object.keys(estacion).forEach(key => {
                // Buscamos claves como Codigo_txt_del_pluviometro, cod, codigo, etc.
                if (key.toLowerCase().includes('codigo') || key.toLowerCase().includes('pluvio') || key === 'cod' || key === 'name') {
                    const valCodigo = estacion[key];
                    if (valCodigo !== undefined && valCodigo !== null) {
                        const claveLimpia = String(valCodigo).trim().toLowerCase().replace(/\.0$/, '');
                        if (claveLimpia) {
                            relacionEstaciones[claveLimpia] = String(nombreLegible).trim();
                        }
                    }
                }
            });
        });

        // 2. RENDERIZAR TABLA CON LA RELACIÓN APLICADA
        const rowsHtml = lista.map(reg => {
            if (!reg) return '';

            // Fecha
            const fechaRaw = reg.Fecha_del_dato || reg.start || reg._submission_time || 'S/D';
            const fechaFormateada = this.formatearFecha(fechaRaw);

            // Código del pluviómetro en el registro de lluvias
            const codigoRegistro = (reg.Pluviometros || reg.pluviometro || reg.Codigo_txt_del_pluviometro || '').toString().trim().toLowerCase().replace(/\.0$/, '');

            // Buscar en la relación por el código exacto
            let nombreMostrar = relacionEstaciones[codigoRegistro];

            // Si por alguna razón no está en la relación del mapa, se limpia la clave como respaldo
            if (!nombreMostrar) {
                nombreMostrar = codigoRegistro ? (codigoRegistro.charAt(0).toUpperCase() + codigoRegistro.slice(1)) : 'Desconocido';
            }

            // Lluvia
            const milimetros = reg.Mil_metros_registrados ?? reg.precipitacion ?? reg.lluvia ?? 0;

            // Fenómeno
            const fenomenoRaw = (reg.fenomeno || reg.observaciones || 'sinfeno').toString().trim().toLowerCase();
            const fenomenoLimpio = this.mapaFenomenos[fenomenoRaw] || (fenomenoRaw ? fenomenoRaw.charAt(0).toUpperCase() + fenomenoRaw.slice(1) : 'Sin obs. de fenómenos');

            return `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td><strong>${nombreMostrar}</strong></td>
                    <td>${milimetros} mm</td>
                    <td>${fenomenoLimpio}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rowsHtml;
    }
};
