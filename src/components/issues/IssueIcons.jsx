import { ISSUE_TYPES, PRIORITY_BY_ID } from './issueMeta';

/** 16px square issue-type icon, drawn like Jira's (white glyph on coloured tile). */
export function IssueTypeIcon({ type, size = 16, className = '' }) {
  const meta = ISSUE_TYPES[type] || ISSUE_TYPES.task;
  const glyph = {
    epic: <path d="M9.6 2.5 4.5 9h3.2l-1.3 4.5L11.5 7H8.3l1.3-4.5Z" fill="#fff" />,
    feature: <path d="M5 3.5h6v9l-3-2.2-3 2.2v-9Z" fill="#fff" />,
    task: <path d="m4.5 8.2 2.3 2.3 4.7-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    bug: <circle cx="8" cy="8" r="3.2" fill="#fff" />,
    subtask: (
      <g fill="none" stroke="#fff" strokeWidth="1.5">
        <rect x="3.5" y="3.5" width="5" height="5" rx="1" />
        <rect x="7.5" y="7.5" width="5" height="5" rx="1" fill={meta.color} />
      </g>
    ),
  }[type] || null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={`flex-shrink-0 ${className}`}
      role="img"
      aria-label={meta.label}
    >
      <title>{meta.label}</title>
      <rect width="16" height="16" rx="3" fill={meta.color} />
      {glyph}
    </svg>
  );
}

/** Jira priority glyph (double/single chevrons, equals sign for medium). */
export function PriorityIcon({ priority, size = 16, className = '' }) {
  if (!priority) return null;
  const meta = PRIORITY_BY_ID[priority];
  const c = meta?.color || '#8590A2';
  const paths = {
    highest: ['M3 9.5 8 5l5 4.5', 'M3 13 8 8.5l5 4.5'],
    high: ['M3 11 8 6.5l5 4.5'],
    medium: ['M3 6.5h10', 'M3 10h10'],
    low: ['M3 5.5 8 10l5-4.5'],
    lowest: ['M3 3.5 8 8l5-4.5', 'M3 7 8 11.5 13 7'],
  }[priority];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={`flex-shrink-0 ${className}`} role="img" aria-label={meta?.label}>
      <title>{meta?.label}</title>
      {paths.map((d) => (
        <path key={d} d={d} stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
