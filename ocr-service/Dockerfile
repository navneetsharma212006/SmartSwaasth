FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed by OpenCV and Tesseract
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 libglib2.0-0 tesseract-ocr && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
