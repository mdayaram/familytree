Family Tree
===========

My family is complicated, so I built a tree visualization to make sense of it
all. It shows the whole family as one zoomable map: search for someone, fly to
them, and see the line connecting them to me (or to anyone else).

## Running it

```bash
npm install
npm run dev       # open the printed localhost URL
npm test          # unit and component tests
npm run build     # production build into dist/
```

Pushing to `main` deploys to GitHub Pages; pull requests run the tests.

## Editing the family

`families.txt` is the source of truth. Edit it and save; the running app
reloads. Problems (a missing gender, a name that looks like it belongs to two
different people) show up in the app with their line numbers.

The format is based on "households", so you always chunk two parents and their
children together:

```
Parent One (M)
Parent Two (F, deathday=x)
S                     # optional: the couple is separated
	Child Name (F)
	X (id=some_unique_id, M)
```

- Lines starting with `#` are comments. Indentation is just for readability.
- Attributes go in parentheses: `M`/`F`, `id=...`, and `deathday=...` (any
  value marks the person as deceased).
- A person's id is their name without spaces or hyphens. Full names are unique:
  writing the same name again refers to the same person, which is how someone
  appears as a child in one household and a parent in another. Write those
  later references bare (no parentheses).
- Use `X (id=...)` for people whose names I don't know.

I got inspiration for this format from
https://github.com/adrienverge/familytreemaker which is really nice, but had
some bugs when I tried to use it for my family tree, so I opted to build my own.

## History

The first version (2016) copied the GoJS genogram sample and later read a CSV
file that was awful to update; then a Ruby script turned this text format into
GoJS data. In 2026 it was rebuilt with Vite, React, React Flow and ELK so it
could search, highlight paths between people, and show the very wide tree with
a mini-map.

## TODO

* Photos (kept out of this public repo).
* Maybe more details per person (birth years, places, notes).
