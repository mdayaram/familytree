# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal family tree visualizer. `families.txt` is the hand-edited source of truth; a Ruby script converts it into a GoJS genogram data file that a static HTML page renders. No build system, package manager, linter, or tests.

## Commands

```bash
./treemaker.rb        # parse families.txt -> regenerate assets/scripts/structure.js (prints "success")
open index.html       # view the result in a browser
```

Always rerun `./treemaker.rb` after editing `families.txt`, and commit the regenerated `assets/scripts/structure.js` alongside it (it is tracked in git). Never hand-edit `structure.js`.

## Data pipeline

`families.txt` → `treemaker.rb` → `assets/scripts/structure.js` → `assets/scripts/setup.js` (GoJS genogram) → `index.html`

### `families.txt` format

The file is a sequence of "households" separated by blank lines. Lines starting with `#` are comments. Leading whitespace is stripped, so the tab-indentation of children is only cosmetic.

```
Parent One (M)
Parent Two (F, deathday=x)
S                          # optional: "S" or "SEPARATED" marks the couple as separated
	Child Name (F)
	X (id=some_unique_id, M)
```

- Line 1 and 2 of a household are the two partners; every following line is a child of that union.
- Attributes go in parentheses: `M`/`F` for gender, `id=...`, `deathday=...` (any value just marks the person as deceased).
- A person's id defaults to their name with spaces and hyphens removed. Later references to the same person can be the bare name (or `X (id=...)`) with no attributes; the **first** occurrence defines gender/deceased status, and later attributes for an existing id are ignored.
- Unknown names are written as `X` with an explicit `id=` so they stay distinct.
- Every person must end up with a gender or `validate!` raises.
- A person can appear as a partner in multiple households (multiple marriages).

### `treemaker.rb`

- `FileParser` builds `PersonNode`s (keyed by id) and `UnionNode`s (two partners + children).
- `GenogramOutput` assigns sequential integer `key`s and emits GoJS genogram records: `n` name, `s` sex, `f`/`m` father/mother keys (derived from the parents' genders), `ux` wives, `vir` husbands, `a: ["D"]` for deceased.
- The diagram's focus person is hardcoded to id `ManojDayaram` in `focus_person`.
- The `separated` flag is parsed but not currently emitted to the output.

### Rendering (`assets/scripts/setup.js`)

Adapted from the GoJS genogram sample (https://gojs.net/latest/samples/genogram.html) with a custom `GenogramLayout` (LayeredDigraphLayout subclass). Marriage links intentionally use `routing: go.Link.AvoidsNodes` to prevent spurious-looking connections. The `layout()` function reads the radio/checkbox controls in `index.html` to tweak layout properties live. Attribute letters in `a` map to colors in `attrFill`.

`index.html` loads GoJS 2.2.10 from unpkg; the bundled `assets/scripts/go.js` (v1.6.5) is not referenced by the page.
