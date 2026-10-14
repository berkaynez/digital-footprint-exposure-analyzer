---
name: api-security-review
description: Reviews PersonaWatch's Express API for abuse, privacy, and provider-integration risks. Use when reviewing API routes, CORS, rate limiting, scan inputs, external provider calls, or API security changes.
---

# PersonaWatch API Security Review

Review without modifying files unless asked.

## Scope

Trace requests through:

- `backend/src/app.js` for middleware, CORS, and rate limits.
- `backend/src/routes/` for validation and response handling.
- `backend/src/utils/breachProviders/` and `backend/src/utils/platformProviders/` for outbound calls.
- `frontend/src/App.jsx` and `frontend/vite.config.js` for client/API assumptions.

## Checks

- Confirm every scan mode (`full`, `email`, `username`) is server-validated; do not rely on frontend acknowledgement or validation.
- Assess whether public endpoints enable unauthorized email-breach or username-enumeration use; evaluate CORS and rate-limit behavior together.
- Review CORS origins and credentials settings for unnecessary cross-origin access.
- Verify identifiers are encoded before outbound requests and provider/API secrets remain server-only.
- Distinguish confirmed no-match responses from provider failures, rate limits, disabled providers, and skipped checks. Ensure failures cannot be presented as confirmed absence.
- Check timeouts, error handling, and response bodies for leakage of provider details, tokens, or submitted identifiers.

## Report

List findings by severity. For each finding include:

- Evidence: file and line.
- Concrete impact or abuse path.
- Smallest appropriate remediation.
- Validation or regression test to add.

State explicitly when a relevant control is absent or not verifiable from the repository.
