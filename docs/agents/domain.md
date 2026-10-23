# Domain docs

Single-context layout. Read `backend/GLOSSARY.md` for existing domain language
and `backend/ARCHITECTURE.md` for implementation. Do not duplicate or relocate
that glossary. If a future root GLOSSARY.md exists, treat it as an entry point
to the canonical backend glossary and record only agreed additions there.

Read applicable `docs/adr/` entries before planning/implementation. Create ADRs
and new terms lazily through domain-modeling as decisions are agreed. Missing
docs are not a reason to stop or scaffold competing domain contexts.

Use established domain terms in code, specs and tickets. Surface conflicts with
existing ADRs explicitly before changing a decision.
