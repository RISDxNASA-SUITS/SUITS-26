# Multi-stage: Vite build + FastAPI + faster-whisper + ffmpeg (single origin).
# Build from repo root: docker build -t eva-aia .

FROM node:22-bookworm-slim AS frontend-build
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Optional: bake Whisper weights into the image for faster first request (larger image).
ARG PRELOAD_WHISPER=true
ENV HF_HOME=/opt/hf
ENV XDG_CACHE_HOME=/opt/hf
RUN mkdir -p /opt/hf && if [ "$PRELOAD_WHISPER" = "true" ]; then \
      python -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')"; \
    fi

COPY backend/app ./app
COPY backend/data ./data
COPY --from=frontend-build /src/dist ./static

ENV PYTHONPATH=/app/backend
ENV EVA_ASR_DEVICE=cpu
ENV EVA_ASR_COMPUTE_TYPE=int8

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
