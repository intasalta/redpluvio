const MapManager = {
    map: null,
    markers: [],

    init(elementId, center = [-24.89, -65.48], zoom = 8) {
        this.map = L.map(elementId).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
    },

    clearMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];
    },

    renderPluviometros(pluviometros) {
        this.clearMarkers();

        pluviometros.forEach(item => {
            const coordsStr = item.Ubicaci_in || item.ubicacion;
            if (!coordsStr) return;

            // Extraer latitud y longitud si vienen como string "lat lon"
            const parts = coordsStr.split(' ').map(Number);
            if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return;

            const [lat, lon] = parts;
            const nombre = item.Nombre_del_Pluviometro || 'Pluviómetro';
            const codigo = item.Codigo_txt_del_pluviometro || item.cod || '';

            const marker = L.marker([lat, lon])
                .addTo(this.map)
                .bindPopup(`<b>${nombre}</b><br>Código: ${codigo}`);

            this.markers.push(marker);
        });
    }
};
