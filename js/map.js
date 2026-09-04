const MapManager = {
    map: null,
    markers: [],

    init(elementId, center = [-24.89, -65.48], zoom = 9) {
        this.map = L.map(elementId).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    },

    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    },

    renderPluviometros(pluviometros) {
        this.clearMarkers();

        if (!Array.isArray(pluviometros) || pluviometros.length === 0) return;

        pluviometros.forEach(item => {
            let lat = null;
            let lon = null;

            // 1. Lectura por campos separados de Kobo (Latitude / Longitude)
            if (item._Ubicaci_in_latitude && item._Ubicaci_in_longitude) {
                lat = parseFloat(item._Ubicaci_in_latitude);
                lon = parseFloat(item._Ubicaci_in_longitude);
            } 
            // 2. Fallback si vienen en un solo string espacio-separado
            else {
                const coordsStr = item.Ubicaci_in || item.ubicacion || item._Ubicaci_in;
                if (coordsStr) {
                    const parts = String(coordsStr).trim().split(/\s+/).map(Number);
                    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                        lat = parts[0];
                        lon = parts[1];
                    }
                }
            }

            // Si no hay coordenadas válidas, se saltea la ubicación
            if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

            const nombre = item.Nombre_del_Pluviometro || item.nombre || 'Pluviómetro';
            const codigo = item.Codigo_txt_del_pluviometro || item.cod || '';

            const marker = L.marker([lat, lon])
                .addTo(this.map)
                .bindPopup(`
                    <div style="text-align: center;">
                        <strong style="font-size: 1.1em; color: #1a5276;">${nombre}</strong><br>
                        <small>Código: ${codigo}</small>
                    </div>
                `);

            this.markers.push(marker);
        });

        // Auto-centrar el mapa según los marcadores desplegados
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.15));
        }
    }
};
