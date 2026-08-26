# Freebuff Run Doc

## How to Reproduce Artifacts

1. Dependencies are already installed in `frontend/node_modules/`.
2. No build artifacts needed — Vite dev server serves on the fly.

## How to Run the Server

```bash
cd frontend
npx vite --host --port 5173
```

The dev server runs on port 5173 by default (falls back to next available if busy).

### Detached Launch (Windows)

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'npx.cmd' -ArgumentList 'vite','--host','--port','5173' -WorkingDirectory 'C:\Users\Joji\2026 Exp\sign-language-lms1\frontend' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

### Running Tests

```bash
cd frontend
npx vitest run
```
