const TableManager = {
    tbody: document.getElementById('tabla-body'),

    render(registros) {
        if (!this.tbody) {
            this.tbody = document.getElementById('tabla-body');
            if (!this.tbody) return;
        }

        // 1. Asegurar que registros sea siempre un Array válido
        const lista = Array.isArray(registros) ? registros : [];

        // 2. Si el array está vacío, mostrar mensaje de sin datos
        if (lista.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center" style="text-align: center; padding: 1rem;">
                        No se encontraron registros de lluvia.
                    </td>
                </tr>
            `;
            return;
        }

        // 3. Renderizar las filas comprobando los campos reales de Kobo
        const rowsHtml = lista.map(reg => {
            // Formatear la fecha (extrae AAAA-MM-DD si viene en ISO)
            let fecha = reg.Fecha_del_dato || reg.start || reg._submission_time || 'S/D';
            if (fecha !== 'S/D' && fecha.includes('T')) {
                fecha = fecha.split('T')[0];
            }

            // Nombre del pluviómetro
            const pluviometro = reg.Nombre_del_Pluviometro || reg.Pluviometros || reg.pluviometro || 'Desconocido';

            // Milímetros de lluvia
            const milimetros = reg.Mil_metros_registrados ?? reg.precipitacion ?? reg.lluvia ?? 0;
            const mmDisplay = `${milimetros} mm`;

            // Fenómeno u observaciones
            const fenomeno = reg.fenomeno || reg.observaciones || reg.notes?.[0] || 'Ninguno';

            return `
                <tr>
                    <td>${fecha}</td>
                    <td>${pluviometro}</td>
                    <td><strong>${mmDisplay}</strong></td>
                    <td>${fenomeno}</td>
                </tr>
            `;
        }).join('');

        this.tbody.innerHTML = rowsHtml;
    }
};
