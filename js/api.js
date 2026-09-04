const API = {
    async getPluviometros() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/pluviometros`);
            if (!response.ok) throw new Error('Error al obtener pluviómetros');
            return await response.json();
        } catch (error) {
            console.error('Error en API.getPluviometros:', error);
            return [];
        }
    },

    async getPrecipitaciones() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/precipitaciones`);
            if (!response.ok) throw new Error('Error al obtener precipitaciones');
            return await response.json();
        } catch (error) {
            console.error('Error en API.getPrecipitaciones:', error);
            return [];
        }
    }
};
