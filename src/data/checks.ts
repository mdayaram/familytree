import type { FamilyData, Issue, Person } from './types';

const label = (p: Person) => (p.name === 'X' ? `Unknown person (id=${p.id})` : `"${p.name}"`);

export function checkFamilies(data: FamilyData): Issue[] {
  const issues: Issue[] = [];

  for (const p of data.people.values()) {
    const [first, ...later] = p.mentions;

    if (!p.mentions.some((m) => m.attrs.gender)) {
      issues.push({ severity: 'error', line: first.line, message: `${label(p)} has no gender — add (M) or (F)` });
    }

    // A mention that carries a gender is a definition; references to an existing person are written bare.
    const defs = p.mentions.filter((m) => m.attrs.gender);
    if (defs.length > 1) {
      issues.push({
        severity: 'warning',
        line: defs[1].line,
        message: `${label(p)} is defined at lines ${defs.map((m) => m.line).join(' and ')} — two different people may share this name`,
      });
    }

    for (const m of later) {
      if (!m.attrs.gender) continue;
      const genderDiffers = first.attrs.gender && m.attrs.gender !== first.attrs.gender;
      const deathDiffers = 'deathday' in first.attrs !== 'deathday' in m.attrs;
      if (genderDiffers || deathDiffers) {
        issues.push({
          severity: 'warning',
          line: m.line,
          message: `${label(p)} at line ${m.line} conflicts with line ${first.line} (${genderDiffers ? 'gender' : 'deceased'}); only line ${first.line} is used`,
        });
      }
    }
  }

  const parentUnions = new Map<string, number[]>();
  for (const u of data.unions) {
    const seen = new Set<string>();
    for (const c of u.children) {
      if (seen.has(c)) {
        issues.push({ severity: 'warning', line: u.line, message: `${label(data.people.get(c)!)} is listed twice in the household at line ${u.line}` });
        continue;
      }
      seen.add(c);
      parentUnions.set(c, [...(parentUnions.get(c) ?? []), u.line]);
    }
  }
  for (const [id, lines] of parentUnions) {
    if (lines.length > 1) {
      issues.push({
        severity: 'warning',
        line: lines[1],
        message: `${label(data.people.get(id)!)} has two sets of parents (households at lines ${lines.join(' and ')})`,
      });
    }
  }

  return issues;
}
