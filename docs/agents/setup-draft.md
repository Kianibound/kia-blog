# Matt Pocock setup — proposed, awaiting approval

The actual installed `setup-matt-pocock-skills/SKILL.md` was read, together with
its GitHub tracker, domain and triage templates and the installed `wayfinder`
and `grill-with-docs` instructions. This is a proposal, not completed setup.

Exploration found no root AGENTS.md/CLAUDE.md, Agent skills block, root glossary,
ADR directory, prior docs/agents configuration or local issue convention.
`backend/GLOSSARY.md` exists and stays authoritative. This two-app repository
has no npm workspaces/packages structure requiring multiple domain contexts.
The triage skill is installed. GitHub Issues is enabled; no issue is created.
VibeFarsi generated its own **frontend-scoped** AGENTS.md and CLAUDE.md; those
files are not root Matt Pocock configuration and are preserved.

## Approval required by the installed skill

The source instructions say: “Explore, present what you found, confirm with the
user, then write.” Step 3: “Let them edit before writing.” Step 4: “If neither
exists, ask the user which one to create; don't pick for them.”

Recommended first answer: **GitHub Issues** for Kianibound/kia-blog.
After that answer, ask the required next question: **keep default triage labels?**
Recommended yes. Then settle the root instruction filename (AGENTS.md recommended
for Codex) and let the user review the proposed block/files below. Do not activate
these files or create labels until that setup exchange is completed.

## Proposed root instruction block

```markdown
## Agent skills

### Issue tracker
Issues/specs live in Kianibound/kia-blog GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels
Use the five default triage labels. See `docs/agents/triage-labels.md`.

### Domain docs
Single context; existing backend glossary is authoritative. See `docs/agents/domain.md`.
```

## Proposed docs/agents/issue-tracker.md

```markdown
# Issue tracker: GitHub

Issues and specs live in https://github.com/Kianibound/kia-blog/issues.
Use authenticated `gh` CLI, or a verified GitHub connector when CLI is unavailable.
Follow the installed GitHub template's create/read/list/comment/close conventions.
On PowerShell use a UTF-8 body file and --body-file for multiline text.
PRs as a request surface: off. Ignore PRs when querying the triage queue.
Never create implementation tickets until specification approval.

## Wayfinding operations

The map is a wayfinder:map issue; decisions are child issues. Use native GitHub
sub-issues and blocked-by relationships, database IDs where required by API.
Create all issues before wiring their dependencies; never use placeholder IDs.
Find the frontier from open, unassigned, unblocked children. Claim a selected
decision by assignment. Record resolution as a comment, close it, then link its
title and one-line gist from the map. Refer to issues by linked titles.
If a connector cannot express native relationships, use a supported gh/API path
or report the limitation instead of inventing tool operations.
```

## Proposed docs/agents/triage-labels.md

| Canonical role | Proposed GitHub label |
|---|---|
| needs-triage | needs-triage |
| needs-info | needs-info |
| ready-for-agent | ready-for-agent |
| ready-for-human | ready-for-human |
| wontfix | wontfix |

Create only missing labels after approval; no labels changed in this task.

## Proposed docs/agents/domain.md

```markdown
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
```

## Recommended next skill

After completing this setup exchange, run **/wayfinder**: a complete frontend
spans sessions and still needs decisions about scope, auth, content format and
UX. Installed wayfinder charts decision issues; it is not implementation and
should not be run automatically at the end of foundation work. Agree its
destination first. Use **/grill-with-docs** for one bounded decision (such as
the first vertical slice), then specification, UI/UX detail, tickets,
implementation, review and retrospective after the relevant approvals.
