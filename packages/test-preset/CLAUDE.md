# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the test-preset package.

**IMPORTANT: Always refer to `.cursor/rules/` for development standards.**

## 🎯 Purpose

`@repo/test-preset` is the shared **test preload + test helpers** package for the monorepo.

> For **AI code-generation guidance** (how to write tests, mocking strategy, table-driven cases, minimal LoC conventions), use the Cursor rule: `../../.cursor/rules/testing.mdc`.

At runtime, tests are executed via **`bun test`** from consuming packages/apps; the preset is loaded globally by the root `bunfig.toml`.

## ⚙️ How it’s wired

- Root `bunfig.toml` preloads these files before running tests:
  - `packages/test-preset/happydom.ts`
  - `packages/test-preset/testing-library.ts`
  - `packages/test-preset/test-setup.ts`

So in most packages you do **not** need to import this package explicitly to get the DOM environment, Testing Library matchers, and per-test cleanup.

## 📦 Exports (package API)

From `package.json#exports`:

- `@repo/test-preset` → `test-setup.ts` (global setup)
- `@repo/test-preset/happydom` → `happydom.ts` (DOM globals via HappyDOM)
- `@repo/test-preset/testing-library` → `testing-library.ts` (Testing Library matchers + cleanup hook)
- `@repo/test-preset/mock-modules` → `mock-modules.ts` (module-level mocks)
- `@repo/test-preset/mock-bun` → `mock-bun.ts` (helpers for mocking Bun APIs)
- `@repo/test-preset/test-by-folder` → `test-by-folder.ts` (debugging tool for isolation issues)

## 🗂️ File map (where to change what)

- `happydom.ts`: registers HappyDOM globals
- `testing-library.ts`: extends matchers + performs RTL cleanup
- `test-setup.ts`: shared afterEach cleanup, mock reset/restore, and tiny helper utilities
- `mock-modules.ts`: helpers for mocking common modules (fs, bun command wrapper)
- `mock-bun.ts`: Bun runtime mocks (file/write/command) + setup/restore helpers
- `test-by-folder.ts`: runs tests folder-by-folder to identify cross-test interference
- `matchers.d.ts`: types for jest-dom matchers

## 🧰 Common commands

```bash
# Run all tests (root)
bun test

# Debug cross-test interference (run tests folder-by-folder)
bun run @repo/test-preset/test-by-folder

# Focus on a specific area
bun run @repo/test-preset/test-by-folder packages/utils/src
```

## 🔧 Working on this package

When you change preload behavior (setup/cleanup/mocking), verify:

- Tests still run in a package without explicit imports (because preload is global)
- Tests don’t leak globals/mocks between files
- `test-by-folder` remains usable for isolating failures