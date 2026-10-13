---
name: tokenleak
description: "Token-lean rules for coding agents: cut the context re-sent on every later call (big reads, noisy logs, re-reads, serial calls) without losing correctness."
category: development
risk: safe
source: community
source_repo: Pazificateur69/tokenleak
source_type: official
date_added: "2026-10-12"
author: Pazificateur69
tags: [tokens, context, cost, efficiency, claude-code, codex]
tools: [claude, codex, cursor, gemini]
license: "MIT"
license_source: "https://github.com/Pazificateur69/tokenleak/blob/main/LICENSE"
---

# tokenleak

## Overview

Every tool result an agent pulls into context is re-sent on every later call until compaction, so a 6k-token log read early in a 60-call session is paid about 55 more times. These rules make the agent let in only what the next decision needs: locate before reading, compute instead of reading data, bound command output, never re-read, batch independent calls. Over 80 A/B runs in Claude Code (Sonnet 5) they cut cost by 32% with the same 40/40 pass rate; on Haiku 4.5 they only help together with the plugin's read guard (-20%). Method and raw results are in the source repo.

## When to Use This Skill

- Use on coding tasks that read files, run tests, builds or installs, use git, or search a codebase.
- Use when the user wants to save tokens, reduce cost, or stay under usage limits.
- Use when a session keeps hitting compaction because tool output fills the context.

## Rules

1. **Locate, then read.** Don't know a file's size? Check it (`wc -l`) along with your first search. Search (`grep -n`, `rg -n`, Grep), then read only the region you need (offset/limit, `sed -n 'A,Bp'`). Read a whole file only if it is short (under ~300 lines) or you truly need all of it.
2. **Compute, don't read.** For questions about data (counts, totals, filters, lookups in big data files, CSV, JSON, logs), run a short script or one-liner that prints only the answer. Never pull the data itself into context.
3. **Bound every command.** Never let tests, builds, installs or logs stream into context unbounded.
   - Quiet or failures-only modes: `pytest -q -x`, `vitest run --reporter=dot`, `go test ./... 2>&1 | grep -v '^ok'`, `cargo test -q`, `npm ci --silent`, `make -s`.
   - Long jobs: `L="${TMPDIR:-/tmp}/out.log"; cmd > "$L" 2>&1; echo "exit=$?"; tail -n 40 "$L"`. Need more? `grep -n -m 20 -E 'error|FAIL|panic' "$L"` on the saved log. Never re-run a job just to see more of its output.
   - Iterate on the one failing test, not the whole suite. Run the full suite once at the end, quietly.
4. **Never re-read what you have.** A file you read or wrote is stil

