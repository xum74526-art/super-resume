# Isolated acceptance environment only; never shipped with the plugin.
FROM node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libreoffice-writer fonts-noto-cjk fonts-liberation2 \
       poppler-utils python3 python3-venv \
    && python3 -m venv /opt/qa-python \
    && /opt/qa-python/bin/pip install --no-cache-dir pdf2image==1.17.0 Pillow==11.3.0 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /work
