# syntax=docker/dockerfile:1

# ---- deps: install into a venv that the runtime stages copy ----
FROM python:3.12-slim AS deps
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH
COPY requirements.txt .
RUN pip install -r requirements.txt

# ---- base: slim runtime, non-root user ----
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/opt/venv/bin:$PATH
RUN useradd --system --uid 10001 --no-create-home app
WORKDIR /app
COPY --from=deps /opt/venv /opt/venv

# ---- mock-crm: stand-in CRM for local dev only (docker compose uses this target) ----
FROM base AS mock-crm
COPY mock_crm.py ./
COPY mock_data ./mock_data
USER app
EXPOSE 8001
CMD ["uvicorn", "mock_crm:app", "--host", "0.0.0.0", "--port", "8001"]

# ---- api (default target): the EPK API ----
FROM base AS api
COPY app ./app
USER app
# Most hosts (Cloud Run, Render, Fly, Railway…) pass the port in $PORT.
ENV PORT=8000
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["python", "-c", "import os, urllib.request; urllib.request.urlopen(f\"http://127.0.0.1:{os.environ['PORT']}/health\", timeout=2)"]
# CRM_BASE_URL and CRM_API_TOKEN must be provided at run time (never baked into the image).
CMD ["sh", "-c", "exec uvicorn app.main:create_app --factory --host 0.0.0.0 --port \"$PORT\" --proxy-headers --no-server-header"]
