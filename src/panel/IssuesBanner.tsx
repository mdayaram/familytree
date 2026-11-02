import { useState } from 'react';
import type { Issue } from '../data/types';

export const issueText = (i: Issue) => `families.txt:${i.line} — ${i.message}`;

/** A collapsed amber bar listing data warnings. Renders nothing when there are none. */
export function IssuesBanner({ issues }: { issues: Issue[] }) {
  const [open, setOpen] = useState(false);
  if (!issues.length) return null;
  const n = issues.length;
  return (
    <div className="issues-banner">
      <button type="button" className="link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {n} data warning{n === 1 ? '' : 's'}
      </button>
      {open && (
        <ul>
          {issues.map((i, k) => (
            <li key={k}>{issueText(i)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Full-page list shown instead of the map when families.txt has errors. */
export function IssuesPage({ issues }: { issues: Issue[] }) {
  return (
    <div className="issues-page">
      <h1>families.txt has {issues.length === 1 ? 'an error' : `${issues.length} errors`}</h1>
      <p>Fix these and save; the page reloads automatically.</p>
      <ul>
        {issues.map((i, k) => (
          <li key={k}>{issueText(i)}</li>
        ))}
      </ul>
    </div>
  );
}
