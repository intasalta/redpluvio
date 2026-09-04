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
            detail="Falta la variable INTA_TOKEN en Render Environment"
        )
    
    headers = {
        "Authorization": f"Token {INTA_TOKEN}",
        "User-Agent": "Mozilla/5.0"
    }
    
    url = f"{KOBO_BASE_URL}/{asset_id}/data/?format=json"

    async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
        try:
            response = await client.get(url, headers=headers, timeout=25.0)
            
            # Devuelve el status real devuelto por INTA para diagnosticar
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"INTA respondió con HTTP {response.status_code}: {response.text[:300]}"
                )

            data = response.json()
            if isinstance(data, dict):
                return data.get("results", [])
            return data

        except httpx.RequestError as err:
            raise HTTPException(
                status_code=504,
                detail=f"Error de red o timeout conectando a INTA: {str(err)}"
            )

@app.get("/")
def home():
    return {"status": "ok"}

@app.get("/api/pluviometros")
async def get_pluviometros():
    return await fetch_kobo_data(ASSET_PLUVIOMETROS)

@app.get("/api/precipitaciones")
async def get_precipitaciones():
    return await fetch_kobo_data(ASSET_PRECIPITACIONES)
