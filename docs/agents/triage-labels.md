# Triage labels

Approved default mapping for the installed Matt Pocock skills:

| Canonical role | GitHub label | Meaning |
|---|---|---|
| needs-triage | needs-triage | Maintainer evaluation needed |
| needs-info | needs-info | Waiting for information |
| ready-for-agent | ready-for-agent | Fully specified work suitable for an agent |
| ready-for-human | ready-for-human | Human implementation required |
| wontfix | wontfix | Will not be actioned |

Reuse existing labels; create only missing labels. Do not relabel existing work
as part of setup. Wayfinder decision issues use their own `wayfinder:*` labels.

Remote status on 2026-10-23: `wontfix` exists; the other four are missing.
Creation is authorized but blocked by unavailable authenticated label-capable
access in this session. Run `scripts/setup-triage-labels.ps1` with authenticated
GitHub CLI, then verify all five. See `../PREPARATION_FOLLOWUP.md`.
