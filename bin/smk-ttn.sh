#!/usr/bin/env bash
# SMK TTN Desktop launcher (Linux).
# Dipakai oleh smk-ttn.desktop agar klik icon → buka app dari project dir.
#
# SMK_TTN_DEBUG=1   → tampilkan output live di terminal
# Default           → detached silent (no EPIPE), log ke ~/.config/smk-ttn-app/launcher.log

set -e
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ELECTRON_BIN="$PROJECT_DIR/node_modules/electron/dist/electron"
LOG_FILE="$HOME/.config/smk-ttn-app/launcher.log"

mkdir -p "$(dirname "$LOG_FILE")"

if [[ ! -x "$ELECTRON_BIN" ]]; then
  echo "[smk-ttn] ERROR: electron binary tidak ditemukan di $ELECTRON_BIN" >&2
  echo "[smk-ttn] Jalankan: npm install && npx electron-rebuild -f -w better-sqlite3" >&2
  exit 1
fi

cd "$PROJECT_DIR"

# Trap SIGPIPE (jika parent tutup pipe sebelum child selesai)
trap '' PIPE 2>/dev/null || true

if [[ -f "$PROJECT_DIR/dist/index.html" ]]; then
  MODE="production"
  ENV_FLAG="NODE_ENV=production"
else
  MODE="development"
  ENV_FLAG="NODE_ENV=development"
fi

if [[ "${SMK_TTN_DEBUG:-0}" == "1" ]]; then
  echo "[smk-ttn] launching ($MODE, debug mode)..." >&2
  exec env $ENV_FLAG "$ELECTRON_BIN" "$PROJECT_DIR"
else
  echo "[smk-ttn] launching ($MODE), logging to $LOG_FILE" >&2
  # Detach: stdio ke /dev/null, log ke file
  exec env $ENV_FLAG "$ELECTRON_BIN" "$PROJECT_DIR" </dev/null >>"$LOG_FILE" 2>&1
fi
