const MapManager = {
    map: null,
    markers: [],

    init(elementId, center = [-24.89, -65.48], zoom = 8) {
        this.map = L.map(elementId).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    },

    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    },

    renderPluviometros(pluviometros, datosLluvia = []) {
        this.clearMarkers();

        if (!Array.isArray(pluviometros) || pluviometros.length === 0) return;

        // Crear mapa clave-valor para asociar las mediciones por el código del pluviómetro
        const mapaLluvias = {};
        datosLluvia.forEach(reg => {
            const cod = reg.Pluviometros || reg.pluviometro || reg.Codigo_txt_del_pluviometro || '';
            const mm = reg.Mil_metros_registrados ?? reg.precipitacion ?? reg.lluvia ?? 0;
            if (cod) mapaLluvias[cod] = mm;
        });

        pluviometros.forEach(item => {
            let lat = null;
            let lon = null;

            if (Array.isArray(item._geolocation) && item._geolocation.length >= 2) {
                lat = parseFloat(item._geolocation[0]);
                lon = parseFloat(item._geolocation[1]);
            } else {
                const coordsStr = item.Ubicaci_in || item.Ubicaci_ón || item.ubicacion || item._Ubicaci_in;
                if (coordsStr) {
                    const parts = String(coordsStr).trim().split(/\s+/).map(Number);
                    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                        lat = parts[0];
                        lon = parts[1];
                    }
                }
            }

            if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

            const nombre = item.Nombre_del_Pluviometro || item.nombre || 'Pluviómetro';
            const codigo = item.Codigo_txt_del_pluviometro || item.cod || '';

            // Si se pasaron datos de lluvia específicos, evaluamos si registró precipitación
            const mmCalculados = mapaLluvias[codigo] !== undefined ? mapaLluvias[codigo] : null;

            // Si hay un filtro por fecha activo, mostramos solo las estaciones que registraron mediciones
            if (datosLluvia.length > 0 && mmCalculados === null) return;

            const textoMm = mmCalculados !== null ? `${mmCalculados} mm` : 'Sin datos';

            const marker = L.marker([lat, lon])
                .addTo(this.map)
                .bindPopup(`
                    <div style="text-align: center;">
                        <strong style="font-size: 1.1em; color: #1a5276;">${nombre}</strong><br>
                        <span style="font-size: 1em; color: #27ae60; font-weight: bold;">Lluvia: ${textoMm}</span>
                    </div>
                `);

            this.markers.push(marker);
        });

        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.15));
        }
    }
};
