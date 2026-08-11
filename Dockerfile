# tutorIA en un contenedor: un proceso que sirve la lección y la corrige.
#
# Sirve para cualquier host que ejecute contenedores —Fly, Render, Hugging Face Spaces, un
# VPS— así que elegir host no obliga a rehacer esto.
#
# Dos etapas: node compila el cliente y desaparece. La imagen final no lleva node_modules
# ni TypeScript ni Vite, solo el `dist/` resultante, que son 17,5 KB de JS comprimido.

FROM node:22-slim AS cliente
WORKDIR /w
# Primero el manifiesto y luego el código: si no cambian las dependencias, esta capa se
# reutiliza y `npm ci` no vuelve a correr.
COPY app/web/package.json app/web/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY app/web/ ./
# `vite build` incluye `tsc --noEmit`, así que un error de tipos rompe la imagen aquí y no
# en producción.
RUN npm run build


FROM python:3.12-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # Fuera del código: un `docker run` sin volumen no debe escribir en la capa de imagen.
    TUTORIA_DB=/data/tutoria.sqlite \
    # Tope diario de gasto. Un enlace publicado sin esto es la tarjeta de Kristian.
    TUTORIA_LIMITE_USD_DIA=5

COPY pyproject.toml ./
# Sin `-e`: la instalación editable necesita el árbol de fuentes y aquí se copia después.
RUN pip install --no-cache-dir "fastapi>=0.115" "uvicorn[standard]>=0.32" \
        "pydantic>=2.9" "pyyaml>=6" "openai>=1.50"

COPY app/server ./app/server
COPY config ./config
COPY content ./content
COPY --from=cliente /w/dist ./app/web/dist

RUN mkdir -p /data
VOLUME ["/data"]

# El host decide el puerto por entorno; 8080 es solo el valor por defecto.
ENV PORT=8080
EXPOSE 8080

# La clave NO va aquí. Se inyecta como secreto del servicio en tiempo de ejecución, y el
# servidor la lee del entorno; nunca la imprime, ni la devuelve en /api/health, ni la
# escribe en la base.
CMD ["sh", "-c", "python -m uvicorn app.server.main:app --host 0.0.0.0 --port ${PORT}"]
