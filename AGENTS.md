# Kia Blog agent instructions

Backend and frontend are separate applications in this repository. Read
`backend/README.md`, `backend/ARCHITECTURE.md` and `backend/GLOSSARY.md` before
API-related planning. The backend implementation is the source of truth.
Frontend work also follows `frontend/AGENTS.md`.

Do not implement blog features, edit backend application code, deploy, or touch
production resources without the user's explicit approval. Planning tickets
require the relevant specification/planning approval. Do not start `/wayfinder`
until the current preparation findings have been reported to the user.

## Agent skills

### Issue tracker

Issues/specs live in Kianibound/kia-blog GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single context; existing backend glossary is authoritative. See `docs/agents/domain.md`.
