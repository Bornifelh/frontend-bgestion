import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, useDroppable, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { boardApi, issuesApi, issueSprintsApi } from '../../lib/api';
import ProjectHeader from '../../components/issues/ProjectHeader';
import FilterBar from '../../components/issues/FilterBar';
import IssueDetailModal from '../../components/issues/IssueDetailModal';
import { IssueTypeIcon, PriorityIcon } from '../../components/issues/IssueIcons';
import { UserAvatar, LabelChips } from '../../components/issues/IssueFields';
import { STATUSES, apiError, formatDate, isOverdue } from '../../components/issues/issueMeta';
import { useProjectIssues, useProjectMeta, useIssueRealtime, useCreateIssue, useSprints, useSprintAction, issueKeys } from '../../components/issues/useIssues';
import { CompleteSprintDialog } from '../../components/issues/SprintDialogs';
import { useSelectedIssue } from '../../components/issues/useSelectedIssue';

function SortableCard({ issue, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id, data: { status: issue.status } });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(issue)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(issue)}
      className={isDragging ? 'opacity-40' : ''}
    >
      <CardBody issue={issue} />
    </div>
  );
}

function CardBody({ issue, overlay = false }) {
  const overdue = isOverdue(issue);
  return (
    <div
      className={`cursor-pointer rounded-[3px] bg-white p-3 text-left shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] hover:bg-[#F7F8F9] ${
        overlay ? 'rotate-2 shadow-xl' : ''
      }`}
    >
      <p className="text-sm text-[#172B4D]">{issue.summary}</p>
      {issue.parent && (
        <span className="mt-1.5 inline-block max-w-full truncate rounded-[3px] bg-[#F3F0FF] px-1.5 text-[11px] font-semibold uppercase leading-5 text-[#5E4DB2]">
          {issue.parent.summary}
        </span>
      )}
      {(issue.due_date || issue.labels?.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {issue.due_date && (
            <span className={`inline-flex items-center gap-1 rounded-[3px] border px-1.5 text-xs leading-5 ${overdue ? 'border-[#FD9891] bg-[#FFECEB] text-[#AE2E24]' : 'border-[#DCDFE4] text-[#44546F]'}`}>
              <Calendar className="h-3 w-3" /> {formatDate(issue.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          <LabelChips labels={issue.labels} max={2} />
        </div>
      )}
      <div className="mt-2.5 flex items-center gap-1.5">
        <IssueTypeIcon type={issue.issue_type} />
        <span className={`text-xs font-semibold text-[#44546F] ${issue.status === 'done' ? 'line-through' : ''}`}>{issue.key}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {issue.story_points !== null && issue.story_points !== undefined && (
            <span className="rounded-full bg-[#DCDFE4] px-1.5 text-[11px] font-semibold text-[#44546F]" title="Story points">{issue.story_points}</span>
          )}
          <PriorityIcon priority={issue.priority} />
          <UserAvatar user={issue.assignee} size={24} />
        </span>
      </div>
    </div>
  );
}

function Column({ status, issues, onOpen, onCreate, creating }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status.id}`, data: { status: status.id } });
  const [draft, setDraft] = useState(null);
  return (
    <div className="flex w-[272px] flex-shrink-0 flex-col rounded-md bg-[#F7F8F9]">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#44546F]">{status.label}</h2>
        <span className="text-xs text-[#626F86]">{issues.length}</span>
      </div>
      <div ref={setNodeRef} className={`flex min-h-[80px] flex-1 flex-col gap-1.5 rounded-b-md px-1.5 pb-1.5 transition-colors ${isOver ? 'bg-[#E9F2FF]' : ''}`}>
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((i) => <SortableCard key={i.id} issue={i} onOpen={onOpen} />)}
        </SortableContext>
        {draft !== null ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return setDraft(null);
              onCreate({ summary: draft.trim(), status: status.id }, () => setDraft(''));
            }}
          >
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form.requestSubmit();
                }
                if (e.key === 'Escape') setDraft(null);
              }}
              onBlur={() => !draft.trim() && setDraft(null)}
              rows={2}
              placeholder="Que faut-il faire ?"
              disabled={creating}
              className="w-full resize-none rounded-[3px] border-2 border-[#388BFF] bg-white p-2 text-sm outline-none"
            />
          </form>
        ) : (
          <button type="button" onClick={() => setDraft('')} className="flex items-center gap-1.5 rounded-[3px] px-2 py-1.5 text-sm font-medium text-[#44546F] hover:bg-[#091E420F]">
            <Plus className="h-4 w-4" /> Créer
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const { boardId } = useParams();
  const qc = useQueryClient();
  const [jql, setJql] = useState('');
  const [activeId, setActiveId] = useState(null);

  const { data: board } = useQuery({ queryKey: ['board', boardId], queryFn: async () => (await boardApi.getOne(boardId)).data });
  const { data: meta } = useProjectMeta(boardId);
  const { data, isLoading, error } = useProjectIssues(boardId, jql);
  useIssueRealtime(boardId);
  const create = useCreateIssue(boardId);
  const allIssues = data?.issues;
  const { selectedId, open, close, isOpen } = useSelectedIssue(allIssues);
  const { data: sprints = [] } = useSprints(boardId);
  const activeSprint = sprints.find((s) => s.status === 'active');
  const [completing, setCompleting] = useState(false);
  const completeSprint = useSprintAction(boardId, ({ id, ...body }) => issueSprintsApi.complete(id, body), {
    success: (r) => `${r.sprint.name} terminé${r.moved ? ` — ${r.moved} ticket(s) déplacé(s)` : ''}`,
  });

  // Scrum: with an active sprint the board shows only that sprint (as in Jira);
  // otherwise it behaves as a Kanban board over the whole project.
  const issues = useMemo(
    () => (activeSprint ? (allIssues || []).filter((i) => i.sprint?.id === activeSprint.id) : allIssues),
    [allIssues, activeSprint]
  );
  const daysLeft = activeSprint?.end_date
    ? Math.round((new Date(`${activeSprint.end_date}T00:00:00`) - new Date(new Date().toDateString())) / 86400000)
    : null;

  // Jira boards hide epics; they appear as the purple tag on their children.
  const columns = useMemo(() => {
    const by = Object.fromEntries(STATUSES.map((s) => [s.id, []]));
    (issues || []).filter((i) => i.issue_type !== 'epic').forEach((i) => by[i.status]?.push(i));
    return by;
  }, [issues]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const active = activeId ? issues?.find((i) => i.id === activeId) : null;

  const onDragEnd = async ({ active: a, over }) => {
    setActiveId(null);
    if (!over) return;
    const issue = issues.find((i) => i.id === a.id);
    const targetStatus = over.data.current?.status || (String(over.id).startsWith('col:') ? String(over.id).slice(4) : null);
    if (!issue || !targetStatus) return;

    // Neighbours in the target column after the drop, for the rank.
    const col = columns[targetStatus].filter((i) => i.id !== issue.id);
    let index = col.length;
    if (!String(over.id).startsWith('col:')) {
      const overIdx = col.findIndex((i) => i.id === over.id);
      if (overIdx >= 0) {
        const fromIdx = columns[targetStatus].findIndex((i) => i.id === issue.id);
        index = fromIdx >= 0 && fromIdx <= overIdx ? overIdx + 1 : overIdx;
      }
    }
    const after = col[index - 1];
    const before = col[index];
    const statusChanged = targetStatus !== issue.status;
    if (!statusChanged && columns[targetStatus][index] === issue) return;

    // Optimistic move
    const listKey = issueKeys.list(boardId, jql);
    const snapshot = qc.getQueryData(listKey);
    qc.setQueryData(listKey, (old) => {
      if (!old?.issues) return old;
      const rest = old.issues.filter((i) => i.id !== issue.id);
      const moved = { ...issue, status: targetStatus };
      const pos = before ? rest.findIndex((i) => i.id === before.id) : after ? rest.findIndex((i) => i.id === after.id) + 1 : rest.length;
      rest.splice(pos < 0 ? rest.length : pos, 0, moved);
      return { ...old, issues: rest };
    });
    try {
      if (statusChanged) await issuesApi.update(issue.id, { status: targetStatus });
      if (after || before) await issuesApi.rank(issue.id, { after_id: after?.id, before_id: before?.id });
    } catch (err) {
      qc.setQueryData(listKey, snapshot);
      toast.error(apiError(err, 'Déplacement impossible'));
    } finally {
      qc.invalidateQueries({ queryKey: ['issues', boardId] });
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col bg-white">
      <ProjectHeader boardId={boardId} project={meta?.project} color={board?.color} />
      {activeSprint && (
        <div className="flex flex-wrap items-center gap-3 px-6 pt-3">
          <h2 className="text-lg font-semibold text-[#172B4D]">{activeSprint.name}</h2>
          {daysLeft !== null && (
            <span className={`inline-flex items-center gap-1 text-sm ${daysLeft < 0 ? 'text-[#AE2E24]' : 'text-[#44546F]'}`}>
              <Clock className="h-4 w-4" />
              {daysLeft < 0 ? `En retard de ${-daysLeft} jour(s)` : `${daysLeft} jour(s) restant(s)`}
            </span>
          )}
          {activeSprint.goal && <span className="truncate text-sm text-[#626F86]">· {activeSprint.goal}</span>}
          <button type="button" onClick={() => setCompleting(true)} className="ml-auto rounded-[3px] bg-[#091E420F] px-3 py-1.5 text-sm font-medium text-[#172B4D] hover:bg-[#091E4224]">
            Terminer le sprint
          </button>
        </div>
      )}
      <FilterBar meta={meta} onJqlChange={setJql} jqlError={error?.response?.status === 400 ? apiError(error) : null} />
      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex gap-3">
            {STATUSES.map((s) => <div key={s.id} className="h-64 w-[272px] animate-pulse rounded-md bg-[#F7F8F9]" />)}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={({ active: a }) => setActiveId(a.id)} onDragCancel={() => setActiveId(null)} onDragEnd={onDragEnd}>
            <div className="flex h-full items-start gap-3">
              {STATUSES.map((s) => (
                <Column
                  key={s.id}
                  status={s}
                  issues={columns[s.id]}
                  onOpen={open}
                  creating={create.isPending}
                  onCreate={(payload, done) => create.mutate({ ...payload, issue_type: 'task', ...(activeSprint ? { sprint_id: activeSprint.id } : {}) }, { onSuccess: done })}
                />
              ))}
            </div>
            <DragOverlay>{active ? <CardBody issue={active} overlay /> : null}</DragOverlay>
          </DndContext>
        )}
      </div>
      {completing && activeSprint && (
        <CompleteSprintDialog
          sprint={activeSprint}
          plannedSprints={sprints.filter((s) => s.status === 'planning')}
          pending={completeSprint.isPending}
          onClose={() => setCompleting(false)}
          onSubmit={(body) => completeSprint.mutate({ id: activeSprint.id, ...body }, { onSuccess: () => setCompleting(false) })}
        />
      )}
      {isOpen && selectedId && <IssueDetailModal issueId={selectedId} boardId={boardId} meta={meta} onClose={close} onOpenIssue={open} />}
    </div>
  );
}
