# PersonaWatch

- The repository is an npm workspace with `frontend` (React/Vite) and `backend` (Express). Use the root `dev`, `dev:frontend`, and `dev:backend` scripts for local development.
- The frontend calls the backend through `VITE_API_URL`; Vite proxies `/api` to `http://localhost:5053` during local development.
- Keep `frontend/src/App.jsx` and `frontend/src/utils/pdfGenerator.js` aligned with the response returned by `backend/src/routes/analyze.js`.
- `/api/analyze` supports `full`, `email`, and `username` scan modes. Preserve their mode-specific required inputs and score selection rules.
- Provider adapters distinguish a checked non-match (`found: false`) from a failed check (`error: true`) and an intentionally unqueried check (`skipped: true`); retain those meanings when changing integrations.
