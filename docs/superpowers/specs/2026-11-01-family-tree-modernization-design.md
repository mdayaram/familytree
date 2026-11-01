# Family Tree Modernization — Design

Date: 2026-11-01
Status: Draft, revised after builder check

## Intent

This is a personal family tree viewer. Only its owner, Manoj, uses it. The family is large (246 people, 78 households, about 6 generations, 6 separate founding couples) and very wide: the bottom generations run about 100 people across in one row. The current GoJS page fits the whole tree onto one screen, so every name is unreadable and finding a specific person means hunting. It also shows a GoJS evaluation-licence watermark.

The typical moment: Manoj remembers someone ("Prem") and wants to see **how that person is connected to him**, or to any other chosen person. Seeing the line between them on the tree is enough. The relationship doesn't need to be described in words.

## Goals

1. **Search by name and fly to the person.** Typing narrows a list of matching names as you go. Picking one zooms and centres the map on that person and selects them.
2. **Highlight the path between two people.** The path runs between the selected person and a "path from" person, who is Manoj by default and can be changed to anyone. It follows parent–child and marriage links. It's drawn in red on the map, and everyone not on the path is faded.
3. **Make the wide tree workable.** Pan and zoom freely. A mini-map shows the whole tree and where you are in it.
4. **A modern stack without a licence watermark.**

## Non-goals

- Multiple users, sharing, accounts, hosting, or editing inside the app. `families.txt` is edited by hand in a text editor.
- **Photos, for now.** Deferred because the GitHub repo is public and family photos shouldn't be committed to it. The design should leave room to add them later (see Data).
- Describing relationships in words ("your mother's sister's husband").
- Extra details about people such as dates, places or notes. These may come later, and the data format must leave room for them (see Data).
- GEDCOM import or export.

## Anti-goals (a failure even if it technically works)

- Opening on a zoomed-out view of the whole tree where nothing is readable, like today.
- Making data editing more cumbersome than editing a text file.
- A view that only ever shows one person's immediate family (rejected option "B"). The whole tree must stay explorable as one map.

## Screen (decided with Manoj, mockup option "C + mini-map")

- **Map**, taking most of the screen: the whole tree, which can be dragged and zoomed.
  - The level of detail depends on zoom. Zoomed out, people are dots or small marks. Zoomed in, names are shown.
  - **Mini-map** in the bottom-right corner of the map, showing the entire tree with a rectangle for the current view. Clicking or dragging in it moves the map.
  - **Search box** in the top-left corner of the map.
  - The path is shown **only** on the map, as red lines and nodes. Everything off the path is faded.
- **Side panel** on the right, showing only the selected person:
  - Their name.
  - Their spouse(s), parents and children, each as a link that selects that person.
  - A "Show path from" picker, set to Manoj by default.
  - The panel does **not** list the path as text. Manoj explicitly removed that.

My calls on the screen, which Manoj hasn't confirmed:
- When the app opens, it's centred on Manoj at a zoom level where names are readable, and nobody is selected.
- Clicking a person on the map selects them, the same as picking them from search.
- When several people match a search, each result shows a disambiguating hint such as their spouse or parents.

## Data

### Source of truth: keep `families.txt`

Keep Manoj's household-based text format. It's readable, easy to diff and familiar to him. The current rules, which must be kept:

- Households are separated by blank lines. Lines starting with `#` are comments. Leading whitespace is ignored, and children are indented with tabs only for readability.
- The first two lines of a household are the two partners. An optional `S` or `SEPARATED` line comes next. Every remaining line is a child of that couple.
- Attributes go in parentheses: `M`/`F` for gender, `id=...`, and `deathday=...` (any value marks the person as deceased). Other attributes use the general `key=value` form, which is how future fields like birth year will be added.
- A person's id defaults to their name with spaces and hyphens removed. **The full name is unique by design.** Writing the same name in more than one household is how one person appears as a child in one household and as a partner in another. If two real people ever share a full name, Manoj will change one of the names to make them unique.
- `X (id=...)` is used for unknown people.
- The **first** occurrence of a person defines their gender and whether they're deceased.

Data checks. These run whenever the data is loaded, and problems are shown clearly in the browser and the dev console:
- Every person has a gender. This is an error, as it is today.
- A later mention of an existing id gives attributes that conflict with the first one. This is a warning; today the conflict is silently ignored.
- The same id is listed twice in one household. This is a warning. It's new, and catches typos like the one fixed below.

Separated couples: the flag is parsed today but never displayed. **My call:** draw a separated couple's marriage link as a dashed line.

Manoj has one person, Manesh Nawalrai, with two marriages. Multiple marriages must be handled correctly: each marriage gets its own couple point, with its own children under it.

### Photos (future, not in this build)

Photos are out of scope for now because the repo is public. The likely future shape, which this build should not rule out: one photo per person, matched by file name (`photos/<id>.jpg`), and kept out of the public repo. In practice this means the person card and side panel should have an obvious place where a photo could go later, without building it now.

### Removed

- `treemaker.rb` (the Ruby step), the generated `assets/scripts/structure.js`, the unused `assets/scripts/go.js` (GoJS 1.6.5), and the GoJS dependency.

## How it's built (decided)

Researched against the npm registry on 2026-11-01:

- **Vite 8 + React 19 + TypeScript 7.** A static app with no server, run locally with `npm run dev`.
- **React Flow (`@xyflow/react` 12.x, MIT)** draws the map. It provides pan and zoom, `<MiniMap>`, flying to a node, and custom node types for the person cards and couple points.
- **ELK.js (0.12.x, layered algorithm)** arranges the tree. The graph is modelled genogram-style: person nodes, plus a small couple node for each marriage. Partners connect to their couple node, and the couple node connects to each child.
- `families.txt` is parsed in TypeScript and loaded directly by the app, either through a small Vite plugin or as a raw import, so editing the file and reloading the page is the whole workflow. There's no separate generate step.
- Finding the path between two people is our own code: a shortest-path search over parent, child and spouse links.

Family-tree-specific libraries (Topola, family-chart) were looked at and rejected. Both are built around a view centred on one person, which is the rejected option B.

### First milestone: a test of the layout on the real data

ELK's quality on this tree is the main risk. The first step is to lay out all 246 real people with ELK in React Flow.

- **Criteria:** generations stay on consistent rows; partners sit next to each other with their couple point between them; children sit under their couple point; few marriage links cross between distant branches; names are readable at a normal zoom level.
- **Review: stop and show Manoj screenshots** of the real tree before building anything else. He decides whether it passes.
- **If ELK fails:** try the fallbacks d3-dag 1.3 (MIT) or dagre 3.x (MIT), which plug into React Flow the same way.
- **If all three fail:** go back to Manoj. Don't write a custom layout engine without his agreement.

## Left to the builder

- The visual styling: colours, card design, and how deceased people are marked. Today they get an attribute marker; something subtle is fine.
- The exact zoom levels where the detail changes, and the animation timing.
- The search matching rules (substring, case and accent insensitive, and so on).
- Which path to show when there are several equally short ones.
- The project layout, and whether to add tests. The parser and the path-finding are good candidates.
- Updating `README.md` and `CLAUDE.md` to describe the new workflow.

## Data fixes (done, merged in PR #2)

- Two different men were merged under the name `Prem`. The mother's-side couple are now `Pushpa Grenada` and `Prem Grenada`. Ruki and Jiwatram's son stays `Prem`. Parentheses can't be part of a name in this format, because they hold the attributes.
- `anil_divya_child_2` was listed twice in the same household. The second one is now `anil_divya_child_3`.
- `vandu_ma` is now marked deceased on both of her entries.
- Confirmed correct, so don't flag them as errors: Rajesh and Rina Mohinani are second cousins and married; Sheila and Sunder Chotrani are first cousins and married.

Data check to add, prompted by the Prem case: warn when a single-word name, with no surname and no explicit `id=`, is used in households from different branches.
