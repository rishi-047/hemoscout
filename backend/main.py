"""HemoScout — FastAPI entry point."""

import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ml_logic import Analyzer

BACKEND_DIR = Path(__file__).parent
MODEL_PATH = BACKEND_DIR / "models" / "best.pt"

app = FastAPI(title="HemoScout API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try loading the analyzer at startup; allow the server to start even if
# the model hasn't been trained yet.
analyzer: Analyzer | None = None
try:
    analyzer = Analyzer(MODEL_PATH)
except FileNotFoundError as exc:
    print(f"[HemoScout] {exc}")


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "HemoScout API",
        "analyzer_ready": analyzer is not None,
    }


@app.get("/health")
async def health():
    import torch

    return {
        "status": "healthy",
        "mps_available": torch.backends.mps.is_available(),
        "model_loaded": analyzer is not None,
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if analyzer is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Train the model first (python train.py).",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image file (PNG/JPG).")

    suffix = Path(file.filename).suffix if file.filename else ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        shutil.copyfileobj(file.file, tmp)
        tmp.close()
        result = analyzer.analyze_image(tmp.name)
        return JSONResponse(content=result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        Path(tmp.name).unlink(missing_ok=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
