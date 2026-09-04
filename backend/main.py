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

ASSET_PLUVIOMETROS = "aFwWKNGXZKppgNYKa33wC8"
ASSET_LLUVIAS = "aYqLUVvU3EYiDa7NoJbPKF"

# Rutas estándar de la API v2 de Kobo
ENDPOINTS = [
    "https://kf.kobotoolbox.org/api/v2/assets/{asset_id}/data/?format=json",
    "https://kf.kobotoolbox.org/api/v2/assets/{asset_id}/data.json",
    "https://kobo.humanitarianresponse.info/api/v2/assets/{asset_id}/data/?format=json",
    "https://kobo.humanitarianresponse.info/api/v2/assets/{asset_id}/data.json",
]

async def fetch_kobo_data(asset_id: str):
    if not INTA_TOKEN:
        raise HTTPException(status_code=500, detail="Token INTA_TOKEN no configurado")
    
    headers = {"Authorization": f"Token {INTA_TOKEN}"}
    last_error = ""

    async with httpx.AsyncClient() as client:
        for url_template in ENDPOINTS:
            url = url_template.format(asset_id=asset_id)
            try:
                response = await client.get(url, headers=headers, timeout=15.0)
                if response.status_code == 200:
                    data = response.json()
                    # Soporta tanto formato lista como dict con 'results'
                    if isinstance(data, dict):
                        return data.get("results", [])
                    elif isinstance(data, list):
                        return data
                else:
                    last_error = f"Status {response.status_code} en {url}"
            except Exception as e:
                last_error = str(e)

    raise HTTPException(status_code=502, detail=f"Error Kobo: {last_error}")

@app.get("/")
def home():
    return {"status": "ok", "message": "API Proxy funcionando correctamente"}

@app.get("/api/pluviometros")
async def get_pluviometros():
    return await fetch_kobo_data(ASSET_PLUVIOMETROS)

@app.get("/api/precipitaciones")
async def get_precipitaciones():
    return await fetch_kobo_data(ASSET_LLUVIAS)
