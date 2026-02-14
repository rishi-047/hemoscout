"""HemoScout — YOLOv8 inference and morphometry logic."""

import math
import os
from pathlib import Path
from typing import Any

import numpy as np
import torch
from dotenv import load_dotenv
from google import genai
from ultralytics import YOLO

# Load .env from project root (no-op in production where real env vars are set)
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)

# Constants
BACKEND_DIR = Path(__file__).parent
DEFAULT_MODEL_PATH = BACKEND_DIR / "models" / "best.pt"

CLASSES = ["Platelets", "RBC", "WBC"]
CLASS_COLORS = {
    "RBC": "#ef4444",
    "WBC": "#3b82f6",
    "Platelets": "#eab308",
}

CONFIDENCE = 0.45
IOU = 0.5
MAX_DET = 300

SIZE_BUCKETS = [
    (0, 20),
    (20, 40),
    (40, 60),
    (60, 80),
    (80, 100),
    (100, float("inf")),
]


def _get_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


class Analyzer:
    """Loads a trained YOLOv8 model and runs blood-cell analysis."""

    def __init__(self, model_path: Path = DEFAULT_MODEL_PATH):
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at {model_path}. Run train.py first."
            )
        self.device = _get_device()
        self.model = YOLO(str(model_path))
        print(f"[Analyzer] Model loaded on {self.device}")

    def analyze_image(self, image_path: str) -> dict[str, Any]:
        """Run detection on a single image and return structured results."""
        results = self.model.predict(
            source=image_path,
            conf=CONFIDENCE,
            iou=IOU,
            max_det=MAX_DET,
            device=self.device,
            verbose=False,
        )[0]

        counts: dict[str, int] = {"RBC": 0, "WBC": 0, "Platelets": 0}
        detections: list[dict] = []
        sizes: list[float] = []

        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
            cls_id = int(box.cls[0])
            label = CLASSES[cls_id]

            counts[label] += 1

            w = x2 - x1
            h = y2 - y1
            size = math.sqrt(w * h)
            sizes.append(size)

            detections.append({
                "box": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                "label": label,
                "color": CLASS_COLORS[label],
            })

        avg_size_px = round(float(np.mean(sizes)), 2) if sizes else 0.0
        histogram = self._histogram(sizes)
        insight = self._generate_insight(counts, avg_size_px, histogram)

        return {
            "status": "success",
            "data": {
                "counts": counts,
                "avg_size_px": avg_size_px,
                "detections": detections,
                "histogram": histogram,
            },
            "insight": insight,
        }

    # ------------------------------------------------------------------
    # Morphometry helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _histogram(sizes: list[float]) -> list[dict]:
        """Bucket detected object sizes into a distribution."""
        result = []
        for lo, hi in SIZE_BUCKETS:
            if hi == float("inf"):
                label = f"{int(lo)}+px"
                count = sum(1 for s in sizes if s >= lo)
            else:
                label = f"{int(lo)}-{int(hi)}px"
                count = sum(1 for s in sizes if lo <= s < hi)
            result.append({"range": label, "count": count})
        return result

    @staticmethod
    def _generate_insight(
        counts: dict[str, int], avg_size: float, histogram: list[dict]
    ) -> str:
        """Generate clinical insight using Gemini 2.5 Flash."""
        api_key = os.getenv("GEMINI_API_KEY")
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        if not api_key:
            return Analyzer._fallback_insight(counts, avg_size)

        total = sum(counts.values())
        if total == 0:
            return "No blood cells detected in the image."

        hist_text = "\n".join(f"  {h['range']}: {h['count']} cells" for h in histogram)

        prompt = f"""You are a senior clinical hematologist AI assistant analyzing automated blood smear microscopy results.

Detection Results:
- Red Blood Cells (RBC): {counts['RBC']}
- White Blood Cells (WBC): {counts['WBC']}
- Platelets: {counts['Platelets']}
- Total cells detected: {total}
- Average cell diameter (pixel-equivalent): {avg_size:.1f} px

Cell Size Distribution:
{hist_text}

Provide a detailed clinical analysis covering:
1. **Cell Count Assessment**: Evaluate the RBC:WBC:Platelet ratios. Flag any counts that appear abnormal for a typical peripheral blood smear field of view.
2. **Morphological Analysis**: Based on the size distribution, comment on potential anisocytosis, macrocytosis, or microcytosis. Note any unusual size variance patterns.
3. **Differential Considerations**: Based on the cell counts and size patterns, list 2-3 possible clinical conditions that could explain the findings (e.g., infection, anemia types, thrombocytopenia).
4. **Recommended Follow-up**: Suggest specific laboratory tests or clinical correlations that would help confirm or rule out the differential diagnoses.

Write in professional clinical language. Be specific and evidence-based. Format with clear section headers."""

        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as exc:
            print(f"[Gemini API Error] {exc}")
            return Analyzer._fallback_insight(counts, avg_size)

    @staticmethod
    def _fallback_insight(counts: dict[str, int], avg_size: float) -> str:
        """Fallback when Gemini API is unavailable."""
        total = sum(counts.values())
        if total == 0:
            return "No blood cells detected in the image."
        return (
            f"Detected {total} cells: "
            f"{counts['RBC']} RBCs, {counts['WBC']} WBCs, "
            f"{counts['Platelets']} Platelets. "
            f"Average cell size: {avg_size}px. "
            "(Gemini API unavailable — using fallback.)"
        )
