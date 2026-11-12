// Jira-like vocabulary shared by every issue view (labels in French, as in the KAN project).

export const ISSUE_TYPES = {
  epic: { label: 'Epic', color: '#6E5DC6' },
  feature: { label: 'Feature', color: '#22A06B' },
  task: { label: 'Tâche', color: '#4688EC' },
  bug: { label: 'Bug', color: '#E2483D' },
  subtask: { label: 'Sous-tâche', color: '#4BADE8' },
};
export const CREATABLE_TYPES = ['feature', 'task', 'bug', 'epic'];

export const STATUSES = [
  { id: 'todo', label: 'À faire', category: 'todo' },
  { id: 'in_progress', label: 'En cours', category: 'in_progress' },
  { id: 'in_review', label: 'En cours de revue', category: 'in_progress' },
  { id: 'done', label: 'Terminé', category: 'done' },
];
export const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

// Atlassian lozenge colours per status category
export const CATEGORY_STYLE = {
  todo: { bg: '#DCDFE4', fg: '#44546F', hover: '#C9CED6' },
  in_progress: { bg: '#CCE0FF', fg: '#0055CC', hover: '#B3D1FF' },
  done: { bg: '#BAF3DB', fg: '#216E4E', hover: '#A0EBCB' },
};

export const PRIORITIES = [
  { id: 'highest', label: 'La plus haute', color: '#C9372C' },
  { id: 'high', label: 'Haute', color: '#E2483D' },
  { id: 'medium', label: 'Moyenne', color: '#E2B203' },
  { id: 'low', label: 'Basse', color: '#1D7AFC' },
  { id: 'lowest', label: 'La plus basse', color: '#388BFF' },
];
export const PRIORITY_BY_ID = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]));

export const apiError = (err, fallback = 'Une erreur est survenue') =>
  err?.response?.data?.error || err?.message || fallback;

export const formatDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', opts);
};

export const isOverdue = (issue) =>
  issue?.due_date && issue.status !== 'done' && new Date(`${issue.due_date.slice(0, 10)}T23:59:59`) < new Date();

/** Flatten issues so that each sub-task follows its parent (Jira list nesting). */
export function nestIssues(issues) {
  const byParent = new Map();
  const ids = new Set(issues.map((i) => i.id));
  for (const i of issues) {
    const pid = i.issue_type === 'subtask' && i.parent && ids.has(i.parent.id) ? i.parent.id : null;
    if (pid) {
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(i);
    }
  }
  const rows = [];
  for (const i of issues) {
    const nested = i.issue_type === 'subtask' && i.parent && ids.has(i.parent.id);
    if (nested) continue;
    rows.push({ issue: i, depth: 0, childCount: (byParent.get(i.id) || []).length });
    for (const c of byParent.get(i.id) || []) rows.push({ issue: c, depth: 1, parentId: i.id, childCount: 0 });
  }
  return rows;
}
