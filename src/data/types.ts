export type Gender = 'M' | 'F';

export interface Mention {
  line: number;
  role: 'partner' | 'child';
  attrs: Record<string, string | null>;
}

export interface Person {
  id: string;
  name: string;
  gender: Gender | null;
  deceased: boolean;
  mentions: Mention[];
}

export interface Union {
  /** `union:${index}` in file order */
  id: string;
  partners: [string, string];
  separated: boolean;
  children: string[];
  line: number;
}

export interface FamilyData {
  people: Map<string, Person>;
  unions: Union[];
}

export interface Issue {
  severity: 'error' | 'warning';
  line: number;
  message: string;
}
