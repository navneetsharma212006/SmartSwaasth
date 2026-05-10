"""
SmartSwaasth OCR microservice.

POST /ocr  (multipart: file=<image>)
  -> { rawText: str, lines: [str], medicineName: str|None, expiryDate: "YYYY-MM"|"YYYY-MM-DD"|None }
"""
import io
import re
from datetime import datetime
from typing import List, Optional, Tuple

import cv2
import numpy as np
import pytesseract
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title="SmartSwaasth OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Image preprocessing ----------------

def preprocess(image_bytes: bytes) -> np.ndarray:
    """Resize, grayscale, denoise, threshold to improve OCR accuracy."""
    pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)

    # Upscale small images
    h, w = img.shape[:2]
    if max(h, w) < 1000:
        scale = 1000 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)),
                         interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, h=10)
    gray = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )
    return gray

# ---------------- Expiry date parsing ----------------

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}

EXP_KEYWORDS = r"(?:exp(?:iry)?(?:\s*date)?|expires?|use\s*by|best\s*before|bb)"

PATTERNS = [
    # EXP 15/08/2026   EXP: 15-08-2026
    (re.compile(rf"{EXP_KEYWORDS}[^A-Za-z0-9]*(\d{{1,2}})[\/\-\.](\d{{1,2}})[\/\-\.](\d{{2,4}})", re.I), "dmy"),
    # EXP 08/2026   EXP: 08-26
    (re.compile(rf"{EXP_KEYWORDS}[^A-Za-z0-9]*(\d{{1,2}})[\/\-\.](\d{{2,4}})", re.I), "my"),
    # EXP 2026-08
    (re.compile(rf"{EXP_KEYWORDS}[^A-Za-z0-9]*(\d{{4}})[\/\-\.](\d{{1,2}})", re.I), "ym"),
    # EXP AUG 2026
    (re.compile(rf"{EXP_KEYWORDS}[^A-Za-z0-9]*([A-Za-z]{{3,9}})[^A-Za-z0-9]*(\d{{2,4}})", re.I), "month_y"),
    # Bare 08/2026 (fallback, only if keyword-based fails)
    (re.compile(r"\b(\d{1,2})[\/\-\.](20\d{2})\b"), "my"),
    (re.compile(r"\b(20\d{2})[\/\-\.](\d{1,2})\b"), "ym"),
]

def _normalize_year(y: int) -> int:
    if y < 100:
        return 2000 + y
    return y

def parse_expiry(text: str) -> Optional[str]:
    text_clean = text.replace("\n", " ")
    for pattern, kind in PATTERNS:
        for m in pattern.finditer(text_clean):
            try:
                if kind == "dmy":
                    d, mo, y = int(m.group(1)), int(m.group(2)), _normalize_year(int(m.group(3)))
                    if 1 <= mo <= 12 and 1 <= d <= 31:
                        return datetime(y, mo, d).strftime("%Y-%m-%d")
                elif kind == "my":
                    mo, y = int(m.group(1)), _normalize_year(int(m.group(2)))
                    if 1 <= mo <= 12:
                        return datetime(y, mo, 1).strftime("%Y-%m")
                elif kind == "ym":
                    y, mo = _normalize_year(int(m.group(1))), int(m.group(2))
                    if 1 <= mo <= 12:
                        return datetime(y, mo, 1).strftime("%Y-%m")
                elif kind == "month_y":
                    name = m.group(1).lower()[:4]
                    mo = MONTHS.get(name) or MONTHS.get(name[:3])
                    if not mo:
                        continue
                    y = _normalize_year(int(m.group(2)))
                    return datetime(y, mo, 1).strftime("%Y-%m")
            except (ValueError, OverflowError):
                continue
    return None

# ---------------- Medicine name detection ----------------

NOISE_TOKENS = {
    "exp", "expiry", "expires", "mfg", "mfd", "batch", "lot", "use", "by",
    "best", "before", "tablets", "tablet", "capsule", "capsules", "mg", "ml",
    "rx", "only", "store", "keep", "dose", "ip", "bp", "usp", "syrup",
}

def looks_like_name(line: str) -> bool:
    s = line.strip()
    if len(s) < 3:
        return False
    if any(c.isdigit() for c in s) and sum(c.isdigit() for c in s) > len(s) // 2:
        return False
    low = s.lower()
    if any(tok in low for tok in ("exp", "mfg", "batch", "lot")):
        return False
    return True

def detect_medicine_name(results: List[Tuple[List, str, float]]) -> Optional[str]:
    """
    Score lines by: confidence + size of bounding box + uppercase ratio.
    Expects results as [(bbox, text, conf)] where bbox = [[x0,y0], [x1,y1], [x2,y2], [x3,y3]]
    """
    scored = []
    for bbox, text, conf in results:
        if not looks_like_name(text):
            continue
        (x0, y0), _, (x2, y2), _ = bbox
        height = abs(y2 - y0)
        width = abs(x2 - x0)
        area = height * width
        upper_ratio = sum(1 for c in text if c.isupper()) / max(1, len(text))
        
        # Scale score down slightly compared to EasyOCR to match Tesseract's confidence scale
        score = (conf / 100) * 0.4 + (area / 10000) * 0.4 + upper_ratio * 0.2
        scored.append((score, text.strip()))

    if not scored:
        return None
    scored.sort(reverse=True)
    name = scored[0][1]
    name = re.sub(r"\s+", " ", name).strip(" .,:-")
    return name or None

# ---------------- API ----------------

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    raw = await file.read()
    try:
        pre = preprocess(raw)
    except Exception as e:
        raise HTTPException(400, f"Invalid image: {e}")

    # Extract detailed data with Tesseract
    data = pytesseract.image_to_data(pre, output_type=pytesseract.Output.DICT)
    
    # We want to group words into lines to match the old EasyOCR output style
    lines = []
    results = [] # [(bbox, text, conf)]
    
    current_line_text = []
    current_line_conf = []
    current_line_bbox = None
    
    n_boxes = len(data['text'])
    for i in range(n_boxes):
        if int(data['conf'][i]) > -1:
            text = data['text'][i].strip()
            if text:
                x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                
                # Check if this is a new line or same line (based on line_num)
                if len(current_line_text) == 0:
                    current_line_bbox = [x, y, x + w, y + h] # min_x, min_y, max_x, max_y
                else:
                    # Expand bounding box
                    current_line_bbox[0] = min(current_line_bbox[0], x)
                    current_line_bbox[1] = min(current_line_bbox[1], y)
                    current_line_bbox[2] = max(current_line_bbox[2], x + w)
                    current_line_bbox[3] = max(current_line_bbox[3], y + h)
                
                current_line_text.append(text)
                current_line_conf.append(int(data['conf'][i]))
        
        # If the word is empty and we have a line, or if we hit the end, commit the line
        is_end_of_line = i < n_boxes - 1 and data['word_num'][i+1] == 1
        is_last_item = i == n_boxes - 1
        
        if (is_end_of_line or is_last_item) and len(current_line_text) > 0:
            full_text = " ".join(current_line_text)
            avg_conf = sum(current_line_conf) / len(current_line_conf)
            lines.append(full_text)
            
            # Format bbox to match the expected [[x0,y0], [x1,y1], [x2,y2], [x3,y3]]
            min_x, min_y, max_x, max_y = current_line_bbox
            bbox = [[min_x, min_y], [max_x, min_y], [max_x, max_y], [min_x, max_y]]
            
            results.append((bbox, full_text, avg_conf))
            
            current_line_text = []
            current_line_conf = []
            current_line_bbox = None

    raw_text = "\n".join(lines)
    expiry = parse_expiry(raw_text)
    name = detect_medicine_name(results)

    return {
        "rawText": raw_text,
        "lines": lines,
        "medicineName": name,
        "expiryDate": expiry,
    }
