# Development tools and verified limitations

Checked 2026-10-23. This Work session can execute local commands, but its exposed
tool catalog contains neither Codebase Memory nor VibeFarsi tools. A successful
manual protocol test does not register a tool in the host or prove persistence
across Work sessions. Global agent settings were not changed.

## Codebase Memory MCP

Official sources:
- https://github.com/DeusData/codebase-memory-mcp
- https://github.com/DeusData/codebase-memory-mcp/blob/v0.12.1/docs/CONFIGURATION.md

No callable Codebase Memory tool or usable executable was initially available
in this session. A pre-existing `codebase-memory` skill location was present but
its contents were not readable; it was not treated as an active MCP connection.

Downloaded official Windows amd64 **v0.12.1**, verified the archive against the
release `checksums.txt` (SHA256
`4e4e0f16b45233af5c757a1fcbe3c3b16e9056375b1fbe2ce020b6de75dedcc0`).
`--help` and `--version` worked. `config list` and root `cli index_repository`
failed with `could not load saved runtime settings`, including after explicitly
creating a writable CBM_CACHE_DIR and trying a writable CBM_RUNTIME_DIR.

**Result: no successful index, graph query or cross-process persistence check.**
Follow-up diagnosis: Windows sandbox execution cannot open the user's profile
ancestor with the READ_CONTROL access required by the native cache-security
validator (error 5). A fresh empty cache also fails before `_config.db` exists;
merely moving it below the same profile does not fix ancestor validation.
Creating an alternate cache under C:\workspace was denied by the host.
See `PREPARATION_FOLLOWUP.md` for source tracing, evidence and the supported
local-environment remedy. No ACL/security settings were weakened. Binary/cache
artifacts are not committed; no background watcher is active for this checkout.

### Reproduce in a supported local coding environment

1. Install the official release from its GitHub instructions, verify SHA256 and
   put `codebase-memory-mcp` on PATH. Review any installer edits before applying.
2. From the **whole repository root**, use a durable, writable cache outside git.
   Keep one canonical cache root across clients. Register the stdio server with
   your client's documented MCP settings; the example below is for Codex CLI.
3. Start a fresh session rooted at this repository. Confirm the tools are listed.
4. Run these documented CLI commands, retaining the project name returned by
   `list_projects` rather than guessing it:

```sh
codebase-memory-mcp --version
codebase-memory-mcp config list
codex mcp add codebase-memory -- codebase-memory-mcp
codebase-memory-mcp cli index_repository --repo-path /absolute/path/to/kia-blog
codebase-memory-mcp cli list_projects
codebase-memory-mcp cli get_graph_schema --project <returned-project-name>
codebase-memory-mcp cli query_graph --project <returned-project-name> --query 'MATCH (f:Function) RETURN f.name LIMIT 5'
codebase-memory-mcp cli index_status --project <returned-project-name>
```

Verify backend AND frontend paths with graph search/file outlines, and verify
coverage before trusting absent results. Close/reopen the client and repeat
`list_projects` + query without reindexing to prove persistence. Only then mark
setup complete. Index the repository root again after relevant changes; CLI-only
indexing does not imply automatic watching. Check `index_status.watch` for the
actual watch state. A future frontend is covered by reindexing after creation,
not by claiming nonexistent files were indexed.

Subsequent exploration: check freshness/schema, query the graph, then inspect
targeted source/DTOs when coverage or contract details require it. Until indexing
works, use existing domain/architecture docs plus targeted file searches.

## VibeFarsi

Official docs: https://vibefarsi.ir/docs

- CLI 2.0.0 `init --dry-run` and `init --no-install` succeeded in `frontend/`.
- Official files: Vazirmatn font setup, Graphite tokens, Tailwind mapping,
  `lib/utils.ts`, `lib/jalali.ts`, `vibefarsi.json`, frontend agent guidance.
- App document language/direction are centralized in `src/i18n/config.ts`.
- HTTP MCP endpoint https://vibefarsi.ir/mcp returned 200 for initialize
  (protocol 2025-03-26), tools/list (five tools), and tools/call search_registry
  (`button`, component, limit 1). The returned result identified the button slug.
- No feature component was installed just for this probe.
- Work has no verified persistent MCP registration. For supported Codex CLI:

```sh
codex mcp add vibefarsi --url https://vibefarsi.ir/mcp
```

Restart and verify its tool list, then call `get_design_rules`, `search_registry`
and `get_component` as required. Install only selected slugs through the official
CLI. See `frontend/README.md`. Do not invent components or copy an LTR UI kit.

## Host-specific command issues

The original checkout was read only for this task; work occurs in a separate
clone on `chore/frontend-foundation`. No old untracked handoff files were copied.
Git fetch needed a per-command OpenSSL TLS backend on this host; npm needed a
writable temporary cache. Neither workaround is a global project requirement.
Installed host runtime is Node 25.2.1; project recommendation is Node 24 LTS.

`create-next-app@16.4.2` failed in host `os.userInfo()` (`uv_os_get_passwd` ENOMEM).
Foundation used the downloaded official `app-tw-empty/ts` template instead,
with the same App Router/TypeScript/Tailwind setup and explicit npm dependencies.
This fallback is recorded rather than claiming the scaffolder ran successfully.
