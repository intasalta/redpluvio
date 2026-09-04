const TableManager = {
    tbody: document.getElementById('tabla-body'),

    render(registros) {
        if (!this.tbody) return;

        if (!registros || registros.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No se encontraron registros de lluvia.</td>
                </tr>
            `;
            return;
        }

        const rowsHtml = registros.map(reg => {
            const fecha = reg.Fecha_del_dato || 'S/D';
            const pluviometro = reg.Pluviometros || reg.pluviometro || 'Desconocido';
            const mm = reg.Mil_metros_registrados !== undefined ? `${reg.Mil_metros_registrados} mm` : '0 mm';
            const fenomeno = reg.fenomeno || 'Ninguno';

            return `
                <tr>
                    <td>${fecha}</td>
                    <td>${pluviometro}</td>
                    <td><strong>${mm}</strong></td>
                    <td>${fenomeno}</td>
                </tr>
            `;
        }).join('');

        this.tbody.innerHTML = rowsHtml;
    }
};
