import type { FamilyData, Gender, Issue, Mention, Person, Union } from './types';

interface Line {
  line: number;
  text: string;
}

interface ParsedEntry {
  id: string;
  name: string;
  gender: Gender | null;
  attrs: Record<string, string | null>;
}

/** Split the file into households: runs of non-blank, non-comment lines. */
function households(text: string): Line[][] {
  const out: Line[][] = [];
  let cur: Line[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const t = raw.trim();
    if (t.startsWith('#')) return;
    if (t === '') {
      if (cur.length) out.push(cur);
      cur = [];
      return;
    }
    cur.push({ line: i + 1, text: t });
  });
  if (cur.length) out.push(cur);
  return out;
}

/** `Name (attr, key=value, ...)` -> id, name, gender, other attributes. */
function parseEntry(text: string): ParsedEntry {
  const open = text.indexOf('(');
  const name = (open === -1 ? text : text.slice(0, open)).trim();
  const attrs: Record<string, string | null> = {};
  let gender: Gender | null = null;
  if (open !== -1) {
    for (const part of text.slice(open + 1).replace(/\)/g, '').split(',')) {
      const a = part.trim();
      if (!a) continue;
      const up = a.toUpperCase();
      if (up === 'M' || up === 'F') {
        gender = up;
        continue;
      }
      const eq = a.indexOf('=');
      if (eq === -1) attrs[a] = null;
      else attrs[a.slice(0, eq).trim()] = a.slice(eq + 1).trim();
    }
  }
  const id = attrs.id || name.replace(/[\s-]/g, '');
  return { id, name, gender, attrs };
}

export function parseFamilies(text: string): { data: FamilyData; issues: Issue[] } {
  const people = new Map<string, Person>();
  const unions: Union[] = [];
  const issues: Issue[] = [];

  const mention = (l: Line, role: Mention['role']): string => {
    const e = parseEntry(l.text);
    const attrs = { ...e.attrs, ...(e.gender ? { gender: e.gender } : {}) };
    let p = people.get(e.id);
    if (!p) {
      // The first mention decides gender and deceased status.
      p = { id: e.id, name: e.name, gender: e.gender, deceased: 'deathday' in e.attrs, mentions: [] };
      people.set(e.id, p);
    }
    p.mentions.push({ line: l.line, role, attrs });
    return e.id;
  };

  for (const hh of households(text)) {
    if (hh.length < 2) {
      issues.push({ severity: 'error', line: hh[0].line, message: `Household needs two partners: "${hh[0].text}"` });
      continue;
    }
    const [l1, l2, ...rest] = hh;
    let separated = false;
    if (rest.length && ['S', 'SEPARATED'].includes(rest[0].text.toUpperCase())) {
      separated = true;
      rest.shift();
    }
    const partners: [string, string] = [mention(l1, 'partner'), mention(l2, 'partner')];
    const children = rest.map((l) => mention(l, 'child'));
    unions.push({ id: `union:${unions.length}`, partners, separated, children, line: l1.line });
  }

  return { data: { people, unions }, issues };
}
