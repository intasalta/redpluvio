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

    // Normalizador estándar: pasa a minúsculas, quita extensiones float y recorta espacios
    normalizarCodigo(txt) {
        if (txt === null || txt === undefined) return '';
        return String(txt)
            .trim()
            .toLowerCase()
            .replace(/\.0$/, '');
    },

    // Extrae texto si Kobo devuelve un objeto/array de idioma
    extraerTexto(val) {
        if (!val) return '';
        if (typeof val === 'string') return val.trim();
        if (Array.isArray(val)) return val[0] ? this.extraerTexto(val[0]) : '';
        if (typeof val === 'object') {
            return val.es || val.Spanish || val.label || Object.values(val)[0] || '';
        }
        return String(val).trim();
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

        // 1. Mapa de Equivalencias: Código Corto -> Nombre Real de la Estación
        const mapaNombres = {};

        listaPluvio.forEach(p => {
            if (!p) return;

            // Nombre completo real (ej: "El Algarrobal")
            const nombreReal = this.extraerTexto(
                p.Nombre_del_Pluviometro || p.nombre || p.label || p.title || p.Pluviometro
            );

            // Guardar asociando TODOS los posibles identificadores del pluviómetro
            const posiblesCodigos = [
                p.Codigo_txt_del_pluviometro,
                p.cod,
                p.codigo,
                p.name,
                p.id,
                p._id
            ];

            posiblesCodigos.forEach(cod => {
                const key = this.normalizarCodigo(cod);
                if (key && nombreReal) {
                    mapaNombres[key] = nombreReal;
                }
            });
            
            // También mapear por el propio nombre si viniera en minúsculas
            if (nombreReal) {
                mapaNombres[this.normalizarCodigo(nombreReal)] = nombreReal;
            }
        });

        // 2. Renderizado de filas cruzando cada registro
        const rowsHtml = lista.map(reg => {
            if (!reg) return '';

            // Fecha
            const fechaRaw = reg.Fecha_del_dato || reg.start || reg._submission_time || 'S/D';
            const fechaFormateada = this.formatearFecha(fechaRaw);

            // Código enviado por la app en la toma de datos (ej: "elalga")
            const codigoReg = reg.Pluviometros || reg.pluviometro || reg.Codigo_txt_del_pluviometro || reg.codigo || '';
            const keyReg = this.normalizarCodigo(codigoReg);

            // Búsqueda del Nombre Real:
            // 1. Busca en el mapa cruzado por código ("elalga" -> "El Algarrobal")
            // 2. O busca directamente si el registro ya traía la propiedad con el nombre completo
            let nombreMostrar = mapaNombres[keyReg] 
                || this.extraerTexto(reg.Nombre_del_Pluviometro)
                || this.extraerTexto(reg.nombre);

            // Si no cruzó con nada, muestra el código capitalizado
            if (!nombreMostrar) {
                nombreMostrar = codigoReg ? (String(codigoReg).charAt(0).toUpperCase() + String(codigoReg).slice(1)) : 'Desconocido';
            }

            // Lluvia en mm
            const milimetros = reg.Mil_metros_registrados ?? reg.precipitacion ?? reg.lluvia ?? 0;

            // Fenómeno Atmosférico
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
