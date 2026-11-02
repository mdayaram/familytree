import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseFamilies } from '../data/parseFamilies';

/** The real families.txt, parsed. Test-only helper. */
export function realFamilies() {
  return parseFamilies(readFileSync(resolve(__dirname, '../../families.txt'), 'utf8'));
}
