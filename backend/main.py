import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permite las peticiones desde GitHub Pages (intasalta.github.io)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INTA_TOKEN = os.getenv("INTA_TOKEN", "").strip()

# Asset IDs correspondientes a tus formularios de Kobo/INTA Territorios
ASSET_PRECIPITACIONES = "aYqLUVvU3EYiDa7NoJbPKF"
ASSET_PLUVIOMETROS = "aFwWKNGXZKppgNYKa33wC8"

# URL Base correcta de la API v2 de Kobo / INTA Territorios
KOBO_BASE_URL = "https://territorios.inta.gob.ar/api/v2/assets"

async def fetch_kobo_data(asset_id: str):
    if not INTA_TOKEN:
        raise HTTPException(
            status_code=500, 
            detail="Error de configuración: INTA_TOKEN no está presente en las variables de entorno de Render"
        )
    
    headers = {"Authorization": f"Token {INTA_TOKEN}"}
    
    # Endpoint oficial de datos en Kobo API v2
    url = f"{KOBO_BASE_URL}/{asset_id}/data/?format=json"

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(url, headers=headers, timeout=20.0)
            if response.status_code == 200:
                data = response.json()
                # Extrae el array de registros para que tu js (api.js) lo consuma directo
                if isinstance(data, dict):
                    return data.get("results", [])
                return data
            else:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Error en servidor INTA ({response.status_code}): {response.text}"
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502, 
                detail=f"Error al conectar con territorios.inta.gob.ar: {str(e)}"
            )

@app.get("/")
def home():
    return {"status": "ok", "message": "API Proxy Red Pluviométrica INTA activa"}

@app.get("/api/pluviometros")
async def get_pluviometros():
    return await fetch_kobo_data(ASSET_PLUVIOMETROS)

@app.get("/api/precipitaciones")
async def get_precipitaciones():
    return await fetch_kobo_data(ASSET_PRECIPITACIONES)
