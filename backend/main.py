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

KOBO_BASE_URL = "https://territorios.inta.gob.ar/api/v2/assets"

async def fetch_kobo_data(asset_id: str):
    if not INTA_TOKEN:
        raise HTTPException(
            status_code=500, 
            detail="Error de configuración: INTA_TOKEN no está presente en Render"
        )
    
    # Se agrega User-Agent para evitar que el servidor de INTA rechace la petición de Render
    headers = {
        "Authorization": f"Token {INTA_TOKEN}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    url = f"{KOBO_BASE_URL}/{asset_id}/data/?format=json"

    async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    return data.get("results", [])
                return data
            else:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Error en servidor INTA ({response.status_code}): {response.text}"
                )
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Fallo en la comunicación con INTA: {str(e)}"
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
