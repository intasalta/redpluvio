import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INTA_TOKEN = os.getenv("INTA_TOKEN", "").strip()

ASSET_PRECIPITACIONES = "aYqLUVvU3EYiDa7NoJbPKF"
ASSET_PLUVIOMETROS = "aFwWKNGXZKppgNYKa33wC8"

# URLs de prueba para Kobo/INTA Territorios
ENDPOINTS = [
    "https://territorios.inta.gob.ar/api/v2/assets/{asset_id}/data/?format=json",
    "https://territorios.inta.gob.ar/assets/{asset_id}/submissions/?format=json",
    "https://territorios.inta.gob.ar/api/v1/data/{asset_id}?format=json"
]

async def fetch_kobo_data(asset_id: str):
    if not INTA_TOKEN:
        raise HTTPException(
            status_code=500, 
            detail="INTA_TOKEN no encontrado en las variables de entorno de Render"
        )
    
    headers = {
        "Authorization": f"Token {INTA_TOKEN}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    last_error = ""

    # Probamos los distintos formatos de endpoint por si INTA usa API v1 o v2
    async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
        for pattern in ENDPOINTS:
            url = pattern.format(asset_id=asset_id)
            try:
                print(f"[DEBUG] Consultando: {url}")
                response = await client.get(url, headers=headers, timeout=15.0)
                print(f"[DEBUG] Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict):
                        return data.get("results", data)
                    return data
                else:
                    last_error = f"HTTP {response.status_code}: {response.text[:200]}"
            except Exception as e:
                last_error = str(e)
                print(f"[DEBUG] Excepción al consultar {url}: {e}")

    # Si ninguno respondió 200, devuelve detalle para no dar 502 genérico
    raise HTTPException(
        status_code=502,
        detail=f"No se pudo obtener datos de INTA. Último intento: {last_error}"
    )

@app.get("/")
def home():
    return {"status": "ok", "message": "Backend Red Pluviométrica activo"}

@app.get("/api/pluviometros")
async def get_pluviometros():
    return await fetch_kobo_data(ASSET_PLUVIOMETROS)

@app.get("/api/precipitaciones")
async def get_precipitaciones():
    return await fetch_kobo_data(ASSET_PRECIPITACIONES)
