"""HemoScout — M1-optimized YOLOv8 training script."""

from pathlib import Path
from ultralytics import YOLO
import torch

# Paths
BACKEND_DIR = Path(__file__).parent
DATASET_CONFIG = BACKEND_DIR / "dataset" / "data.yaml"
MODELS_DIR = BACKEND_DIR / "models"


def get_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def main():
    device = get_device()
    print(f"[HemoScout] Device: {device}")

    if device == "mps":
        print("[HemoScout] MPS (Metal Performance Shaders) active — Apple Silicon GPU enabled.")
    else:
        print("[HemoScout] WARNING: MPS not available, falling back to CPU. Training will be slow.")

    if not DATASET_CONFIG.exists():
        raise FileNotFoundError(f"Dataset config not found: {DATASET_CONFIG}")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model = YOLO("yolov8n.pt")

    print("[HemoScout] Starting training — epochs=10, batch=16, imgsz=640")
    model.train(
        data=str(DATASET_CONFIG),
        epochs=10,
        imgsz=640,
        batch=16,
        device=device,
        project=str(MODELS_DIR),
        name="train",
        exist_ok=True,
        verbose=True,
    )

    best_path = MODELS_DIR / "train" / "weights" / "best.pt"
    target_path = MODELS_DIR / "best.pt"

    if best_path.exists():
        import shutil
        shutil.copy2(best_path, target_path)
        print(f"[HemoScout] best.pt copied to {target_path}")
    else:
        print(f"[HemoScout] WARNING: {best_path} not found. Check training output.")

    print("[HemoScout] Training complete.")


if __name__ == "__main__":
    main()
