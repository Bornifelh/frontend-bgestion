import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, useDroppable, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { boardApi, issuesApi, issueSprintsApi } from '../../lib/api';
import ProjectHeader from '../../components/issues/ProjectHeader';
import FilterBar from '../../components/issues/FilterBar';
import IssueDetailModal from '../../components/issues/IssueDetailModal';
import Popover, { MenuItem } from '../../components/issues/Popover';
import { IssueTypeIcon, PriorityIcon } from '../../components/issues/IssueIcons';
import { StatusLozenge, UserAvatar } from '../../components/issues/IssueFields';
import { SprintFormDialog, CompleteSprintDialog, Dialog, SubtleButton } from '../../components/issues/SprintDialogs';
import { ISSUE_TYPES, CREATABLE_TYPES, apiError, formatDate } from '../../components/issues/issueMeta';
import {
  useProjectIssues, useProjectMeta, useIssueRealtime, useUpdateIssue, useCreateIssue,
  useSprints, useSprintAction, issueKeys,
} from '../../components/issues/useIssues';
import { useSelectedIssue } from '../../components/issues/useSelectedIssue';

const BACKLOG = 'backlog';
const RANKED_RE = /ORDER BY\s+(rank|cf\[10019\])(\s+ASC)?\s*$/i;

/** Which container an issue belongs to on the backlog (null = hidden). */
function containerOf(issue) {
  if (issue.issue_type === 'epic' || issue.issue_type === 'subtask') return null;
  const s = issue.sprint;
  if (s && s.status !== 'completed') return s.id;
  if (s && s.status === 'completed' && issue.status === 'done') return null; // delivered in a closed sprint
  return BACKLOG;
}

/* ---------------- rows ---------------- */

function RowBody({ issue, onOpen, onStatus, overlay }) {
  const epic = issue.parent?.issue_type === 'epic' ? issue.parent : null;
  return (
    <div className={`flex h-10 items-center gap-2 border-b border-[#F1F2F4] bg-white px-3 text-sm ${overlay ? 'rounded-[3px] shadow-xl' : 'hover:bg-[#F7F8F9]'}`}>
      <IssueTypeIcon type={issue.issue_type} />
      <button type="button" onClick={() => onOpen?.(issue)} className={`whitespace-nowrap font-medium text-[#44546F] hover:text-[#0C66E4] hover:underline ${issue.status === 'done' ? 'line-through' : ''}`}>
        {issue.key}
      </button>
      <button type="button" onClick={() => onOpen?.(issue)} className="min-w-0 flex-1 truncate text-left text-[#172B4D]" title={issue.summary}>
        {issue.summary}
      </button>
      {epic && (
        <span className="hidden max-w-[180px] truncate rounded-[3px] bg-[#F3F0FF] px-1.5 text-[11px] font-semibold uppercase leading-5 text-[#5E4DB2] md:inline" title={`Epic ${epic.key}`}>
          {epic.summary}
        </span>
      )}
      <div className="w-[150px] flex-shrink-0">
        <StatusLozenge status={issue.status} onChange={onStatus} />
      </div>
      <span className="w-7 flex-shrink-0 text-center">
        {issue.story_points !== null && issue.story_points !== undefined ? (
          <span className="rounded-full bg-[#DCDFE4] px-1.5 text-[11px] font-semibold text-[#44546F]" title="Story points">{issue.story_points}</span>
        ) : (
          <span className="text-xs text-[#8590A2]">–</span>
        )}
      </span>
      <span className="flex w-4 flex-shrink-0 justify-center"><PriorityIcon priority={issue.priority} /></span>
      <UserAvatar user={issue.assignee} size={24} />
    </div>
  );
}

function SortableRow({ issue, container, onOpen, onStatus, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id, data: { container }, disabled });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={isDragging ? 'opacity-40' : ''} {...attributes} {...listeners}>
      <RowBody issue={issue} onOpen={onOpen} onStatus={onStatus} />
    </div>
  );
}

function InlineCreate({ onCreate, pending }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('task');
  const [summary, setSummary] = useState('');
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#44546F] hover:bg-[#091E420F]">
        <Plus className="h-4 w-4" /> Créer un ticket
      </button>
    );
  }
  return (
    <form
      className="flex items-center gap-2 border-2 border-[#388BFF] bg-white px-2 py-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (summary.trim()) onCreate({ summary: summary.trim(), issue_type: type }, () => setSummary(''));
      }}
    >
      <Popover
        width={180}
        trigger={({ toggle, ref }) => (
          <button ref={ref} type="button" onClick={toggle} className="flex items-center gap-1 rounded px-1 py-1 hover:bg-[#091E420F]" title="Type de ticket">
            <IssueTypeIcon type={type} /> <ChevronDown className="h-3.5 w-3.5 text-[#44546F]" />
          </button>
        )}
      >
        {({ close }) =>
          CREATABLE_TYPES.filter((t) => t !== 'epic').map((t) => (
            <MenuItem key={t} selected={t === type} onClick={() => { setType(t); close(); }}>
              <IssueTypeIcon type={t} /> {ISSUE_TYPES[t].label}
            </MenuItem>
          ))
        }
      </Popover>
      <input autoFocus value={summary} onChange={(e) => setSummary(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} placeholder="Que faut-il faire ?" maxLength={500} className="h-8 flex-1 text-sm outline-none" />
      <button type="submit" disabled={pending || !summary.trim()} className="rounded-[3px] bg-[#0C66E4] px-3 py-1 text-sm font-medium text-white disabled:opacity-50">Créer</button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-[3px] px-2 py-1 text-sm text-[#44546F] hover:bg-[#091E420F]">Annuler</button>
    </form>
  );
}

/* ---------------- containers ---------------- */

function CountPill({ value, title, bg, fg }) {
  return (
    <span title={title} className="min-w-[24px] rounded-full px-1.5 text-center text-xs font-semibold leading-5" style={{ backgroundColor: bg, color: fg }}>
      {value}
    </span>
  );
}

function Container({ id, title, subtitle, goal, issues, actions, collapsed, onToggle, onOpen, onStatus, onCreate, creating, dragDisabled, empty }) {
  const { setNodeRef, isOver } = useDroppable({ id: `container:${id}`, data: { container: id } });
  const pts = (pred) => issues.filter(pred).reduce((s, i) => s + (Number(i.story_points) || 0), 0);
  const hasPoints = issues.some((i) => i.story_points !== null && i.story_points !== undefined);
  const fmt = (pred) => (hasPoints ? pts(pred) : issues.filter(pred).length);
  return (
    <section className="rounded-md bg-[#F7F8F9] p-2">
      <div className="flex flex-wrap items-center gap-2 px-1 pb-2">
        <button type="button" onClick={onToggle} className="flex min-w-0 items-center gap-1.5 rounded px-1 py-1 text-left hover:bg-[#091E420F]">
          {collapsed ? <ChevronRight className="h-4 w-4 text-[#44546F]" /> : <ChevronDown className="h-4 w-4 text-[#44546F]" />}
          <span className="truncate font-semibold text-[#172B4D]">{title}</span>
          {subtitle && <span className="whitespace-nowrap text-sm text-[#626F86]">{subtitle}</span>}
          <span className="whitespace-nowrap text-sm text-[#626F86]">({issues.length} ticket{issues.length > 1 ? 's' : ''})</span>
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <CountPill value={fmt((i) => i.status === 'todo')} title={hasPoints ? 'Story points À faire' : 'À faire'} bg="#DCDFE4" fg="#44546F" />
          <CountPill value={fmt((i) => i.status === 'in_progress' || i.status === 'in_review')} title={hasPoints ? 'Story points en cours' : 'En cours'} bg="#CCE0FF" fg="#0055CC" />
          <CountPill value={fmt((i) => i.status === 'done')} title={hasPoints ? 'Story points terminés' : 'Terminé'} bg="#BAF3DB" fg="#216E4E" />
          {actions}
        </div>
      </div>
      {goal && !collapsed && <p className="px-3 pb-2 text-sm text-[#44546F]">{goal}</p>}
      {!collapsed && (
        <div ref={setNodeRef} className={`overflow-hidden rounded-[3px] border transition-colors ${isOver ? 'border-[#388BFF] bg-[#E9F2FF]' : 'border-[#DCDFE4] bg-white'}`}>
          <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {issues.map((i) => (
              <SortableRow key={i.id} issue={i} container={id} onOpen={onOpen} onStatus={(s) => onStatus(i, s)} disabled={dragDisabled} />
            ))}
          </SortableContext>
          {issues.length === 0 && (
            <div className="flex items-center justify-center gap-2 border-b border-dashed border-[#DCDFE4] px-3 py-6 text-sm text-[#626F86]">
              <Inbox className="h-4 w-4" /> {empty}
            </div>
          )}
          <InlineCreate pending={creating} onCreate={onCreate} />
        </div>
      )}
    </section>
  );
}

/* ---------------- page ---------------- */

export default function ProjectBacklog() {
  const { boardId } = useParams();
  const qc = useQueryClient();
  const [jql, setJql] = useState('');
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [dialog, setDialog] = useState(null); // { kind: 'start'|'edit'|'complete'|'delete', sprint }
  const [activeId, setActiveId] = useState(null);

  const { data: board } = useQuery({ queryKey: ['board', boardId], queryFn: async () => (await boardApi.getOne(boardId)).data });
  const { data: meta } = useProjectMeta(boardId);
  const { data, isLoading, error, isFetching } = useProjectIssues(boardId, jql);
  const { data: sprints = [] } = useSprints(boardId);
  useIssueRealtime(boardId);
  const update = useUpdateIssue(boardId);
  const create = useCreateIssue(boardId);

  const createSprint = useSprintAction(boardId, () => issueSprintsApi.create({ board_id: boardId }), { success: (s) => `${s.name} créé` });
  const startSprint = useSprintAction(boardId, ({ id, ...body }) => issueSprintsApi.start(id, body), { success: (s) => `${s.name} démarré` });
  const editSprint = useSprintAction(boardId, ({ id, ...body }) => issueSprintsApi.update(id, body), { success: 'Sprint mis à jour' });
  const completeSprint = useSprintAction(boardId, ({ id, ...body }) => issueSprintsApi.complete(id, body), {
    success: (r) => `${r.sprint.name} terminé${r.moved ? ` — ${r.moved} ticket(s) déplacé(s)` : ''}`,
  });
  const deleteSprint = useSprintAction(boardId, (id) => issueSprintsApi.delete(id), { success: 'Sprint supprimé' });

  const issues = data?.issues;
  const { selectedId, open, close, isOpen } = useSelectedIssue(issues);

  const groups = useMemo(() => {
    const g = { [BACKLOG]: [] };
    sprints.forEach((s) => { g[s.id] = []; });
    (issues || []).forEach((i) => {
      const c = containerOf(i);
      if (c && g[c]) g[c].push(i);
      else if (c) g[BACKLOG].push(i); // sprint not loaded yet
    });
    return g;
  }, [issues, sprints]);

  const activeSprint = sprints.find((s) => s.status === 'active');
  const plannedSprints = sprints.filter((s) => s.status === 'planning');
  const canRank = RANKED_RE.test(jql.trim());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const dragged = activeId ? issues?.find((i) => i.id === activeId) : null;

  const toggle = (id) => setCollapsed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const setStatus = (issue, status) => update.mutate({ id: issue.id, patch: { status } });

  const onDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const issue = issues.find((i) => i.id === active.id);
    const from = containerOf(issue);
    const to = over.data.current?.container;
    if (!issue || !to) return;

    const list = groups[to].filter((i) => i.id !== issue.id);
    let index = list.length;
    if (!String(over.id).startsWith('container:')) {
      const overIdx = list.findIndex((i) => i.id === over.id);
      if (overIdx >= 0) {
        const oldIdx = groups[to].findIndex((i) => i.id === issue.id);
        index = from === to && oldIdx >= 0 && oldIdx <= overIdx ? overIdx + 1 : overIdx;
      }
    }
    if (from === to && groups[to][index] === issue) return;
    const after = list[index - 1];
    const before = list[index];
    const targetSprint = to === BACKLOG ? null : sprints.find((s) => s.id === to);

    // optimistic: move in cache
    const listKey = issueKeys.list(boardId, jql);
    const snapshot = qc.getQueryData(listKey);
    qc.setQueryData(listKey, (old) => {
      if (!old?.issues) return old;
      const rest = old.issues.filter((i) => i.id !== issue.id);
      const moved = { ...issue, sprint: targetSprint ? { id: targetSprint.id, name: targetSprint.name, status: targetSprint.status } : null };
      let pos = before ? rest.findIndex((i) => i.id === before.id) : after ? rest.findIndex((i) => i.id === after.id) + 1 : rest.length;
      if (pos < 0) pos = rest.length;
      rest.splice(pos, 0, moved);
      return { ...old, issues: rest };
    });
    try {
      if (from !== to) await issuesApi.update(issue.id, { sprint_id: targetSprint ? targetSprint.id : null });
      if (canRank && (after || before)) await issuesApi.rank(issue.id, { after_id: after?.id, before_id: before?.id });
      if (from !== to) toast.success(`${issue.key} déplacé vers ${targetSprint ? targetSprint.name : 'le backlog'}`);
    } catch (err) {
      qc.setQueryData(listKey, snapshot);
      toast.error(apiError(err, 'Déplacement impossible'));
    } finally {
      qc.invalidateQueries({ queryKey: ['issues', boardId] });
    }
  };

  const sprintActions = (s) => (
    <>
      {s.status === 'active' ? (
        <button type="button" onClick={() => setDialog({ kind: 'complete', sprint: s })} className="ml-1 rounded-[3px] bg-[#091E420F] px-2.5 py-1 text-sm font-medium text-[#172B4D] hover:bg-[#091E4224]">
          Terminer le sprint
        </button>
      ) : (
        <button
          type="button"
          disabled={!!activeSprint || s.issue_count === 0 || plannedSprints[0]?.id !== s.id}
          title={activeSprint ? 'Un sprint est déjà actif' : s.issue_count === 0 ? 'Ajoutez des tickets pour démarrer ce sprint' : plannedSprints[0]?.id !== s.id ? 'Démarrez d’abord le sprint précédent' : undefined}
          onClick={() => setDialog({ kind: 'start', sprint: s })}
          className="ml-1 rounded-[3px] bg-[#091E420F] px-2.5 py-1 text-sm font-medium text-[#172B4D] hover:bg-[#091E4224] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Démarrer le sprint
        </button>
      )}
      <Popover
        width={200}
        align="right"
        trigger={({ toggle: t, ref }) => (
          <button ref={ref} type="button" onClick={t} className="rounded p-1 text-[#44546F] hover:bg-[#091E420F]" aria-label={`Actions pour ${s.name}`}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      >
        {({ close: c }) => (
          <>
            <MenuItem onClick={() => { c(); setDialog({ kind: 'edit', sprint: s }); }}>Modifier le sprint</MenuItem>
            {s.status === 'planning' && (
              <MenuItem onClick={() => { c(); setDialog({ kind: 'delete', sprint: s }); }}>
                <span className="text-[#AE2E24]">Supprimer le sprint</span>
              </MenuItem>
            )}
          </>
        )}
      </Popover>
    </>
  );

  const createIn = (sprintId) => (payload, done) =>
    create.mutate({ ...payload, ...(sprintId ? { sprint_id: sprintId } : {}) }, { onSuccess: done });

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col bg-white">
      <ProjectHeader boardId={boardId} project={meta?.project} color={board?.color} />
      <FilterBar meta={meta} onJqlChange={setJql} jqlError={error?.response?.status === 400 ? apiError(error) : null} />

      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-6 pb-8">
        {isLoading ? (
          [0, 1].map((k) => <div key={k} className="h-40 animate-pulse rounded-md bg-[#F7F8F9]" />)
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={({ active }) => setActiveId(active.id)} onDragCancel={() => setActiveId(null)} onDragEnd={onDragEnd}>
            {sprints.map((s) => (
              <Container
                key={s.id}
                id={s.id}
                title={s.name}
                subtitle={s.start_date && s.end_date ? `${formatDate(s.start_date, { day: 'numeric', month: 'short' })} – ${formatDate(s.end_date, { day: 'numeric', month: 'short' })}` : null}
                goal={s.goal}
                issues={groups[s.id] || []}
                actions={sprintActions(s)}
                collapsed={collapsed.has(s.id)}
                onToggle={() => toggle(s.id)}
                onOpen={open}
                onStatus={setStatus}
                onCreate={createIn(s.id)}
                creating={create.isPending}
                dragDisabled={isFetching}
                empty="Planifiez un sprint en y glissant des tickets depuis le backlog."
              />
            ))}
            <Container
              id={BACKLOG}
              title="Backlog"
              issues={groups[BACKLOG]}
              actions={
                <button type="button" onClick={() => createSprint.mutate()} disabled={createSprint.isPending} className="ml-1 rounded-[3px] bg-[#091E420F] px-2.5 py-1 text-sm font-medium text-[#172B4D] hover:bg-[#091E4224] disabled:opacity-50">
                  Créer un sprint
                </button>
              }
              collapsed={collapsed.has(BACKLOG)}
              onToggle={() => toggle(BACKLOG)}
              onOpen={open}
              onStatus={setStatus}
              onCreate={createIn(null)}
              creating={create.isPending}
              dragDisabled={isFetching}
              empty="Votre backlog est vide."
            />
            <DragOverlay>{dragged ? <RowBody issue={dragged} overlay /> : null}</DragOverlay>
          </DndContext>
        )}
        {!canRank && <p className="text-xs text-[#626F86]">Tri personnalisé actif : glisser un ticket le change de sprint, sans modifier son rang.</p>}
      </div>

      {dialog?.kind === 'start' && (
        <SprintFormDialog
          mode="start"
          sprint={dialog.sprint}
          pending={startSprint.isPending}
          onClose={() => setDialog(null)}
          onSubmit={(body) => startSprint.mutate({ id: dialog.sprint.id, ...body }, { onSuccess: () => setDialog(null) })}
        />
      )}
      {dialog?.kind === 'edit' && (
        <SprintFormDialog
          mode="edit"
          sprint={dialog.sprint}
          pending={editSprint.isPending}
          onClose={() => setDialog(null)}
          onSubmit={(body) => editSprint.mutate({ id: dialog.sprint.id, ...body }, { onSuccess: () => setDialog(null) })}
        />
      )}
      {dialog?.kind === 'complete' && (
        <CompleteSprintDialog
          sprint={dialog.sprint}
          plannedSprints={plannedSprints}
          pending={completeSprint.isPending}
          onClose={() => setDialog(null)}
          onSubmit={(body) => completeSprint.mutate({ id: dialog.sprint.id, ...body }, { onSuccess: () => setDialog(null) })}
        />
      )}
      {dialog?.kind === 'delete' && (
        <Dialog
          title={`Supprimer ${dialog.sprint.name} ?`}
          onClose={() => setDialog(null)}
          footer={
            <>
              <SubtleButton onClick={() => setDialog(null)}>Annuler</SubtleButton>
              <button type="button" disabled={deleteSprint.isPending} onClick={() => deleteSprint.mutate(dialog.sprint.id, { onSuccess: () => setDialog(null) })} className="rounded-[3px] bg-[#C9372C] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#AE2E24] disabled:opacity-50">
                Supprimer
              </button>
            </>
          }
        >
          <p className="text-sm text-[#44546F]">
            Les {dialog.sprint.issue_count} ticket(s) de ce sprint retourneront dans le backlog. Les tickets ne sont pas supprimés.
          </p>
        </Dialog>
      )}
      {isOpen && selectedId && <IssueDetailModal issueId={selectedId} boardId={boardId} meta={meta} onClose={close} onOpenIssue={open} />}
    </div>
  );
}
