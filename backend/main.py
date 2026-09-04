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

INTA_TOKEN = os.getenv("INTA_TOKEN")

# IDs de los activos en Kobo
ASSET_PLUVIOMETROS = "aFwWKNGXZKppgNYKa33wC8"
ASSET_LLUVIAS = "aYqLUVvU3EYiDa7NoJbPKF"

# Dominios a probar (Global vs Humanitario)
KOBO_URLS = [
    f"https://kf.kobotoolbox.org/api/v2/assets/{{asset_id}}/data.json",
    f"https://kobo.humanitarianresponse.info/api/v2/assets/{{asset_id}}/data.json"
]

async def fetch_kobo_data(asset_id: str):
    if not INTA_TOKEN:
        raise HTTPException(status_code=500, detail="Token INTA_TOKEN no configurado en servidor")
    
    headers = {"Authorization": f"Token {INTA_TOKEN.strip()}"}
    
    async with httpx.AsyncClient() as client:
        for url_template in KOBO_URLS:
            url = url_template.format(asset_id=asset_id)
            try:
                response = await client.get(url, headers=headers, timeout=15.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("results", [])
            except Exception:
                continue

    raise HTTPException(status_code=502, detail=f"No se pudo obtener datos para el activo {asset_id} desde Kobo")

@app.get("/")
def home():
    return {"status": "ok", "message": "API Proxy funcionando correctamente"}

@app.get("/api/pluviometros")
async def get_pluviometros():
    return await fetch_kobo_data(ASSET_PLUVIOMETROS)

@app.get("/api/precipitaciones")
async def get_precipitaciones():
    return await fetch_kobo_data(ASSET_LLUVIAS)
