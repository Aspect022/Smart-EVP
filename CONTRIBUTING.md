# Contributing to SmartEVP+
Thanks for helping improve SmartEVP+. This repository contains backend, web, and mobile applications that evolve together, so please follow the workflow below to keep changes stable and reviewable.

## Development principles
- Prefer **small, focused pull requests**.
- Keep backend API/event contracts and client usage in sync.
- Preserve demo reliability and deterministic fallback behavior.
- Never commit secrets or local machine-specific credentials.

## Local setup
1. Follow `README.md` quick-start for Backend, Frontend, and Mobile.
2. Ensure Mosquitto is running on port `1883`.
3. Copy environment templates:
   - `Backend/.env.example` -> `Backend/.env`
   - `Frontend/.env.example` -> `Frontend/.env.local`
   - `Mobile/.env.example` -> `Mobile/.env`

## Branching and commits
- Create branches from `main`:
  - `feature/<short-topic>`
  - `fix/<short-topic>`
  - `docs/<short-topic>`
- Write clear commit messages with intent + scope:
  - `feat(frontend): add role launcher guard`
  - `fix(backend): normalize case status payload`
  - `docs: update demo startup runbook`

## Pull request expectations
Include:
- what changed
- why the change is needed
- affected areas (`Backend`, `Frontend`, `Mobile`, `Docs`)
- setup/migration notes (if any)
- screenshots or recordings for UI changes

## Validation before opening a PR
Run the checks that apply to your change:

### Frontend
```powershell
cd D:\Projects\SmartEVP+\Frontend
npm run lint
```

### Mobile
```powershell
cd D:\Projects\SmartEVP+\Mobile
npm run typecheck
```

### Backend (smoke test)
```powershell
cd D:\Projects\SmartEVP+\Backend
.\.venv\Scripts\Activate.ps1
python start_all.py
```

Then verify:
- `http://localhost:8080/api/health` returns status `ok`
- frontend can connect and receive state updates

## Code style
### Python (Backend)
- Follow PEP 8 style conventions.
- Keep endpoint handlers and MQTT callbacks clear and defensive.
- Avoid hardcoding secrets or machine-specific values.

### TypeScript/React (Frontend + Mobile)
- Prefer explicit types for shared payloads.
- Keep view components role-focused and composable.
- Keep network/API wrappers centralized (`lib` or `api` folders).

## Documentation updates
When changing behavior, update the relevant docs in the same PR:
- `README.md` for setup/API/flow changes
- `Docs/` runbooks for operational changes
- env template files for new configuration variables

## Security and responsible changes
- Read `SECURITY.md` before reporting vulnerabilities.
- Do not open public issues containing exploit details, keys, or customer data.
