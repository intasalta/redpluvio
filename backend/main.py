import os
import time
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

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

# --- CONFIGURACIÓN DE CACHÉ ---
CACHE = {
    "pluviometros": {"data": None, "timestamp": 0},
    "precipitaciones": {"data": None, "timestamp": 0}
}
CACHE_TTL = 900  # Tiempo de vida en segundos (900s = 15 minutos)

def fetch_kobo_sync(asset_id: str, cache_key: str):
    now = time.time()
    
    # 1. Si los datos están en caché y no han expirado, responder al instante
    if CACHE[cache_key]["data"] and (now - CACHE[cache_key]["timestamp"]) < CACHE_TTL:
        return CACHE[cache_key]["data"]

    # 2. Si expiraron o no existen, consultar a KoboToolbox
    if not INTA_TOKEN:
        raise HTTPException(status_code=500, detail="INTA_TOKEN no encontrado en Render")

    url = f"{KOBO_BASE_URL}/{asset_id}/data.json"
    headers = {
        "Authorization": f"Token {INTA_TOKEN}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json().get("results", response.json())
        
        # Guardar en memoria caché con el tiempo actual
        CACHE[cache_key]["data"] = data
        CACHE[cache_key]["timestamp"] = now
        return data

    except requests.exceptions.RequestException as e:
        # Si Kobo falla pero tenemos caché previa, devolver la caché vieja como respaldo
        if CACHE[cache_key]["data"]:
            return CACHE[cache_key]["data"]
        raise HTTPException(status_code=502, detail=f"Error al conectar con Kobo: {str(e)}")

@app.get("/api/pluviometros")
def get_pluviometros():
    return fetch_kobo_sync(ASSET_PLUVIOMETROS, "pluviometros")

@app.get("/api/precipitaciones")
def get_precipitaciones():
    return fetch_kobo_sync(ASSET_PRECIPITACIONES, "precipitaciones")
