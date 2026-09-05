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

    // Formateador inteligente para códigos sin coincidencia en catálogo (ej: "santaviceste" -> "Santa Vicente")
    formatearNombreFallback(str) {
        if (!str) return 'Desconocido';
        let txt = String(str).trim();

        // 1. Si contiene guiones bajos o medios, los reemplaza por espacios
        txt = txt.replace(/[-_]+/g, ' ');

        // 2. Separa palabras unidas en camelCase / PascalCase
        txt = txt.replace(/([a-z])([A-Z])/g, '$1 $2');

        // 3. Casos comunes de prefijos en claves Kobo pegadas (ej: "santa", "san", "los", "las", "el", "la")
        const prefijos = ['santa', 'santo', 'san', 'los', 'las', 'del', 'finca', 'escuela'];
        prefijos.forEach(pref => {
            const regex = new RegExp(`^(${pref})([a-z]+)$`, 'i');
            if (regex.test(txt)) {
                txt = txt.replace(regex, '$1 $2');
            }
        });

        // 4. Capitalizar cada palabra resultante
        return txt.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
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

        // 1. Armar mapa de cruce dinámico desde la API de ubicaciones
        const mapaNombres = {};

        listaPluvio.forEach(p => {
            if (!p) return;

            const nombreReal = p.Nombre_del_Pluviometro || p.nombre || p.label || p.title || p.Pluviometro;
            if (!nombreReal) return;

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

        // 2. Renderizar filas haciendo el cruce
        const rowsHtml = lista.map(reg => {
            if (!reg) return '';

            // Fecha
            const fechaRaw = reg.Fecha_del_dato || reg.start || reg._submission_time || 'S/D';
            const fechaFormateada = this.formatearFecha(fechaRaw);

            // Código guardado en la respuesta de lluvia
            const codigoRaw = reg.Pluviometros || reg.pluviometro || reg.Codigo_txt_del_pluviometro || reg.codigo || '';
            const keyReg = String(codigoRaw).trim().toLowerCase();

            // Búsqueda del nombre con resolución multinivel
            let nombreMostrar = mapaNombres[keyReg] 
                || reg.Nombre_del_Pluviometro 
                || reg.nombre;

            // Si no estuvo en la API del mapa, aplicar formateador inteligente
            if (!nombreMostrar) {
                nombreMostrar = this.formatearNombreFallback(codigoRaw);
            }

            // Lluvia
            const milimetros = reg.Mil_metros_registrados ?? reg.precipitacion ?? reg.lluvia ?? 0;

            // Fenómeno
            const fenomenoRaw = (reg.fenomeno || reg.observaciones || 'sinfeno').toString().trim().toLowerCase();
            const fenomenoLimpio = this.mapaFenomenos[fenomenoRaw] || (fenomenoRaw ? fenómenoRaw.charAt(0).toUpperCase() + fenómenoRaw.slice(1) : 'Sin obs. de fenómenos');

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
