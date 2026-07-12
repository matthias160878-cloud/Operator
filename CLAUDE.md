# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository currently contains no source code — only a `README.md` placeholder. There are no build, lint, or test commands, no dependency manifests, and no established architecture yet.

When code is added to this repository, update this file with:
- Build/lint/test commands (including how to run a single test)
- High-level architecture and structure notes

## Claude Code skills

If this project ever integrates skills from an external "Jarvis" skills collection, symlink them into `.claude/skills` rather than copying the files, so updates to the source collection are picked up automatically:

```
ln -s /path/to/jarvis/skills /path/to/this-repo/.claude/skills
```
