import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Plus, RotateCw, Inbox } from 'lucide-react';
import { boardApi } from '../../lib/api';
import ProjectHeader from '../../components/issues/ProjectHeader';
import FilterBar from '../../components/issues/FilterBar';
import IssueDetailModal from '../../components/issues/IssueDetailModal';
import Popover, { MenuItem } from '../../components/issues/Popover';
import { IssueTypeIcon } from '../../components/issues/IssueIcons';
import { StatusLozenge, PriorityField, UserField, LabelChips } from '../../components/issues/IssueFields';
import { ISSUE_TYPES, CREATABLE_TYPES, apiError, formatDate, isOverdue, nestIssues } from '../../components/issues/issueMeta';
import { useProjectIssues, useProjectMeta, useIssueRealtime, useUpdateIssue, useCreateIssue, useRankIssue } from '../../components/issues/useIssues';
import { useSelectedIssue } from '../../components/issues/useSelectedIssue';

const COLS = 'grid-cols-[28px_minmax(300px,1fr)_170px_170px_110px_175px_110px_130px]';
const RANKED_RE = /ORDER BY\s+(rank|cf\[10019\])(\s+ASC)?\s*$/i;

function HeaderCell({ children }) {
  return <div className="truncate px-2 py-2 text-xs font-semibold text-[#44546F]">{children}</div>;
}

function IssueRow({ row, users, onOpen, onToggle, collapsed, update, draggable }) {
  const { issue, depth, childCount } = row;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id, disabled: !draggable });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const findUser = (id) => users.find((u) => u.id === id) || null;
  const set = (patch, optimistic) => update.mutate({ id: issue.id, patch, optimistic });
  const overdue = isOverdue(issue);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group grid ${COLS} items-center border-b border-[#F1F2F4] bg-white text-sm hover:bg-[#F7F8F9] ${isDragging ? 'relative z-10 shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-center">
        {draggable && (
          <button type="button" {...attributes} {...listeners} className="cursor-grab rounded p-0.5 text-[#8590A2] opacity-0 hover:bg-[#091E420F] group-hover:opacity-100" aria-label={`Déplacer ${issue.key}`}>
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2 py-1.5 pr-2" style={{ paddingLeft: depth ? 28 : 0 }}>
        {childCount > 0 ? (
          <button type="button" onClick={() => onToggle(issue.id)} className="rounded p-0.5 text-[#44546F] hover:bg-[#091E420F]" aria-label={collapsed ? 'Déplier' : 'Replier'}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <IssueTypeIcon type={issue.issue_type} />
        <button type="button" onClick={() => onOpen(issue)} className={`whitespace-nowrap font-medium text-[#0C66E4] hover:underline ${issue.status === 'done' ? 'line-through' : ''}`}>
          {issue.key}
        </button>
        <button type="button" onClick={() => onOpen(issue)} className="min-w-0 truncate text-left text-[#172B4D] hover:underline" title={issue.summary}>
          {issue.summary}
        </button>
        {childCount > 0 && <span className="flex-shrink-0 rounded-full bg-[#F1F2F4] px-1.5 text-[11px] text-[#44546F]">{childCount}</span>}
      </div>
      <div className="min-w-0 px-2"><UserField compact user={issue.assignee} users={users} onChange={(id) => set({ assignee_id: id }, { assignee: findUser(id) })} /></div>
      <div className="min-w-0 px-2"><UserField compact user={issue.reporter} users={users} allowEmpty={false} emptyLabel="Aucun" onChange={(id) => set({ reporter_id: id }, { reporter: findUser(id) })} /></div>
      <div className="px-2"><PriorityField priority={issue.priority} onChange={(p) => set({ priority: p })} /></div>
      <div className="min-w-0 px-2"><StatusLozenge status={issue.status} onChange={(s) => set({ status: s })} /></div>
      <div className={`px-2 text-sm ${overdue ? 'font-medium text-[#AE2E24]' : 'text-[#172B4D]'}`} title={overdue ? 'En retard' : undefined}>
        {formatDate(issue.due_date) || <span className="text-[#8590A2]">—</span>}
      </div>
      <div className="min-w-0 overflow-hidden px-2"><LabelChips labels={issue.labels} max={2} /></div>
    </div>
  );
}

function CreateRow({ onCreate, pending }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('task');
  const [summary, setSummary] = useState('');
  const inputRef = useRef(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#44546F] hover:bg-[#F7F8F9]">
        <Plus className="h-4 w-4" /> Créer
      </button>
    );
  }
  const submit = (e) => {
    e.preventDefault();
    if (!summary.trim()) return;
    onCreate({ summary: summary.trim(), issue_type: type }, () => {
      setSummary('');
      inputRef.current?.focus();
    });
  };
  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-2 border-[#388BFF] bg-white px-2 py-1">
      <Popover
        width={180}
        trigger={({ toggle, ref }) => (
          <button ref={ref} type="button" onClick={toggle} className="flex items-center gap-1 rounded px-1 py-1 hover:bg-[#091E420F]" title="Type de ticket">
            <IssueTypeIcon type={type} /> <ChevronDown className="h-3.5 w-3.5 text-[#44546F]" />
          </button>
        )}
      >
        {({ close }) =>
          CREATABLE_TYPES.map((t) => (
            <MenuItem key={t} selected={t === type} onClick={() => { setType(t); close(); inputRef.current?.focus(); }}>
              <IssueTypeIcon type={t} /> {ISSUE_TYPES[t].label}
            </MenuItem>
          ))
        }
      </Popover>
      <input
        ref={inputRef}
        autoFocus
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Que faut-il faire ?"
        className="h-8 flex-1 text-sm outline-none"
        maxLength={500}
      />
      <button type="submit" disabled={pending || !summary.trim()} className="rounded-[3px] bg-[#0C66E4] px-3 py-1 text-sm font-medium text-white hover:bg-[#0055CC] disabled:opacity-50">
        Créer
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-[3px] px-2 py-1 text-sm text-[#44546F] hover:bg-[#091E420F]">Annuler</button>
    </form>
  );
}

export default function ProjectIssues() {
  const { boardId } = useParams();
  const [jql, setJql] = useState('');
  const [collapsed, setCollapsed] = useState(() => new Set());

  const { data: board } = useQuery({ queryKey: ['board', boardId], queryFn: async () => (await boardApi.getOne(boardId)).data });
  const { data: meta } = useProjectMeta(boardId);
  const { data, isLoading, isFetching, error, refetch } = useProjectIssues(boardId, jql);
  useIssueRealtime(boardId);
  const update = useUpdateIssue(boardId);
  const create = useCreateIssue(boardId);
  const rank = useRankIssue(boardId);

  const issues = data?.issues;
  const { selectedId, open, close, isOpen } = useSelectedIssue(issues);
  const users = meta?.assignees || [];

  const rows = useMemo(() => {
    const all = nestIssues(issues || []);
    return all.filter((r) => !(r.depth && collapsed.has(r.parentId)));
  }, [issues, collapsed]);

  const canRank = RANKED_RE.test(jql.trim()) && !isFetching;
  const topLevel = rows.filter((r) => r.depth === 0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = topLevel.map((r) => r.issue.id);
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    if (from < 0 || to < 0) return;
    const moved = arrayMove(ids, from, to);
    const idx = moved.indexOf(active.id);
    rank.mutate({ id: active.id, after_id: moved[idx - 1], before_id: moved[idx + 1] });
  };

  const toggle = (id) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const jqlError = error?.response?.status === 400 ? apiError(error) : null;

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col bg-white">
      <ProjectHeader boardId={boardId} project={meta?.project} color={board?.color} />
      <FilterBar meta={meta} onJqlChange={setJql} jqlError={jqlError} />

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        <div className="min-w-[1000px] rounded-[3px] border border-[#DCDFE4]">
          <div className={`sticky top-0 z-[5] grid ${COLS} border-b border-[#DCDFE4] bg-[#F7F8F9]`}>
            <div />
            <HeaderCell>Ticket</HeaderCell>
            <HeaderCell>Personne assignée</HeaderCell>
            <HeaderCell>Rapporteur</HeaderCell>
            <HeaderCell>Priorité</HeaderCell>
            <HeaderCell>État</HeaderCell>
            <HeaderCell>Échéance</HeaderCell>
            <HeaderCell>Étiquettes</HeaderCell>
          </div>

          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`grid ${COLS} items-center border-b border-[#F1F2F4] py-2.5`}>
                <div />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[#F1F2F4]" />
                {Array.from({ length: 6 }).map((__, j) => <div key={j} className="mx-2 h-3 animate-pulse rounded bg-[#F1F2F4]" />)}
              </div>
            ))
          ) : error && !jqlError ? (
            <div className="p-8 text-center text-sm text-[#AE2E24]">{apiError(error, 'Impossible de charger les tickets')}</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <Inbox className="h-10 w-10 text-[#8590A2]" />
              <p className="font-medium text-[#172B4D]">Aucun ticket ne correspond à votre recherche</p>
              <p className="text-sm text-[#626F86]">Modifiez les filtres ou créez un nouveau ticket.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={topLevel.map((r) => r.issue.id)} strategy={verticalListSortingStrategy}>
                {rows.map((r) => (
                  <IssueRow
                    key={r.issue.id}
                    row={r}
                    users={users}
                    onOpen={open}
                    onToggle={toggle}
                    collapsed={collapsed.has(r.issue.id)}
                    update={update}
                    draggable={canRank && r.depth === 0}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          <CreateRow
            pending={create.isPending}
            onCreate={(payload, done) => create.mutate(payload, { onSuccess: done })}
          />
          <div className="flex items-center justify-center gap-2 border-t border-[#DCDFE4] py-2 text-sm text-[#44546F]">
            {data ? `${issues.length} sur ${data.total}` : '—'}
            <button type="button" onClick={() => refetch()} title="Actualiser" className="rounded p-1 hover:bg-[#091E420F]">
              <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {!canRank && rows.length > 0 && (
          <p className="mt-2 text-xs text-[#626F86]">Le glisser-déposer est disponible quand les tickets sont triés par rang (ORDER BY rank).</p>
        )}
      </div>

      {isOpen && selectedId && (
        <IssueDetailModal issueId={selectedId} boardId={boardId} meta={meta} onClose={close} onOpenIssue={open} />
      )}
    </div>
  );
}
