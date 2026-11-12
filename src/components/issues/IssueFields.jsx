import { useMemo, useState } from 'react';
import { ChevronDown, User as UserIcon, Check, Search } from 'lucide-react';
import Popover, { MenuItem } from './Popover';
import { PriorityIcon } from './IssueIcons';
import { STATUSES, STATUS_BY_ID, CATEGORY_STYLE, PRIORITIES, PRIORITY_BY_ID } from './issueMeta';

const AVATAR_COLORS = ['#0C66E4', '#1F845A', '#AE2E24', '#5E4DB2', '#A54800', '#206A83', '#943D73', '#626F86'];

export function UserAvatar({ user, size = 24 }) {
  if (!user) {
    return (
      <span
        className="inline-flex flex-shrink-0 items-center justify-center rounded-full bg-[#DFE1E6] text-[#626F86]"
        style={{ width: size, height: size }}
        title="Non assignée"
      >
        <UserIcon style={{ width: size * 0.6, height: size * 0.6 }} />
      </span>
    );
  }
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} title={user.name} className="flex-shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = (user.name || user.email || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const color = AVATAR_COLORS[(user.id || '').charCodeAt(0) % AVATAR_COLORS.length || 0];
  return (
    <span
      title={user.name}
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.max(9, size * 0.4) }}
    >
      {initials}
    </span>
  );
}

/** Jira status lozenge; clickable dropdown when `onChange` is provided. */
export function StatusLozenge({ status, onChange, size = 'sm' }) {
  const meta = STATUS_BY_ID[status] || STATUSES[0];
  const style = CATEGORY_STYLE[meta.category];
  const cls = size === 'lg' ? 'h-8 px-3 text-sm font-semibold' : 'h-5 px-1.5 text-[11px] font-bold uppercase tracking-[0.02em]';
  const lozenge = (props = {}) => (
    <span
      {...props}
      className={`inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-[3px] ${cls} ${onChange ? 'cursor-pointer' : ''}`}
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      <span className="truncate">{meta.label}</span>
      {onChange && <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />}
    </span>
  );
  if (!onChange) return lozenge();
  return (
    <Popover
      width={220}
      trigger={({ toggle, ref }) => (
        <button ref={ref} type="button" onClick={toggle} className="max-w-full rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#388BFF]">
          {lozenge()}
        </button>
      )}
    >
      {({ close }) =>
        STATUSES.map((s) => {
          const st = CATEGORY_STYLE[s.category];
          return (
            <MenuItem
              key={s.id}
              selected={s.id === status}
              onClick={() => {
                close();
                if (s.id !== status) onChange(s.id);
              }}
            >
              <span className="rounded-[3px] px-1.5 text-[11px] font-bold uppercase" style={{ backgroundColor: st.bg, color: st.fg }}>
                {s.label}
              </span>
            </MenuItem>
          );
        })
      }
    </Popover>
  );
}

export function PriorityField({ priority, onChange, showLabel = true }) {
  const meta = PRIORITY_BY_ID[priority];
  const content = (
    <span className="inline-flex items-center gap-1.5 text-sm text-[#172B4D]">
      {priority ? <PriorityIcon priority={priority} /> : null}
      {showLabel && <span className={priority ? '' : 'text-[#626F86]'}>{meta?.label || 'Aucun'}</span>}
    </span>
  );
  if (!onChange) return content;
  return (
    <Popover
      width={200}
      trigger={({ toggle, ref }) => (
        <button ref={ref} type="button" onClick={toggle} className="-mx-1 rounded px-1 py-0.5 hover:bg-[#091E420F]">
          {content}
        </button>
      )}
    >
      {({ close }) => (
        <>
          {PRIORITIES.map((p) => (
            <MenuItem key={p.id} selected={p.id === priority} onClick={() => { close(); onChange(p.id); }}>
              <PriorityIcon priority={p.id} /> {p.label}
            </MenuItem>
          ))}
          <MenuItem selected={!priority} onClick={() => { close(); onChange(null); }}>
            <span className="w-4" /> <span className="text-[#626F86]">Aucun</span>
          </MenuItem>
        </>
      )}
    </Popover>
  );
}

/** Assignee / reporter picker with search, like Jira's user field. */
export function UserField({ user, users = [], onChange, allowEmpty = true, emptyLabel = 'Non assignée', compact = false }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())),
    [users, q]
  );
  const content = (
    <span className="inline-flex min-w-0 items-center gap-2 text-sm text-[#172B4D]">
      <UserAvatar user={user} size={compact ? 22 : 24} />
      <span className={`truncate ${user ? '' : 'text-[#626F86]'}`}>{user?.name || emptyLabel}</span>
    </span>
  );
  if (!onChange) return content;
  return (
    <Popover
      width={280}
      trigger={({ toggle, ref }) => (
        <button ref={ref} type="button" onClick={(e) => { setQ(''); toggle(e); }} className="-mx-1 flex min-w-0 max-w-full rounded px-1 py-0.5 hover:bg-[#091E420F]">
          {content}
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="px-2 pb-1 pt-1">
            <div className="flex items-center gap-2 rounded border-2 border-[#388BFF] px-2 py-1">
              <Search className="h-3.5 w-3.5 text-[#626F86]" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un utilisateur" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {allowEmpty && (
              <MenuItem selected={!user} onClick={() => { close(); onChange(null); }}>
                <UserAvatar user={null} size={22} /> <span className="text-[#626F86]">{emptyLabel}</span>
              </MenuItem>
            )}
            {filtered.map((u) => (
              <MenuItem key={u.id} selected={user?.id === u.id} onClick={() => { close(); if (u.id !== user?.id) onChange(u.id); }}>
                <UserAvatar user={u} size={22} />
                <span className="min-w-0 flex-1 truncate">{u.name}</span>
                {user?.id === u.id && <Check className="h-3.5 w-3.5 text-[#0C66E4]" />}
              </MenuItem>
            ))}
            {filtered.length === 0 && <div className="px-3 py-2 text-sm text-[#626F86]">Aucun résultat</div>}
          </div>
        </div>
      )}
    </Popover>
  );
}

export function LabelChips({ labels = [], max = 3 }) {
  if (!labels.length) return null;
  const shown = labels.slice(0, max);
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {shown.map((l) => (
        <span key={l} className="truncate rounded-[3px] border border-[#DCDFE4] bg-[#F7F8F9] px-1.5 text-xs leading-5 text-[#44546F]">
          {l}
        </span>
      ))}
      {labels.length > max && <span className="text-xs text-[#626F86]">+{labels.length - max}</span>}
    </span>
  );
}
