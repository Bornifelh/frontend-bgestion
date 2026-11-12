import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, ChevronDown, X, Code2, Check } from 'lucide-react';
import Popover, { MenuItem } from './Popover';
import { UserAvatar } from './IssueFields';
import { IssueTypeIcon, PriorityIcon } from './IssueIcons';
import { ISSUE_TYPES, STATUSES, PRIORITIES } from './issueMeta';

const q = (v) => `"${String(v).replace(/"/g, '\\"')}"`;

/** Build a JQL string from the basic filters (what Jira does under the hood). */
export function basicToJql({ text, assignees, types, statuses, priorities, labels }, orderBy = 'rank ASC') {
  const parts = [];
  if (text?.trim()) parts.push(`text ~ ${q(text.trim())}`);
  if (assignees?.length) {
    const vals = assignees.map((a) => (a === 'unassigned' ? 'EMPTY' : q(a)));
    parts.push(`assignee IN (${vals.join(', ')})`);
  }
  if (types?.length) parts.push(`type IN (${types.join(', ')})`);
  if (statuses?.length) parts.push(`status IN (${statuses.join(', ')})`);
  if (priorities?.length) parts.push(`priority IN (${priorities.join(', ')})`);
  if (labels?.length) parts.push(`labels IN (${labels.map(q).join(', ')})`);
  return `${parts.join(' AND ')}${parts.length ? ' ' : ''}ORDER BY ${orderBy}`;
}

const EMPTY = { text: '', assignees: [], types: [], statuses: [], priorities: [], labels: [] };

function MultiSelect({ label, options, value, onChange }) {
  const count = value.length;
  return (
    <Popover
      width={240}
      trigger={({ toggle, ref, open }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          className={`flex h-8 items-center gap-1 rounded-[3px] border px-2.5 text-sm font-medium ${
            count ? 'border-[#0C66E4] bg-[#E9F2FF] text-[#0C66E4]' : 'border-[#DCDFE4] bg-white text-[#44546F] hover:bg-[#F7F8F9]'
          } ${open ? 'ring-2 ring-[#388BFF]/40' : ''}`}
        >
          {label}
          {count > 0 && <span className="rounded-full bg-[#0C66E4] px-1.5 text-[11px] leading-4 text-white">{count}</span>}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}
    >
      <div className="max-h-72 overflow-y-auto">
        {options.map((o) => {
          const sel = value.includes(o.id);
          return (
            <MenuItem key={o.id} onClick={() => onChange(sel ? value.filter((v) => v !== o.id) : [...value, o.id])}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-[3px] border-2 ${sel ? 'border-[#0C66E4] bg-[#0C66E4]' : 'border-[#8590A2]'}`}>
                {sel && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              {o.icon}
              <span className="truncate">{o.label}</span>
            </MenuItem>
          );
        })}
        {options.length === 0 && <div className="px-3 py-2 text-sm text-[#626F86]">Aucune valeur</div>}
      </div>
    </Popover>
  );
}

/**
 * Jira-like filter bar: search + assignee avatars + filters, with a switch to
 * raw JQL. Calls onJqlChange with the effective JQL string.
 */
export default function FilterBar({ meta, onJqlChange, jqlError, defaultOrder = 'rank ASC' }) {
  const [mode, setMode] = useState('basic');
  const [f, setF] = useState(EMPTY);
  const [text, setText] = useState('');
  const [jqlDraft, setJqlDraft] = useState(`ORDER BY ${defaultOrder}`);

  // debounce the free-text search
  useEffect(() => {
    const t = setTimeout(() => setF((p) => (p.text === text ? p : { ...p, text })), 300);
    return () => clearTimeout(t);
  }, [text]);

  const basicJql = useMemo(() => basicToJql(f, defaultOrder), [f, defaultOrder]);
  useEffect(() => {
    if (mode === 'basic') onJqlChange(basicJql);
  }, [basicJql, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const activeCount = f.types.length + f.statuses.length + f.priorities.length + f.labels.length + f.assignees.length + (f.text ? 1 : 0);
  const assignees = meta?.assignees || [];

  const switchToJql = () => {
    setJqlDraft(basicJql);
    setMode('jql');
  };
  const switchToBasic = () => {
    setMode('basic');
    setF(EMPTY);
    setText('');
  };

  if (mode === 'jql') {
    return (
      <div className="px-6 py-3">
        <form
          className="flex items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onJqlChange(jqlDraft);
          }}
        >
          <div className="flex-1">
            <div className={`flex items-center rounded-[3px] border-2 bg-white ${jqlError ? 'border-[#C9372C]' : 'border-[#DCDFE4] focus-within:border-[#388BFF]'}`}>
              <Code2 className="ml-2 h-4 w-4 flex-shrink-0 text-[#626F86]" />
              <input
                value={jqlDraft}
                onChange={(e) => setJqlDraft(e.target.value)}
                spellCheck={false}
                placeholder='project = KAN AND status = "En cours" ORDER BY rank'
                className="h-8 w-full bg-transparent px-2 font-mono text-[13px] text-[#172B4D] outline-none"
              />
            </div>
            {jqlError && <p className="mt-1 text-xs text-[#AE2E24]">{jqlError}</p>}
          </div>
          <button type="submit" className="h-9 rounded-[3px] bg-[#0C66E4] px-3 text-sm font-medium text-white hover:bg-[#0055CC]">
            Rechercher
          </button>
          <button type="button" onClick={switchToBasic} className="h-9 rounded-[3px] px-2 text-sm font-medium text-[#44546F] hover:bg-[#091E420F]">
            Basique
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3">
      <div className="flex h-8 w-56 items-center rounded-[3px] border-2 border-[#DCDFE4] bg-white focus-within:border-[#388BFF]">
        <Search className="ml-2 h-4 w-4 text-[#626F86]" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Rechercher un ticket"
          className="w-full bg-transparent px-2 text-sm outline-none"
        />
      </div>

      <div className="flex items-center pl-1">
        {assignees.slice(0, 5).map((u, idx) => {
          const sel = f.assignees.includes(u.email);
          return (
            <button
              key={u.id}
              type="button"
              title={u.name}
              onClick={() => set('assignees')(sel ? f.assignees.filter((a) => a !== u.email) : [...f.assignees, u.email])}
              className={`relative rounded-full ring-2 transition-transform hover:z-10 hover:-translate-y-0.5 ${sel ? 'z-10 ring-[#0C66E4]' : 'ring-white'}`}
              style={{ marginLeft: idx ? -6 : 0 }}
            >
              <UserAvatar user={u} size={28} />
            </button>
          );
        })}
        <button
          type="button"
          title="Non assignée"
          onClick={() => set('assignees')(f.assignees.includes('unassigned') ? f.assignees.filter((a) => a !== 'unassigned') : [...f.assignees, 'unassigned'])}
          className={`relative rounded-full ring-2 ${f.assignees.includes('unassigned') ? 'z-10 ring-[#0C66E4]' : 'ring-white'}`}
          style={{ marginLeft: assignees.length ? -6 : 0 }}
        >
          <UserAvatar user={null} size={28} />
        </button>
      </div>

      <MultiSelect
        label="Type"
        value={f.types}
        onChange={set('types')}
        options={Object.entries(ISSUE_TYPES).map(([id, t]) => ({ id, label: t.label, icon: <IssueTypeIcon type={id} /> }))}
      />
      <MultiSelect label="État" value={f.statuses} onChange={set('statuses')} options={STATUSES.map((s) => ({ id: s.id, label: s.label }))} />
      <MultiSelect
        label="Priorité"
        value={f.priorities}
        onChange={set('priorities')}
        options={PRIORITIES.map((p) => ({ id: p.id, label: p.label, icon: <PriorityIcon priority={p.id} /> }))}
      />
      <MultiSelect label="Étiquettes" value={f.labels} onChange={set('labels')} options={(meta?.labels || []).map((l) => ({ id: l, label: l }))} />

      {activeCount > 0 && (
        <button type="button" onClick={switchToBasic} className="flex h-8 items-center gap-1 rounded-[3px] px-2 text-sm font-medium text-[#44546F] hover:bg-[#091E420F]">
          <X className="h-3.5 w-3.5" /> Effacer les filtres
        </button>
      )}
      <button
        type="button"
        onClick={switchToJql}
        className="ml-auto flex h-8 items-center gap-1.5 rounded-[3px] px-2 text-sm font-medium text-[#44546F] hover:bg-[#091E420F]"
        title="Passer en recherche avancée (JQL)"
      >
        <Filter className="h-4 w-4" /> JQL
      </button>
    </div>
  );
}
