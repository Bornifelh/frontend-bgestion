import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Link2, Trash2, Plus, ChevronDown, ChevronRight, Calendar, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { issuesApi, commentApi, activityApi } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { IssueTypeIcon } from './IssueIcons';
import { StatusLozenge, PriorityField, UserField, UserAvatar, LabelChips } from './IssueFields';
import Popover, { MenuItem } from './Popover';
import { ISSUE_TYPES, STATUS_BY_ID, PRIORITY_BY_ID, apiError, formatDate } from './issueMeta';
import { issueKeys, useUpdateIssue, useCreateIssue, useDeleteIssue } from './useIssues';

/* ---------- small inline editors ---------- */

function InlineText({ value, onSave, className = '', placeholder, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef(null);
  useEffect(() => setDraft(value || ''), [value]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v !== (value || '').trim()) onSave(v);
  };
  const cancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setEditing(true)}
        onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
        className={`-mx-2 cursor-text rounded px-2 py-1 hover:bg-[#091E420F] ${className}`}
      >
        {value ? (
          multiline ? <div className="whitespace-pre-wrap">{value}</div> : value
        ) : (
          <span className="text-[#626F86]">{placeholder}</span>
        )}
      </div>
    );
  }
  if (multiline) {
    return (
      <div>
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && cancel()}
          rows={6}
          className="w-full rounded-[3px] border-2 border-[#388BFF] p-2 text-sm text-[#172B4D] outline-none"
        />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={commit} className="rounded-[3px] bg-[#0C66E4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0055CC]">Enregistrer</button>
          <button type="button" onClick={cancel} className="rounded-[3px] px-3 py-1.5 text-sm font-medium text-[#44546F] hover:bg-[#091E420F]">Annuler</button>
        </div>
      </div>
    );
  }
  return (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel();
      }}
      className={`-mx-2 w-[calc(100%+1rem)] rounded-[3px] border-2 border-[#388BFF] px-2 py-0.5 outline-none ${className}`}
    />
  );
}

function DateField({ value, onChange }) {
  const v = value ? value.slice(0, 10) : '';
  return (
    <label className="-mx-1 inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-sm hover:bg-[#091E420F]">
      {v ? <span className="text-[#172B4D]">{formatDate(v)}</span> : <span className="text-[#626F86]">Aucun</span>}
      <Calendar className="h-3.5 w-3.5 text-[#626F86]" />
      <input
        type="date"
        value={v}
        onChange={(e) => onChange(e.target.value || null)}
        className="sr-only"
        onClick={(e) => e.currentTarget.showPicker?.()}
      />
    </label>
  );
}

function LabelsField({ labels, suggestions = [], onChange }) {
  const [draft, setDraft] = useState('');
  const add = (l) => {
    const v = l.trim().replace(/\s+/g, '_');
    if (v && !labels.includes(v)) onChange([...labels, v]);
    setDraft('');
  };
  return (
    <Popover
      width={260}
      trigger={({ toggle, ref }) => (
        <button ref={ref} type="button" onClick={toggle} className="-mx-1 flex min-h-[24px] flex-wrap items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-[#091E420F]">
          {labels.length ? <LabelChips labels={labels} max={6} /> : <span className="text-sm text-[#626F86]">Aucune</span>}
        </button>
      )}
    >
      <div className="p-2">
        <div className="mb-2 flex flex-wrap gap-1">
          {labels.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 rounded-[3px] bg-[#F1F2F4] px-1.5 text-xs leading-5 text-[#44546F]">
              {l}
              <button type="button" onClick={() => onChange(labels.filter((x) => x !== l))} aria-label={`Retirer ${l}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add(draft)}
          placeholder="Ajouter une étiquette…"
          className="w-full rounded-[3px] border-2 border-[#DCDFE4] px-2 py-1 text-sm outline-none focus:border-[#388BFF]"
        />
        <div className="mt-1 max-h-40 overflow-y-auto">
          {suggestions
            .filter((s) => !labels.includes(s) && s.toLowerCase().includes(draft.toLowerCase()))
            .slice(0, 8)
            .map((s) => (
              <MenuItem key={s} onClick={() => add(s)}>{s}</MenuItem>
            ))}
        </div>
      </div>
    </Popover>
  );
}

/* ---------- activity ---------- */

const FIELD_LABEL = {
  summary: 'le résumé', description: 'la description', status: "l'état", priority: 'la priorité',
  assignee_id: 'la personne assignée', reporter_id: 'le rapporteur', parent_id: 'le parent',
  labels: 'les étiquettes', due_date: "la date d'échéance", start_date: 'la date de début',
  story_points: 'les story points', issue_type: 'le type', team: "l'équipe", sprint_id: 'le sprint',
};
const fmtValue = (field, v) => {
  if (v === null || v === undefined || v === '') return 'Aucun';
  if (field === 'status') return STATUS_BY_ID[v]?.label || v;
  if (field === 'priority') return PRIORITY_BY_ID[v]?.label || v;
  if (field === 'issue_type') return ISSUE_TYPES[v]?.label || v;
  if (Array.isArray(v)) return v.join(', ') || 'Aucune';
  if (field.endsWith('_date')) return formatDate(String(v));
  if (field.endsWith('_id')) return null; // ids are not meaningful to users
  return String(v);
};

function HistoryEntry({ a }) {
  const time = new Date(a.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  const user = { id: a.userId, name: a.userName || 'Quelqu’un', avatar: a.avatarUrl };
  let lines;
  if (a.action === 'issue_created' || a.action === 'created') lines = [<span key="c">a créé le ticket</span>];
  else if (a.action === 'comment_added') lines = [<span key="c">a ajouté un commentaire</span>];
  else if (a.action === 'issue_updated' && a.newValue) {
    lines = Object.keys(a.newValue).map((f) => {
      const from = fmtValue(f, a.oldValue?.[f]);
      const to = fmtValue(f, a.newValue[f]);
      return (
        <span key={f} className="block">
          a modifié <strong className="font-semibold">{FIELD_LABEL[f] || f}</strong>
          {to !== null && (
            <span className="ml-1 text-[#44546F]">
              {from !== null && <><span className="line-through decoration-[#8590A2]">{from}</span> → </>}
              {to}
            </span>
          )}
        </span>
      );
    });
  } else lines = [<span key="o">a mis à jour le ticket</span>];
  return (
    <div className="flex gap-3 py-2">
      <UserAvatar user={user} size={28} />
      <div className="min-w-0 text-sm text-[#172B4D]">
        <span className="font-semibold">{user.name}</span> {lines[0]}
        {lines.slice(1)}
        <div className="text-xs text-[#626F86]">{time}</div>
      </div>
    </div>
  );
}

function ActivitySection({ issueId }) {
  const [tab, setTab] = useState('comments');
  const [draft, setDraft] = useState('');
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const comments = useQuery({
    queryKey: ['issue-comments', issueId],
    queryFn: async () => (await commentApi.getByItem(issueId)).data,
  });
  const history = useQuery({
    queryKey: ['issue-activity', issueId],
    queryFn: async () => (await activityApi.getByItem(issueId)).data,
    enabled: tab !== 'comments',
  });
  const add = useMutation({
    mutationFn: (content) => commentApi.create({ itemId: issueId, content }),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['issue-comments', issueId] });
      qc.invalidateQueries({ queryKey: ['issue-activity', issueId] });
    },
    onError: (e) => toast.error(apiError(e, 'Commentaire non envoyé')),
  });

  const commentList = (comments.data || []).map((c) => ({
    kind: 'comment', id: c.id, at: c.createdAt, user: { id: c.userId, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(), avatar: c.avatarUrl }, content: c.content,
  }));
  const historyList = (history.data || []).filter((a) => a.action !== 'comment_added').map((a) => ({ kind: 'history', id: a.id, at: a.createdAt, a }));
  const items =
    tab === 'comments' ? commentList : tab === 'history' ? historyList : [...commentList, ...historyList].sort((x, y) => new Date(y.at) - new Date(x.at));

  const meUser = me ? { id: me.id, name: `${me.firstName || ''} ${me.lastName || ''}`.trim(), avatar: me.avatarUrl } : null;

  return (
    <section>
      <h3 className="mb-2 text-base font-semibold text-[#172B4D]">Activité</h3>
      <div className="mb-3 inline-flex rounded-[3px] border border-[#DCDFE4] p-0.5">
        {[
          ['all', 'Tout'],
          ['comments', 'Commentaires'],
          ['history', 'Historique'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-[3px] px-2.5 py-1 text-sm font-medium ${tab === id ? 'bg-[#E9F2FF] text-[#0C66E4]' : 'text-[#44546F] hover:bg-[#091E420F]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== 'history' && (
        <form
          className="mb-4 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) add.mutate(draft.trim());
          }}
        >
          <UserAvatar user={meUser} size={32} />
          <div className="flex-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && draft.trim()) add.mutate(draft.trim());
              }}
              rows={draft ? 3 : 1}
              placeholder="Ajouter un commentaire…  (@ pour mentionner)"
              className="w-full resize-none rounded-[3px] border-2 border-[#DCDFE4] px-3 py-2 text-sm outline-none focus:border-[#388BFF]"
            />
            {draft && (
              <div className="mt-1 flex items-center gap-2">
                <button type="submit" disabled={add.isPending} className="inline-flex items-center gap-1 rounded-[3px] bg-[#0C66E4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0055CC] disabled:opacity-60">
                  <Send className="h-3.5 w-3.5" /> Enregistrer
                </button>
                <button type="button" onClick={() => setDraft('')} className="rounded-[3px] px-3 py-1.5 text-sm text-[#44546F] hover:bg-[#091E420F]">Annuler</button>
                <span className="text-xs text-[#626F86]">⌘/Ctrl + Entrée pour envoyer</span>
              </div>
            )}
          </div>
        </form>
      )}

      <div className="divide-y divide-[#F1F2F4]">
        {items.map((it) =>
          it.kind === 'comment' ? (
            <div key={`c-${it.id}`} className="flex gap-3 py-2">
              <UserAvatar user={it.user} size={28} />
              <div className="min-w-0 flex-1">
                <div className="text-sm">
                  <span className="font-semibold text-[#172B4D]">{it.user.name}</span>{' '}
                  <span className="text-xs text-[#626F86]">{new Date(it.at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-[#172B4D]">{it.content}</p>
              </div>
            </div>
          ) : (
            <HistoryEntry key={`h-${it.id}`} a={it.a} />
          )
        )}
        {items.length === 0 && !comments.isLoading && <p className="py-2 text-sm text-[#626F86]">Rien pour le moment.</p>}
      </div>
    </section>
  );
}

/* ---------- main modal ---------- */

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-1.5">
      <span className="text-sm font-semibold text-[#626F86]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function IssueDetailModal({ issueId, boardId, meta, onClose, onOpenIssue }) {
  const qc = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [newChild, setNewChild] = useState(null);
  const me = useAuthStore((s) => s.user);
  const update = useUpdateIssue(boardId);
  const createIssue = useCreateIssue(boardId);
  const deleteIssue = useDeleteIssue(boardId);

  const { data: issue, isLoading, error } = useQuery({
    queryKey: issueKeys.detail(issueId),
    queryFn: async () => (await issuesApi.get(issueId)).data.data,
    enabled: !!issueId,
  });

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('[data-popover-open]') && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const users = meta?.assignees || [];
  const findUser = (id) => users.find((u) => u.id === id) || null;
  const patch = (p, optimistic) => update.mutate({ id: issue.id, patch: p, optimistic });

  const copyLink = () => {
    const url = `${window.location.origin}/browse/${issue.key}`;
    navigator.clipboard?.writeText(url).then(() => toast.success('Lien copié'));
  };

  const remove = () => {
    if (!window.confirm(`Supprimer ${issue.key} ?${issue.subtask_count ? ` Ses ${issue.subtask_count} sous-tâche(s) seront aussi supprimées.` : ''} Cette action est irréversible.`)) return;
    deleteIssue.mutate(issue.id, {
      onSuccess: () => {
        toast.success(`${issue.key} supprimé`);
        onClose();
      },
    });
  };

  const childType = issue?.issue_type === 'epic' ? 'task' : 'subtask';
  const createChild = (summary) => {
    if (!summary.trim()) return setNewChild(null);
    createIssue.mutate(
      { summary: summary.trim(), issue_type: childType, parent_id: issue.id },
      {
        onSuccess: () => {
          setNewChild('');
          qc.invalidateQueries({ queryKey: issueKeys.detail(issue.id) });
        },
      }
    );
  };

  const body = (
    <div className="fixed inset-0 z-[900] flex items-start justify-center overflow-y-auto bg-[#091E427D] p-4 pt-[6vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={issue ? `${issue.key} ${issue.summary}` : 'Ticket'} className="w-full max-w-[1100px] rounded-[3px] bg-white shadow-[0_8px_12px_rgba(9,30,66,0.15),0_0_1px_rgba(9,30,66,0.31)]">
        {/* top bar */}
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <div className="flex min-w-0 items-center gap-1 text-sm text-[#44546F]">
            {issue?.parent && (
              <>
                <button type="button" onClick={() => onOpenIssue(issue.parent.key)} className="inline-flex items-center gap-1 rounded px-1 hover:bg-[#091E420F] hover:underline">
                  <IssueTypeIcon type={issue.parent.issue_type} size={14} />
                  {issue.parent.key}
                </button>
                <span>/</span>
              </>
            )}
            {issue && (
              <Link to={`/browse/${issue.key}`} className="inline-flex items-center gap-1 rounded px-1 hover:bg-[#091E420F] hover:underline">
                <IssueTypeIcon type={issue.issue_type} size={14} />
                {issue.key}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1">
            {issue && (
              <>
                <button type="button" onClick={copyLink} title="Copier le lien" className="rounded p-1.5 text-[#44546F] hover:bg-[#091E420F]"><Link2 className="h-4 w-4" /></button>
                <button type="button" onClick={remove} title="Supprimer" className="rounded p-1.5 text-[#44546F] hover:bg-[#FFECEB] hover:text-[#AE2E24]"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
            <button type="button" onClick={onClose} title="Fermer (Échap)" className="rounded p-1.5 text-[#44546F] hover:bg-[#091E420F]"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {isLoading && <div className="px-6 pb-10 pt-4 text-sm text-[#626F86]">Chargement…</div>}
        {error && <div className="px-6 pb-10 pt-4 text-sm text-[#AE2E24]">{apiError(error, 'Ticket introuvable')}</div>}

        {issue && (
          <div className="grid gap-8 px-6 pb-8 md:grid-cols-[minmax(0,1fr)_340px]">
            {/* left column */}
            <div className="min-w-0 space-y-6">
              <InlineText value={issue.summary} onSave={(v) => v && patch({ summary: v })} className="text-2xl font-medium text-[#172B4D]" />

              <section>
                <h3 className="mb-1 text-base font-semibold text-[#172B4D]">Description</h3>
                <InlineText value={issue.description} multiline placeholder="Modifier la description" onSave={(v) => patch({ description: v || null })} className="text-sm leading-6 text-[#172B4D]" />
              </section>

              {issue.issue_type !== 'subtask' && (
                <section>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[#172B4D]">{issue.issue_type === 'epic' ? 'Tickets enfants' : 'Sous-tâches'}</h3>
                    <button type="button" onClick={() => setNewChild('')} className="rounded p-1 text-[#44546F] hover:bg-[#091E420F]" title="Ajouter"><Plus className="h-4 w-4" /></button>
                  </div>
                  {issue.children?.length > 0 && (
                    <>
                      <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-[#DCDFE4]">
                        <div className="h-full bg-[#22A06B]" style={{ width: `${(issue.children.filter((c) => c.status === 'done').length / issue.children.length) * 100}%` }} />
                      </div>
                      <div className="divide-y divide-[#F1F2F4] rounded-[3px] border border-[#DCDFE4]">
                        {issue.children.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F7F8F9]">
                            <IssueTypeIcon type={c.issue_type} />
                            <button type="button" onClick={() => onOpenIssue(c.key)} className={`text-sm font-medium text-[#0C66E4] hover:underline ${c.status === 'done' ? 'line-through' : ''}`}>{c.key}</button>
                            <button type="button" onClick={() => onOpenIssue(c.key)} className="min-w-0 flex-1 truncate text-left text-sm text-[#172B4D]">{c.summary}</button>
                            <UserAvatar user={c.assignee} size={20} />
                            <StatusLozenge status={c.status} onChange={(s) => update.mutate({ id: c.id, patch: { status: s } }, { onSettled: () => qc.invalidateQueries({ queryKey: issueKeys.detail(issue.id) }) })} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {newChild !== null ? (
                    <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); createChild(newChild); }}>
                      <input autoFocus value={newChild} onChange={(e) => setNewChild(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setNewChild(null)} placeholder="Que faut-il faire ?" className="flex-1 rounded-[3px] border-2 border-[#388BFF] px-2 py-1 text-sm outline-none" />
                      <button type="submit" disabled={createIssue.isPending} className="rounded-[3px] bg-[#0C66E4] px-3 text-sm font-medium text-white disabled:opacity-60">Créer</button>
                      <button type="button" onClick={() => setNewChild(null)} className="rounded-[3px] px-2 text-sm text-[#44546F] hover:bg-[#091E420F]">Annuler</button>
                    </form>
                  ) : (
                    !issue.children?.length && (
                      <button type="button" onClick={() => setNewChild('')} className="text-sm text-[#626F86] hover:text-[#172B4D]">
                        {issue.issue_type === 'epic' ? 'Ajouter un ticket enfant' : 'Ajouter une sous-tâche'}
                      </button>
                    )
                  )}
                </section>
              )}

              {issue.links?.length > 0 && (
                <section>
                  <h3 className="mb-1 text-base font-semibold text-[#172B4D]">Tickets associés</h3>
                  <div className="divide-y divide-[#F1F2F4] rounded-[3px] border border-[#DCDFE4]">
                    {issue.links.map((l) => (
                      <div key={l.link_id} className="flex items-center gap-2 px-2 py-1.5">
                        <span className="w-28 flex-shrink-0 text-xs text-[#626F86]">{l.direction === 'outward' ? 'dépend de' : 'bloque'}</span>
                        <IssueTypeIcon type={l.issue_type} />
                        <button type="button" onClick={() => onOpenIssue(l.key)} className="text-sm font-medium text-[#0C66E4] hover:underline">{l.key}</button>
                        <span className="min-w-0 flex-1 truncate text-sm">{l.summary}</span>
                        <StatusLozenge status={l.status} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <ActivitySection issueId={issue.id} />
            </div>

            {/* right column */}
            <aside className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusLozenge size="lg" status={issue.status} onChange={(s) => patch({ status: s })} />
              </div>

              <div className="rounded-[3px] border border-[#DCDFE4]">
                <button type="button" onClick={() => setDetailsOpen((o) => !o)} className="flex w-full items-center gap-1 border-b border-[#DCDFE4] px-3 py-2.5 text-left text-sm font-semibold text-[#172B4D]">
                  {detailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} Détails
                </button>
                {detailsOpen && (
                  <div className="px-3 py-2">
                    <DetailRow label="Personne assignée">
                      <UserField user={issue.assignee} users={users} onChange={(id) => patch({ assignee_id: id }, { assignee: findUser(id) })} />
                      {!issue.assignee && me && users.some((u) => u.id === me.id) && (
                        <button type="button" onClick={() => patch({ assignee_id: me.id }, { assignee: findUser(me.id) })} className="mt-0.5 block text-sm text-[#0C66E4] hover:underline">
                          M'assigner
                        </button>
                      )}
                    </DetailRow>
                    <DetailRow label="Type">
                      {issue.issue_type === 'subtask' ? (
                        <span className="inline-flex items-center gap-1.5 text-sm"><IssueTypeIcon type="subtask" /> Sous-tâche</span>
                      ) : (
                        <Popover
                          width={200}
                          trigger={({ toggle, ref }) => (
                            <button ref={ref} type="button" onClick={toggle} className="-mx-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-sm hover:bg-[#091E420F]">
                              <IssueTypeIcon type={issue.issue_type} /> {ISSUE_TYPES[issue.issue_type]?.label}
                            </button>
                          )}
                        >
                          {({ close }) =>
                            ['epic', 'feature', 'task', 'bug'].map((t) => (
                              <MenuItem key={t} selected={t === issue.issue_type} onClick={() => { close(); if (t !== issue.issue_type) patch({ issue_type: t, ...(t === 'epic' ? { parent_id: null } : {}) }); }}>
                                <IssueTypeIcon type={t} /> {ISSUE_TYPES[t].label}
                              </MenuItem>
                            ))
                          }
                        </Popover>
                      )}
                    </DetailRow>
                    <DetailRow label="Parent">
                      {issue.parent ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <IssueTypeIcon type={issue.parent.issue_type} />
                          <button type="button" onClick={() => onOpenIssue(issue.parent.key)} className="text-[#0C66E4] hover:underline">{issue.parent.key}</button>
                          <span className="truncate text-[#44546F]">{issue.parent.summary}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-[#626F86]">Aucun</span>
                      )}
                    </DetailRow>
                    <DetailRow label="Priorité">
                      <PriorityField priority={issue.priority} onChange={(p) => patch({ priority: p })} />
                    </DetailRow>
                    <DetailRow label="Étiquettes">
                      <LabelsField labels={issue.labels || []} suggestions={meta?.labels || []} onChange={(l) => patch({ labels: l })} />
                    </DetailRow>
                    <DetailRow label="Date d'échéance">
                      <DateField value={issue.due_date} onChange={(d) => patch({ due_date: d })} />
                    </DetailRow>
                    <DetailRow label="Date de début">
                      <DateField value={issue.start_date} onChange={(d) => patch({ start_date: d })} />
                    </DetailRow>
                    <DetailRow label="Story points">
                      <InlineText
                        value={issue.story_points === null ? '' : String(issue.story_points)}
                        placeholder="Aucun"
                        onSave={(v) => {
                          const n = v === '' ? null : Number(v.replace(',', '.'));
                          if (n !== null && (Number.isNaN(n) || n < 0)) return toast.error('Nombre invalide');
                          patch({ story_points: n });
                        }}
                        className="text-sm"
                      />
                    </DetailRow>
                    <DetailRow label="Équipe">
                      <InlineText value={issue.team || ''} placeholder="Aucune" onSave={(v) => patch({ team: v || null })} className="text-sm" />
                    </DetailRow>
                    <DetailRow label="Sprint">
                      {meta?.sprints?.length ? (
                        <Popover
                          width={240}
                          trigger={({ toggle, ref }) => (
                            <button ref={ref} type="button" onClick={toggle} className="-mx-1 rounded px-1 py-0.5 text-sm hover:bg-[#091E420F]">
                              {issue.sprint ? <span className="text-[#0C66E4]">{issue.sprint.name}</span> : <span className="text-[#626F86]">Aucun</span>}
                            </button>
                          )}
                        >
                          {({ close }) => (
                            <>
                              {meta.sprints.filter((s) => s.status !== 'completed').map((s) => (
                                <MenuItem key={s.id} selected={issue.sprint?.id === s.id} onClick={() => { close(); patch({ sprint_id: s.id }); }}>
                                  {s.name} {s.status === 'active' && <span className="text-xs text-[#216E4E]">(actif)</span>}
                                </MenuItem>
                              ))}
                              <MenuItem selected={!issue.sprint} onClick={() => { close(); patch({ sprint_id: null }); }}>
                                <span className="text-[#626F86]">Backlog (aucun sprint)</span>
                              </MenuItem>
                            </>
                          )}
                        </Popover>
                      ) : (
                        <span className="text-sm text-[#626F86]">{issue.sprint?.name || 'Aucun'}</span>
                      )}
                    </DetailRow>
                    <DetailRow label="Rapporteur">
                      <UserField user={issue.reporter} users={users} allowEmpty={false} emptyLabel="Aucun" onChange={(id) => patch({ reporter_id: id }, { reporter: findUser(id) })} />
                    </DetailRow>
                  </div>
                )}
              </div>

              <div className="space-y-0.5 px-1 text-xs text-[#626F86]">
                <div>Créé le {new Date(issue.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</div>
                <div>Mis à jour le {new Date(issue.updated_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
  return createPortal(body, document.body);
}
