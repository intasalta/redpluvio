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

        // 1. Armar el mapa de equivalencias dinámico directamente desde la estructura de Kobo
        const mapaNombres = {};

        listaPluvio.forEach(p => {
            if (!p) return;

            // Extraer el nombre exatamente como lo hace el Mapa (map.js)
            const nombreReal = p.Nombre_del_Pluviometro || p.nombre || p.label || p.title || p.Pluviometro;

            if (!nombreReal) return;

            // Claves/códigos posibles bajo los que Kobo almacena la estación
            const codigosPosibles = [
                p.Codigo_txt_del_pluviometro,
                p.cod,
                p.codigo,
                p.name,
                p.id,
                p._id
            ];

            codigosPosibles.forEach(c => {
                if (c !== undefined && c !== null) {
                    const keyLimpia = String(c).trim().toLowerCase();
                    if (keyLimpia) {
                        mapaNombres[keyLimpia] = String(nombreReal).trim();
                    }
                }
            });
        });

        // 2. Renderizar filas haciendo el cruce con los registros de lluvia
        const rowsHtml = lista.map(reg => {
            if (!reg) return '';

            // Fecha
            const fechaRaw = reg.Fecha_del_dato || reg.start || reg._submission_time || 'S/D';
            const fechaFormateada = this.formatearFecha(fechaRaw);

            // Código de la estación guardado en la respuesta de lluvia
            const codigoRaw = reg.Pluviometros || reg.pluviometro || reg.Codigo_txt_del_pluviometro || reg.codigo || '';
            const keyReg = String(codigoRaw).trim().toLowerCase();

            // Cruce exacto: si coincide el código toma el Nombre_del_Pluviometro de la estación
            let nombreMostrar = mapaNombres[keyReg] 
                || reg.Nombre_del_Pluviometro 
                || reg.nombre;

            // Si por alguna razón no coincidió, muestra la clave original limpia
            if (!nombreMostrar) {
                nombreMostrar = codigoRaw ? (String(codigoRaw).charAt(0).toUpperCase() + String(codigoRaw).slice(1)) : 'Desconocido';
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
