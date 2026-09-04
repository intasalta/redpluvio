import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Proxy API - Red Pluviométrica")

# Permitir peticiones desde el frontend (GitHub Pages y local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción podés restringir al dominio de GitHub Pages
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de Kobo (Token desde variable de entorno)
KOBO_TOKEN = os.getenv("INTA_TOKEN")
BASE_URL = "https://kf.kobotoolbox.org/api/v2/assets"

ASSET_PLUVIOMETROS = "aFwWKNGXZKppgNYKa33wC8"
ASSET_PRECIPITACIONES = "aYqLUVvU3EYiDa7NoJbPKF"

def fetch_kobo_data(asset_uid: str):
    if not KOBO_TOKEN:
        raise HTTPException(status_code=500, detail="Token de Kobo no configurado en el servidor")
    
    url = f"{BASE_URL}/{asset_uid}/data.json"
    headers = {"Authorization": f"Token {KOBO_TOKEN}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Error al conectar con Kobo: {str(e)}")

@app.get("/api/pluviometros")
def get_pluviometros():
    data = fetch_kobo_data(ASSET_PLUVIOMETROS)
    return data.get("results", [])

@app.get("/api/precipitaciones")
def get_precipitaciones():
    data = fetch_kobo_data(ASSET_PRECIPITACIONES)
    return data.get("results", [])

@app.get("/")
def home():
    return {"status": "ok", "message": "API Proxy funcionando correctamente"}
