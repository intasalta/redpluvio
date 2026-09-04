import os
import json
import ssl
import urllib.request
from fastapi import FastAPI
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

# URLs posibles para probar conexión
KOBO_BASE_URL = "https://territorios.inta.gob.ar/api/v2/assets"

def fetch_kobo_sync(asset_id: str):
    if not INTA_TOKEN:
        return {"error": True, "message": "INTA_TOKEN no encontrado en Render"}

    url = f"{KOBO_BASE_URL}/{asset_id}/data/?format=json"
    
    headers = {
        "Authorization": f"Token {INTA_TOKEN}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    # Desactiva verificación estricta de SSL para el servidor de INTA
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                if isinstance(data, dict):
                    return data.get("results", [])
                return data
            return {"error": True, "message": f"Respuesta INTA: HTTP {response.status}"}
    except Exception as e:
        # Imprime la falla real en los logs de Render
        print(f"[ERROR KOBOTOOLBOX]: {str(e)}")
        return {"error": True, "message": f"Fallo al conectar con INTA: {str(e)}"}

@app.get("/")
def home():
    return {"status": "ok", "message": "API Proxy Red Pluviométrica activa"}

@app.get("/api/pluviometros")
def get_pluviometros():
    return fetch_kobo_sync(ASSET_PLUVIOMETROS)

@app.get("/api/precipitaciones")
def get_precipitaciones():
    return fetch_kobo_sync(ASSET_PRECIPITACIONES)
