import familiesText from '../../families.txt?raw';
import { buildGraph, type FamilyGraph } from '../graph/familyGraph';
import { checkFamilies } from './checks';
import { parseFamilies } from './parseFamilies';
import type { FamilyData, Issue } from './types';

/** Parse and check families.txt (bundled via ?raw, so edits hot-reload). */
export function loadFamilies(): { data: FamilyData; graph: FamilyGraph; issues: Issue[] } {
  const { data, issues } = parseFamilies(familiesText);
  return { data, graph: buildGraph(data), issues: [...issues, ...checkFamilies(data)] };
}
