import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatDate } from './issueMeta';

const toISO = (d) => d.toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
};
const DURATIONS = [
  { id: '1', label: '1 semaine', days: 7 },
  { id: '2', label: '2 semaines', days: 14 },
  { id: '3', label: '3 semaines', days: 21 },
  { id: '4', label: '4 semaines', days: 28 },
  { id: 'custom', label: 'Personnalisé' },
];

export function Dialog({ title, children, footer, onClose, width = 560 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('[data-popover-open]') && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[950] flex items-start justify-center overflow-y-auto bg-[#091E427D] p-4 pt-[10vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full rounded-[3px] bg-white shadow-[0_8px_12px_rgba(9,30,66,0.15),0_0_1px_rgba(9,30,66,0.31)]" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h2 className="text-xl font-medium text-[#172B4D]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#44546F] hover:bg-[#091E420F]" aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-2">{children}</div>
        <div className="flex justify-end gap-2 px-6 pb-5 pt-3">{footer}</div>
      </div>
    </div>,
    document.body
  );
}

const Field = ({ label, required, children, hint }) => (
  <label className="mb-4 block">
    <span className="mb-1 block text-xs font-semibold text-[#626F86]">
      {label} {required && <span className="text-[#AE2E24]">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-[#626F86]">{hint}</span>}
  </label>
);
const inputCls = 'w-full rounded-[3px] border-2 border-[#DCDFE4] bg-[#F7F8F9] px-2 py-1.5 text-sm text-[#172B4D] outline-none hover:bg-[#F1F2F4] focus:border-[#388BFF] focus:bg-white';
export const PrimaryButton = ({ children, ...p }) => (
  <button type="button" {...p} className="rounded-[3px] bg-[#0C66E4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0055CC] disabled:cursor-not-allowed disabled:opacity-50">{children}</button>
);
export const SubtleButton = ({ children, ...p }) => (
  <button type="button" {...p} className="rounded-[3px] px-3 py-1.5 text-sm font-medium text-[#44546F] hover:bg-[#091E420F]">{children}</button>
);

/** "Démarrer le sprint" (mode=start) or "Modifier le sprint" (mode=edit), as in Jira. */
export function SprintFormDialog({ sprint, mode, onClose, onSubmit, pending }) {
  const today = toISO(new Date());
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal || '');
  const [start, setStart] = useState(sprint.start_date || today);
  const initialDuration = sprint.start_date && sprint.end_date ? 'custom' : '2';
  const [duration, setDuration] = useState(initialDuration);
  const [end, setEnd] = useState(sprint.end_date || addDays(sprint.start_date || today, 14));

  useEffect(() => {
    const d = DURATIONS.find((x) => x.id === duration);
    if (d?.days && start) setEnd(addDays(start, d.days));
  }, [duration, start]);

  const invalid = !name.trim() || (mode === 'start' && (!start || !end)) || (start && end && end < start);
  const submit = () => {
    if (invalid) return;
    onSubmit({ name: name.trim(), goal: goal.trim() || null, start_date: start || null, end_date: end || null });
  };

  return (
    <Dialog
      title={mode === 'start' ? 'Démarrer le sprint' : `Modifier le sprint : ${sprint.name}`}
      onClose={onClose}
      footer={
        <>
          <SubtleButton onClick={onClose}>Annuler</SubtleButton>
          <PrimaryButton onClick={submit} disabled={invalid || pending}>{mode === 'start' ? 'Démarrer' : 'Mettre à jour'}</PrimaryButton>
        </>
      }
    >
      {mode === 'start' && (
        <p className="mb-4 text-sm text-[#44546F]">
          <strong>{sprint.issue_count}</strong> ticket{sprint.issue_count > 1 ? 's seront inclus' : ' sera inclus'} dans ce sprint.
        </p>
      )}
      <Field label="Nom du sprint" required>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={255} autoFocus />
      </Field>
      <Field label="Durée">
        <select className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)}>
          {DURATIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date de début" required={mode === 'start'}>
          <input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Date de fin" required={mode === 'start'}>
          <input type="date" className={inputCls} value={end} min={start} disabled={duration !== 'custom'} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      {start && end && end < start && <p className="-mt-2 mb-3 text-xs text-[#AE2E24]">La date de fin doit suivre la date de début.</p>}
      <Field label="Objectif du sprint">
        <textarea className={`${inputCls} resize-y`} rows={3} value={goal} onChange={(e) => setGoal(e.target.value)} />
      </Field>
    </Dialog>
  );
}

/** "Terminer le sprint": shows completed / open counts and where open issues go. */
export function CompleteSprintDialog({ sprint, plannedSprints, onClose, onSubmit, pending }) {
  const open = sprint.issue_count - sprint.done_count;
  const [moveTo, setMoveTo] = useState(plannedSprints[0]?.id || 'backlog');
  return (
    <Dialog
      title={`Terminer ${sprint.name}`}
      onClose={onClose}
      footer={
        <>
          <SubtleButton onClick={onClose}>Annuler</SubtleButton>
          <PrimaryButton onClick={() => onSubmit({ move_to: open ? moveTo : 'backlog' })} disabled={pending}>Terminer le sprint</PrimaryButton>
        </>
      }
    >
      <p className="mb-3 text-sm text-[#44546F]">
        Sprint du {formatDate(sprint.start_date)} au {formatDate(sprint.end_date)}.
      </p>
      <ul className="mb-4 space-y-1 text-sm text-[#172B4D]">
        <li><strong>{sprint.done_count}</strong> ticket{sprint.done_count > 1 ? 's terminés' : ' terminé'}</li>
        <li><strong>{open}</strong> ticket{open > 1 ? 's ouverts' : ' ouvert'}</li>
        {sprint.points_total > 0 && <li><strong>{sprint.points_done}</strong> / {sprint.points_total} story points livrés</li>}
      </ul>
      {open > 0 ? (
        <Field label="Déplacer les tickets ouverts vers" hint="Les sous-tâches suivent leur parent.">
          <select className={inputCls} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            {plannedSprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="new">Nouveau sprint</option>
            <option value="backlog">Backlog</option>
          </select>
        </Field>
      ) : (
        <p className="text-sm text-[#216E4E]">Tous les tickets sont terminés. Bravo à l'équipe !</p>
      )}
    </Dialog>
  );
}
