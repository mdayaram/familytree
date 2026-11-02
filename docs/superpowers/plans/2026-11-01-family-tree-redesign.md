# Family Tree Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the GoJS page with a local Vite + React app that shows the whole family as one zoomable map. It adds a mini-map, name search that flies to a person, a red path between the selected person and a "path from" person, and a side panel for the selected person.

**Architecture:**
- **Data:** `families.txt` stays the source of truth. A TypeScript parser turns it into people and unions (couples), and a checks module reports data problems.
- **Path and layout:** both work on the same graph of person nodes and union nodes. Partners connect to their union, and the union connects to each child. Finding a path is a breadth-first search over that graph. The layout is ELK's layered algorithm on the same graph.
- **Map:** React Flow draws it, using custom person and union nodes.

**Tech Stack:**

| Package | Version |
|---|---|
| Vite | 8.x |
| React | 19.x |
| TypeScript | 7.x |
| `@xyflow/react` | 12.x |
| `elkjs` | 0.12.x |
| Vitest | 5.x |
| `@testing-library/react` | 16.x |
| jsdom | 30.x |

Node 24 is installed locally.

**Spec:** `docs/superpowers/specs/2026-11-01-family-tree-modernization-design.md`

## Global Constraints

- Static app with no server. Run with `npm run dev`. It is used only on Manoj's machine.
- `families.txt` at the repo root is the only data source. It's loaded with a Vite `?raw` import, so editing it and reloading is the whole workflow, with no generate step.
- Keep the parsing rules exactly:
  - Households are separated by blank lines.
  - Lines starting with `#` are comments.
  - Leading and trailing whitespace is ignored.
  - In each household, lines 1–2 are the partners. An optional `S` or `SEPARATED` line (any case) comes next. Every remaining line is a child.
  - Attributes go in `(...)`, separated by commas:
    - `M` or `F` (any case) is the gender.
    - `id=...` sets the id.
    - `deathday=...` with any value means deceased.
    - Any other `key=value` is kept in `attrs`.
  - The id defaults to the name with spaces and `-` removed.
  - The first mention of an id decides gender and deceased status.
- The default "path from" person is the person with id `ManojDayaram`.
- The map opens centred on `ManojDayaram` at a zoom where names are readable, with nobody selected.
- The panel never lists the path as text. The path appears only as red nodes and edges on the map.
- No photos in this build. The panel and person cards keep an empty circle where a photo would go.
- No GoJS, and no evaluation watermark.
- People named `X` appear on the map and in the panel as "Unknown" and are excluded from search results.
- Draw a separated couple's partner→union edges dashed.
- Don't flag the two confirmed cousin marriages as errors:
  - Rajesh Mohinani + Rina Mohinani
  - Sheila Chotrani + Sunder Chotrani
- **Task 4 ends with a hard stop.** Screenshots go to Manoj, and the plan does not continue until he approves the layout.

## Review Focus

1. **A search query matching several people with the same first name.** Typing `prem` must list `Prem`, `Prem Grenada` and `Prem Chandiramani`, each with a hint naming a spouse or parents. Owner: Task 3.
2. **Selecting the "path from" person themselves, or someone with no connection.** Expected: no highlight, no crash, and the panel still renders. Owner: Task 2 (`findPath` returns `[id]` or `null`) and Task 6.
3. **A person with two marriages** (Manesh Nawalrai). Each marriage gets its own union. Children hang from the right union, and a path through his second marriage doesn't pass through the first. Owners: Tasks 1, 2 and 4.
4. **Editing `families.txt` into an error state,** such as a person with no gender. Expected: the app shows the error list with line numbers instead of a blank page. Owners: Tasks 1 and 7.
5. **Windows line endings, or a mix of tabs and spaces for indentation.** `families.txt` already mixes tabs with 2-space indents. It must parse the same. Owner: Task 1.

---

## File Structure

```
package.json, tsconfig.json, vite.config.ts, index.html (replaced)
src/main.tsx, src/App.tsx, src/styles.css, src/config.ts
src/data/types.ts            Person, Union, FamilyData, Issue
src/data/parseFamilies.ts    text -> FamilyData + parse issues
src/data/checks.ts           FamilyData -> Issue[]
src/data/loadFamilies.ts     ?raw import of ../../families.txt, parse + check
src/graph/familyGraph.ts     buildGraph, findPath, describePerson, relatives
src/graph/search.ts          searchPeople
src/layout/layoutFamily.ts   ELK graph build + positions
src/map/toFlow.ts            FamilyData + Layout + highlight -> React Flow nodes/edges
src/map/PersonNode.tsx, src/map/UnionNode.tsx, src/map/FamilyMap.tsx
src/panel/SidePanel.tsx, src/panel/SearchBox.tsx, src/panel/IssuesBanner.tsx
tests mirror src: src/**/*.test.ts(x)
Removed at the end: treemaker.rb, assets/
```

---

### Task 1: Scaffold the project and port the parser

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `src/config.ts`, `src/data/types.ts`, `src/data/parseFamilies.ts`, `src/data/parseFamilies.test.ts`, `src/vite-env.d.ts`
- Keep the old `index.html` for now. It's replaced in Task 4.

**Interfaces:**
- Produces:
  ```ts
  // src/config.ts
  export const DEFAULT_PATH_FROM_ID = 'ManojDayaram';
  // src/data/types.ts
  export type Gender = 'M' | 'F';
  export interface Mention { line: number; role: 'partner' | 'child'; attrs: Record<string, string | null> }
  export interface Person { id: string; name: string; gender: Gender | null; deceased: boolean; mentions: Mention[] }
  export interface Union { id: string /* `union:${index}` in file order */; partners: [string, string]; separated: boolean; children: string[]; line: number }
  export interface FamilyData { people: Map<string, Person>; unions: Union[] }
  export interface Issue { severity: 'error' | 'warning'; line: number; message: string }
  // src/data/parseFamilies.ts
  export function parseFamilies(text: string): { data: FamilyData; issues: Issue[] }
  ```
  `attrs` keeps every raw attribute except gender. A household with fewer than two partner lines produces an `error` Issue and is skipped.

- [ ] **Step 1: Scaffold the project.**
  - Use `npm create vite@latest` with the react-ts template, in a temp folder.
  - Copy across `package.json`, `tsconfig*.json` and `vite.config.ts`.
  - `npm i @xyflow/react elkjs`
  - `npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  - In `vite.config.ts`, set `test: { environment: 'jsdom' }`.
  - Add scripts: `"test": "vitest run"` and `"typecheck": "tsc --noEmit"`.
- [ ] **Step 2: Write the failing tests** in `src/data/parseFamilies.test.ts`:
  - `parses partners, separated flag and children`: from `"A B (M)\nC D (F)\nS\n\tE F (F)\n"`, expect:
    - `unions[0]` is `{ partners: ['AB','CD'], separated: true, children: ['EF'], id: 'union:0' }`
    - `people.get('EF').gender === 'F'`
  - `reuses a person across households by id`:
    - A person who is a child in household 1 and a partner in household 2 is one entry in `people`.
    - Their `mentions` has two entries, with roles `child` and `partner`.
  - `first mention wins`:
    - `X (id=a, F, deathday=x)` followed later by `X (id=a, F)` gives `deceased === true`.
  - `explicit id and hyphen stripping`: `Mary-Jane Doe (F)` gets the id `MaryJaneDoe`.
  - `ignores comments and accepts CRLF and mixed indentation`:
    - The same family written with `\r\n` line endings, `#` comment lines, and children indented with tabs in one household and 2 spaces in another…
    - …gives a result deep-equal to the clean version.
  - `two marriages make two unions` (Manesh case): `P (M)` married to `Q (F)` and later to `R (F)` gives:
    - two unions, both containing `P`
    - children attached only to their own union
  - `real families.txt`: read `families.txt` from the repo root with `fs`, then expect:
    - `issues.filter(i => i.severity === 'error')` is empty
    - `people.size === 246` and `unions.length === 78`
    - one union with partners `PushpaGrenada` and `PremGrenada`
    - `Prem` is a child of the union whose partners are `Ruki` and `Jiwatram`
- [ ] **Step 3: Run the tests and see them fail.** Run `npx vitest run src/data/parseFamilies.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 4: Implement `parseFamilies` in `src/data/parseFamilies.ts`.** Split on `/\r?\n/`, and treat a run of blank lines as one separator.
- [ ] **Step 5: Run the tests and see them pass.** Run `npx vitest run src/data/parseFamilies.test.ts`. Expected: all PASS.
- [ ] **Step 6: Commit** with the message `feat: scaffold Vite app and TypeScript families.txt parser`.

### Task 2: Graph, path finding and person descriptions

**Files:**
- Create: `src/graph/familyGraph.ts`, `src/graph/familyGraph.test.ts`

**Interfaces:**
- Consumes: `FamilyData`, `Union` and `Person` from Task 1.
- Produces:
  ```ts
  export interface FamilyGraph { data: FamilyData; adj: Map<string, string[]> } // node ids: person ids and union ids
  export function buildGraph(data: FamilyData): FamilyGraph
  export function findPath(g: FamilyGraph, fromId: string, toId: string): string[] | null
  // returns alternating person/union node ids, inclusive; [fromId] if equal; null if unreachable or unknown id
  export function displayName(p: Person): string            // 'Unknown' for name 'X'
  export function relatives(g: FamilyGraph, id: string): { parents: string[]; spouses: string[]; children: string[] }
  export function describePerson(g: FamilyGraph, id: string): string
  // first available of: 'spouse of <displayName>' (first spouse), 'child of <A> & <B>', '' — used as search hint
  ```
  `adj` connects each partner to the union and the union to each child, in both directions, in file order. The breadth-first search visits neighbours in `adj` order, so ties always resolve the same way.

- [ ] **Step 1: Write the failing tests.**
  - `findPath` on the real data (parse `families.txt` as in Task 1), from `ManojDayaram` to `PremGrenada`:
    - It returns exactly `['ManojDayaram','union:45','VeenaDayaram','union:42','Nani','union:4','PushpaGrenada','union:27','PremGrenada']`.
    - Siblings connect through their parents' union, so Muli herself isn't on the path, but the union for her and Boolchand (`union:4`) is.
  - `findPath(g,'ManojDayaram','ManojDayaram')` gives `['ManojDayaram']`.
  - `findPath` with an unknown id gives `null`.
  - On a two-component fixture, an unreachable person gives `null`.
  - Two-marriage fixture (P+Q with child C1; P+R with child C2): the path from `C2` to `R` is `['C2', 'union:1', 'R']`.
  - `relatives(g,'PushpaGrenada')` gives:
    - parents `['BoolchandMohinani','MuliMohinani']`, in any order
    - spouses `['PremGrenada']`
    - children `['RaniManghnani','RekhaMahtani']`
  - `describePerson(g,'Prem')` gives `'child of Ruki & Jiwatram'`.
  - `describePerson(g,'PremGrenada')` gives `'spouse of Pushpa Grenada'`.
- [ ] **Step 2: Run the tests and see them fail.** Run `npx vitest run src/graph/familyGraph.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement the five exported functions** with the signatures above.
- [ ] **Step 4: Run the tests and see them pass.** Run `npx vitest run src/graph/familyGraph.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** with the message `feat: family graph, shortest path and person descriptions`.

### Task 3: Search and data checks

**Files:**
- Create: `src/graph/search.ts`, `src/graph/search.test.ts`, `src/data/checks.ts`, `src/data/checks.test.ts`

**Interfaces:**
- Consumes: `FamilyGraph`, `describePerson` and `displayName` from Task 2, and `FamilyData` and `Issue` from Task 1.
- Produces:
  ```ts
  export interface SearchResult { id: string; name: string; hint: string }
  export function searchPeople(g: FamilyGraph, query: string, limit = 10): SearchResult[]
  export function checkFamilies(data: FamilyData): Issue[]
  ```

**`searchPeople` rules:**
- Matching is case- and accent-insensitive (NFD, then strip combining marks).
- Each word in the query must be the start of some word in the name.
- People named `X` are never returned.
- Results are ranked with exact full-name matches first, then whole-word matches, then prefix matches, then alphabetical.
- An empty query returns `[]`.

**`checkFamilies` issues:**
- `error`: a person with no gender on any mention.
- `warning`: a later mention whose `gender` or `deathday` attribute differs from the first mention.
- `warning`: the same id listed twice as a child of one union.
- `warning`: **possible accidental merge.** The same id has a gender attribute on more than one mention. The message reads `"<name>" is defined at lines A and B — two different people may share this name`.
  - This is the pattern the Prem merge had: `Prem (M)` at lines 141 and 385. Proper references to an existing person are written bare, with no attributes.
  - It covers the spec's "single-word name reused across branches" check. The structural signs can't tell a merge apart from a normal child-then-partner reference.
- `warning`: the same id is a child in more than one union, which would give one person two sets of parents.

**Steps:**
- [ ] **Step 1: Write the failing tests.**
  - `searchPeople(g,'prem')`, on the real data:
    - It returns the ids `Prem`, `PremChandiramani` and `PremGrenada`, all three.
    - Every result has a non-empty `hint`.
  - `searchPeople(g,'PREM gren')` returns `PremGrenada` first.
  - `searchPeople(g,'x')` contains no result with the name `X`.
  - `searchPeople(g,'')` gives `[]`.
  - `checkFamilies`:
    - A fixture with a genderless person gives one `error` with that line.
    - The duplicate-child fixture gives one `warning`.
    - The conflicting-deathday fixture gives one `warning`.
    - A Prem-style fixture, with `Prem (M)` as a partner in one household and `Prem (M)` as a child in another, gives one possible-merge `warning`. The same file with the second mention written bare (`Prem`) gives none.
    - The real `families.txt` gives zero `error`s, and exactly the possible-merge warnings for `vandu_ma` and `GulDayaram`. Both are harmless: the same person, with the attributes written twice.
- [ ] **Step 2: Run the tests and see them fail.** Run `npx vitest run src/graph/search.test.ts src/data/checks.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `searchPeople` and `checkFamilies`** with the signatures above.
- [ ] **Step 4: Run the tests and see them pass.** Expected: PASS.
- [ ] **Step 5: Commit** with the message `feat: name search with hints and data checks`.

### Task 4: ELK layout and the first map render (hard stop for review)

**Files:**
- Create: `src/layout/layoutFamily.ts`, `src/layout/layoutFamily.test.ts`, `src/map/toFlow.ts`, `src/map/PersonNode.tsx`, `src/map/UnionNode.tsx`, `src/map/FamilyMap.tsx`, `src/data/loadFamilies.ts`, `src/App.tsx`, `src/main.tsx`, `src/styles.css`
- Replace: `index.html`, using a Vite entry that loads `/src/main.tsx`.

**Interfaces:**
- Consumes: `FamilyData` and `FamilyGraph`.
- Produces:
  ```ts
  // layoutFamily.ts
  export const PERSON_W = 120, PERSON_H = 56, UNION_SIZE = 8;
  export interface Layout { positions: Map<string, { x: number; y: number }> } // top-left, keyed by person/union id
  export function layoutFamily(data: FamilyData): Promise<Layout>
  // loadFamilies.ts
  export function loadFamilies(): { data: FamilyData; graph: FamilyGraph; issues: Issue[] }
  // toFlow.ts
  export interface Highlight { nodeIds: Set<string>; selectedId: string | null } // empty set = no path
  export function toFlow(data: FamilyData, layout: Layout, h: Highlight): { nodes: Node[]; edges: Edge[] }
  // edge ids: `${partnerId}->${unionId}` and `${unionId}->${childId}`; edge.data.onPath when both ends are consecutive in the path
  // FamilyMap.tsx
  export function FamilyMap(props: { nodes: Node[]; edges: Edge[]; onSelect(id: string): void; focusId: string | null }): JSX.Element
  ```

**ELK settings:**
- `elk.algorithm` = `layered`
- `elk.direction` = `DOWN`
- `elk.layered.layering.strategy` = `NETWORK_SIMPLEX`
- `elk.layered.nodePlacement.strategy` = `NETWORK_SIMPLEX`
- `elk.spacing.nodeNode` = `20`
- `elk.layered.spacing.nodeNodeBetweenLayers` = `40`
- Use `elkjs/lib/elk.bundled.js`.
- These values are starting points. Tune them during review.

**Steps:**
- [ ] **Step 1: Write the failing test** in `src/layout/layoutFamily.test.ts`, on the real data:
  - Every person and union id has a position.
  - For every union, `y` is greater than the `y` of each partner.
  - For every child, `y` is greater than the union's `y`.
- [ ] **Step 2: Run the test and see it fail.** Run `npx vitest run src/layout/layoutFamily.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `layoutFamily`, `toFlow`, the two node components, `FamilyMap` and a bare `App`.**
  - `App` loads the data, computes the layout once, and renders `FamilyMap` full screen.
  - The person node is a card showing `displayName` with a 32px empty circle for the future photo. Deceased people get a subtle grey `†` after the name.
  - The union node is a small dot.
  - Edges are `smoothstep`. They're dashed when the union is `separated`.
- [ ] **Step 4: Run the test and see it pass.** Run `npx vitest run`. Expected: all PASS. Then run `npm run typecheck`. Expected: no errors.
- [ ] **Step 5: Take screenshots.**
  - Run `npm run dev`.
  - Use headless Chrome (`--headless=new --screenshot`) or Playwright to save three images:
    - the whole tree fitted to the screen
    - a closer view around `ManojDayaram`
    - the area around Manesh Nawalrai's two marriages
  - Save them to `.playwright-mcp/layout-*.png`.
- [ ] **Step 6: Commit** with the message `feat: ELK layout and first React Flow render`.
- [ ] **Step 7: HARD STOP. Show Manoj the screenshots.** Judge them against these criteria:
  - generations stay on rows
  - partners sit next to each other with the union between them
  - children sit under their union
  - few marriage edges cross between distant branches
  - names are readable at normal zoom

  If he rejects the layout, try `d3-dag` 1.3 (Sugiyama) and then `@dagrejs/dagre` 3.x behind the same `layoutFamily` signature, and screenshot again. If all three fail, go back to Manoj. Don't write a custom layout engine.

### Task 5: Map behaviour: mini-map, zoom detail, opening view, fly-to

**Files:**
- Modify: `src/map/FamilyMap.tsx`, `src/map/PersonNode.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `FamilyMap` props from Task 4.
- Produces: no new exports. `FamilyMap` now also does the following:
  - **Mini-map:** renders `<MiniMap pannable zoomable position="bottom-right" />` with path nodes coloured red.
  - **Zoom detail:** reads the zoom with `useStore(s => s.transform[2])`.
    - Below `0.35`, the person node shows only a coloured dot and no text.
    - At `0.35` or above, it shows the name.
  - **Opening view:** on first render, `setCenter` on `DEFAULT_PATH_FROM_ID` at zoom `1`.
  - **Fly-to:** when `focusId` changes to a non-null value, call `setCenter(x + PERSON_W/2, y + PERSON_H/2, { zoom: max(current, 1), duration: 600 })`.
  - **Selection:** clicking a person node calls `onSelect(id)`. Clicking the background calls nothing.

- [ ] **Step 1: Implement the behaviour above.**
- [ ] **Step 2: Verify.**
  - Run `npm run typecheck`. Expected: no errors.
  - Screenshot the opening view and check that it's centred on Manoj with names readable.
  - Screenshot a zoom of `0.2` and check it shows dots only.
  - Check that the mini-map is visible in the bottom-right corner.
- [ ] **Step 3: Commit** with the message `feat: mini-map, semantic zoom, open on Manoj, fly-to`.

### Task 6: Search box, selection, path highlight and side panel

**Files:**
- Create: `src/panel/SearchBox.tsx`, `src/panel/SearchBox.test.tsx`, `src/panel/SidePanel.tsx`, `src/panel/SidePanel.test.tsx`
- Modify: `src/App.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `searchPeople`, `findPath`, `relatives`, `displayName` and `toFlow`.
- Produces:
  ```ts
  export function SearchBox(props: { graph: FamilyGraph; onPick(id: string): void }): JSX.Element
  export function SidePanel(props: { graph: FamilyGraph; selectedId: string | null; pathFromId: string; onSelect(id: string): void; onPathFromChange(id: string): void }): JSX.Element
  ```

**App state:**
- `selectedId: string | null`, starting as `null`.
- `pathFromId: string`, starting as `DEFAULT_PATH_FROM_ID`.
- `focusId: string | null`, set when a person is picked from search, a panel link or the map.
- The highlight is `findPath(graph, pathFromId, selectedId)`. No selection or a `null` path means an empty set.

**Highlight styling:**
- Nodes and edges not on the path get `opacity: 0.2` while a path is shown.
- Nodes and edges on the path are red, `#d33`.

**SearchBox:**
- Overlays the top-left corner of the map.
- Results update as you type, using `searchPeople(graph, q, 10)`, and show `name — hint`.
- ↑ and ↓ move through the results, Enter picks one, and Esc clears.

**SidePanel:**
- A fixed right column, 320px wide.
- With no selection it says "Search or click someone on the map".
- With a selection, from top to bottom:
  - a 96px empty photo circle
  - the display name
  - "Married to", "Parents" and "Children" rows, as link buttons that call `onSelect`; empty rows are hidden
  - "Show path from:", a `SearchBox`-style picker that calls `onPathFromChange`, with the current person's display name shown

**Steps:**
- [ ] **Step 1: Write the failing component tests** using Testing Library, on the real data:
  - `SearchBox`:
    - Typing `prem` shows 3 options, each with hint text.
    - Pressing Enter calls `onPick('Prem…')` with the first result's id.
  - `SidePanel` with `selectedId='PremGrenada'`:
    - It shows "Prem Grenada" and a "Married to" link "Pushpa Grenada".
    - Clicking that link calls `onSelect('PushpaGrenada')`.
    - It does **not** contain the text "Path to".
  - `SidePanel` with `selectedId=null` shows the placeholder text.
  - `SidePanel` with `selectedId === pathFromId` renders without throwing.
- [ ] **Step 2: Run the tests and see them fail.** Run `npx vitest run src/panel`. Expected: FAIL.
- [ ] **Step 3: Implement `SearchBox`, `SidePanel` and the App wiring** as described above.
- [ ] **Step 4: Run the tests and see them pass.** Run `npx vitest run`. Expected: all PASS.
- [ ] **Step 5: Verify end to end.**
  - Screenshot after searching `prem` and picking Prem Grenada.
  - The red path must run Manoj → Veena → Nani → (the union for Muli and Boolchand) → Pushpa Grenada → Prem Grenada, with everything else faded.
  - The panel shows Prem Grenada.
  - Change "Show path from" to `Rani Manghnani` and confirm the path updates.
- [ ] **Step 6: Commit** with the message `feat: search, selection, path highlight and side panel`.

### Task 7: Show data problems and live reload

**Files:**
- Create: `src/panel/IssuesBanner.tsx`, `src/panel/IssuesBanner.test.tsx`
- Modify: `src/App.tsx`, `src/data/loadFamilies.ts`

**Interfaces:**
- Consumes: `Issue[]` from `loadFamilies()`.
- Produces: `IssuesBanner(props: { issues: Issue[] }): JSX.Element | null`.
  - No issues: renders nothing.
  - Warnings only: a collapsible amber bar at the top showing "N data warnings", which expands to `families.txt:<line> — <message>`.
  - Any errors: `App` renders only a full-page list of errors in the same format, with no map.
  - Every issue is also logged with `console.warn` or `console.error`.

**Steps:**
- [ ] **Step 1: Write the failing tests.**
  - With `[]`, the banner renders nothing.
  - With one warning, it shows `1 data warning`, and after a click it shows `families.txt:12`.
  - In an `App`-level test, mock `loadFamilies` to return an error issue. The error list renders and the `.react-flow` element is absent.
- [ ] **Step 2: Run the tests and see them fail.** Run `npx vitest run src/panel/IssuesBanner.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement the banner and the error page.**
- [ ] **Step 4: Run the tests and see them pass.** Run `npx vitest run`. Expected: all PASS.
- [ ] **Step 5: Verify live reload manually.**
  - With `npm run dev` running, temporarily remove `(M)` from a person in `families.txt`.
  - The page reloads with the error list showing that line.
  - Restore the line, and the map returns.
  - Confirm `git diff families.txt` is empty afterwards.
- [ ] **Step 6: Commit** with the message `feat: surface data problems in the UI`.

### Task 8: Remove the old pipeline and update the docs

**Files:**
- Delete: `treemaker.rb` and `assets/` (`structure.js`, `setup.js`, `go.js`)
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Delete the old files.** Run `grep -rn "structure.js\|treemaker\|go.js\|setup.js" --exclude-dir=node_modules --exclude-dir=docs .` and expect no matches outside `README.md` and `CLAUDE.md`, which are rewritten next.
- [ ] **Step 2: Rewrite the README "how to run" section and the CLAUDE.md commands and architecture sections:**
  - Commands: `npm install`, `npm run dev`, `npm test`, `npx vitest run <file>`, `npm run typecheck`.
  - The data flow: `families.txt` → `parseFamilies` → `checkFamilies` → `buildGraph` → `layoutFamily` → `toFlow` → React Flow.
  - The `families.txt` rules from Global Constraints.
  - The default "path from" setting in `src/config.ts`.
  - Keep the README's history notes. Drop the GoJS-specific instructions.
- [ ] **Step 3: Verify.** Run `npm test && npm run typecheck && npm run build`. Expected: all succeed.
- [ ] **Step 4: Commit** with the message `chore: remove GoJS/Ruby pipeline, update docs`.
- [ ] **Step 5: Open the PR.** Push `redesign/react-flow-map` and open a PR against `main`. The description summarises the features and includes the Task 6 screenshot description.

### Task 9: CI and GitHub Pages deployment (added at Manoj's request)

The site is served by GitHub Pages at `http://noj.cc/familytree/`. It currently uses a "legacy" build that publishes `main` at `/`.

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- Modify: `vite.config.ts`, setting `base: '/familytree/'` for production builds

**Workflows:**
- `ci.yml` runs on `pull_request` and on `push` to `main`, on Node 24:
  - `npm ci`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
- `deploy.yml` runs on `push` to `main` and `workflow_dispatch`, using GitHub's standard Pages actions:
  - `actions/configure-pages`
  - `actions/upload-pages-artifact` with `path: dist`
  - `actions/deploy-pages`
  - permissions: `pages: write` and `id-token: write`
  - a `concurrency` group of `pages`
  - It deploys only after the same test steps pass.

**Steps:**
- [ ] **Step 1: Add the workflows and the production `base`.**
- [ ] **Step 2: Verify the build.** Run `npm run build`, then `npx vite preview --base /familytree/`.
  - Expected: the app loads at `/familytree/`, and the built `dist/` contains no `families.txt` request (the data is bundled).
- [ ] **Step 3: Check the workflows run on the PR.** Push the branch and confirm with `gh pr checks`. Expected: CI passes on the PR.
- [ ] **Step 4: Switch the Pages source to GitHub Actions before merging. Ask Manoj first:** it's a repository setting that changes how the live site is published. Once switched, merging to `main` deploys the new app.
- [ ] **Step 5: Commit** with the message `ci: run tests on PRs and deploy to GitHub Pages`.
