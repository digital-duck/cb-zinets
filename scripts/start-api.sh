#!/usr/bin/env bash
# Start the concept-book FastAPI backend.
# Must be run inside the spl123 conda env (so spl3 is on PATH).
#
# One-time setup:
#   conda activate spl123
#   pip install -r requirements-api.txt
#
# Then start:
#   conda activate spl123
#   bash scripts/start-api.sh
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"
# Use python-dotenv so ${VAR} references in .env are expanded before reading API_PORT.
API_PORT="$(python3 -c "from dotenv import dotenv_values; print(dotenv_values('$REPO/.env').get('API_PORT', ''))" 2>/dev/null || true)"
API_PORT="${API_PORT:-8010}"
uvicorn api.app:app --host 0.0.0.0 --port "$API_PORT" --reload
