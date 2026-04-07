# CLAUDE.md

Guidelines for Claude Code in this repository.

## About this repo

A workspace for coding tasks completed through OpenClaw. Each task lives in `tasks/<date>-<name>/` and typically contains source code, docs, and output artifacts. Tasks vary in stack and scope.

## My profile

- Solo developer
- Works across full-stack, mobile (React Native), and backend (Python/FastAPI)
- Typical stack: TypeScript + React (web), React Native (mobile), Python/FastAPI (backend), Vite

## How I like to work with Claude

### Judgment calls
Make a call and tell me what you decided. Don't stop to ask unless you're truly blocked.

### Communication
- Be concise. No preamble, no summaries of what you just did.
- Use markdown links for file references so they're clickable.

### Code changes
- Only change what was asked. Don't refactor, clean up, or improve surrounding code.
- Don't add tests unless I ask.
- Don't add comments or docstrings to code you didn't touch.
- Don't add error handling for scenarios that can't happen.
- Don't design for hypothetical future requirements.

### Git / GitHub
- Never push, force-push, or open PRs without my explicit confirmation.
- Commit style: conventional commits (`feat:`, `fix:`, `chore:`, etc.) are fine; follow the pattern in the existing log.

## Task folder conventions

```
tasks/
  YYYY-MM-DD-task-name/
    README.md       # context and decisions
    src/            # source code (or frontend/, backend/, mobile/)
    docs/           # optional specs or notes
```

## Auto-update this file

Update this file whenever you learn something important about how I work, what I prefer, or what to avoid — so future sessions have full context without me repeating myself.
