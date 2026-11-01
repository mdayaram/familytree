# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal family tree viewer (only Manoj uses it). `families.txt` is the hand-edited source of truth; a static Vite + React app parses it in the browser and draws the whole family as one zoomable React Flow map with search, a red path between two people, a mini-map and a side panel. No server, no database. Deployed to GitHub Pages at `http://noj.cc/familytree/`.

## Commands

```bash
npm run dev                              # dev server; editing families.txt hot-reloads
npm test                                 # vitest (jsdom), all tests
npx vitest run src/graph/familyGraph.test.ts   # one test file
npx vitest run -t "lists every Prem"     # tests matching a name
npm run typecheck                        # tsc -b
npm run build                            # production build to dist/ (base /familytree/)
```

## Data flow

`families.txt` → `parseFamilies` → `checkFamilies` → `buildGraph` → `layoutFamily` (ELK) → `toFlow` → React Flow

- `src/data/loadFamilies.ts` imports `families.txt` with Vite's `?raw`, so there is no generate step and nothing to commit besides the text file.
- **Graph model** (`src/graph/familyGraph.ts`): person nodes plus one union node per household (`union:<n>` in file order). Partners link to the union; the union links to each child. `findPath` is a BFS over this graph, so siblings connect through their parents' union, not through a parent.
- **Layout** (`src/layout/layoutFamily.ts`): each connected group of partners is laid out as ONE ELK node (partners side by side, the union dot between them; someone married twice sits between both spouses). Parent→child lines use ELK's orthogonal routes, drawn by `src/map/RoutedEdge.tsx`. `considerModelOrder` keeps siblings in file order. The layout test asserts partners share a row with the union between them.
- **Map** (`src/map/`): nodes carry fixed `width`/`height` — required, because controlled React Flow nodes never receive measured sizes and the mini-map skips unsized nodes. Below zoom `NAME_ZOOM` (0.35) person cards collapse to coloured marks.
- **App state** (`src/App.tsx`): `selectedId`, `pathFromId` (default `DEFAULT_PATH_FROM_ID` in `src/config.ts`), and `focus: {id, seq}` for fly-to. Any error from `checkFamilies` replaces the map with an error list; warnings go in a collapsible banner.

## families.txt rules

- Households are separated by blank lines; `#` lines are comments; indentation is ignored.
- Lines 1–2 of a household are the partners, then an optional `S`/`SEPARATED` line, then children.
- Attributes in `(...)`: `M`/`F`, `id=...`, `deathday=...` (any value = deceased); other `key=value` pairs are kept in `attrs`.
- Id defaults to the name without spaces/hyphens. Full names are unique by design; the same name again is the same person. The first mention decides gender and deceased status.
- Parentheses can't appear in a name (they hold attributes).
- A gender on more than one mention of the same id is warned as a possible accidental merge (that's how two different "Prem"s were once merged). Proper back-references are written bare.
- Confirmed-correct cousin marriages (don't "fix"): Rajesh + Rina Mohinani, Sheila + Sunder Chotrani.

## Testing notes

- Tests in `src/**/*.test.ts(x)`; `src/test/realData.ts` parses the real `families.txt`, and several tests pin real-data facts (246 people, 78 households, specific paths). Update those when the family data changes.
- On Manoj's Mac, a Chrome policy kills automated (DevTools-driven) browser sessions after ~5 seconds, so keep any Playwright checks short.
