import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MoreHorizontal, Trash2, Edit2, Calendar,
  MessageSquare, Paperclip,
} from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import { itemApi, memberApi, columnApi } from '../../lib/api';
import { format, isValid, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import EditItemModal from '../modals/EditItemModal';
import ItemDetailsModal from '../modals/ItemDetailsModal';

function statusBarColor(statusId, fallbackHex) {
  const s = String(statusId || '').toLowerCase();
  if (s === 'done' || s.includes('done') || s === 'terminé') return '#22c55e';
  if (s === 'in_progress' || s.includes('progress') || s === 'en_cours') return '#F36F21';
  if (s === 'blocked' || s.includes('block') || s === 'bloqué') return '#EF4444';
  if (s === 'todo' || s.includes('todo') || s === 'a_faire') return '#173D68';
  return fallbackHex || '#173D68';
}

function initialsFromName(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarBg(seed) {
  const colors = ['#173D68', '#F36F21', '#1E5090', '#22c55e', '#8b5cf6', '#ec4899'];
  const n = String(seed || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

export default function BoardKanban() {
  const { currentBoard, columns, items, addItem, updateItemValue, deleteItem } = useBoardStore();
  const [newItemName, setNewItemName] = useState({});
  const [showNewItem, setShowNewItem] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeListMenu, setActiveListMenu] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [wipLimits, setWipLimits] = useState({});
  const [editingWip, setEditingWip] = useState(null);

  useEffect(() => {
    const loadMembers = async () => {
      if (!currentBoard?.workspaceId) return;
      try {
        const response = await memberApi.getByWorkspace(currentBoard.workspaceId);
        setWorkspaceMembers(response.data || []);
      } catch (error) {
        console.error('Failed to load members:', error);
      }
    };
    loadMembers();
  }, [currentBoard?.workspaceId]);

  const getMemberName = (memberId) => {
    const member = workspaceMembers.find((m) => m.id === memberId);
    if (member) return `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email?.split('@')[0] || 'Membre';
    return null;
  };

  const statusColumn = useMemo(() => columns.find((col) => col.type === 'status') || columns[0], [columns]);

  const statusLabels = useMemo(() => {
    if (statusColumn?.labels?.length > 0) return statusColumn.labels;
    return [
      { id: 'todo', name: 'A faire', color: '#173D68' },
      { id: 'in_progress', name: 'En cours', color: '#F36F21' },
      { id: 'done', name: 'Termine', color: '#22c55e' },
    ];
  }, [statusColumn]);

  const dateColumn = useMemo(() => columns.find((c) => c.type === 'date' && c.id !== statusColumn?.id), [columns, statusColumn?.id]);
  const personColumn = useMemo(() => columns.find((c) => c.type === 'person' && c.id !== statusColumn?.id), [columns, statusColumn?.id]);
  const priorityColumn = useMemo(() => columns.find((c) => c.type === 'priority' && c.id !== statusColumn?.id), [columns, statusColumn?.id]);

  useEffect(() => {
    if (statusColumn?.config?.wipLimits) setWipLimits(statusColumn.config.wipLimits);
  }, [statusColumn]);

  const handleSetWipLimit = async (statusId, limit) => {
    const newLimits = { ...wipLimits };
    if (limit && limit > 0) newLimits[statusId] = parseInt(limit, 10);
    else delete newLimits[statusId];
    setWipLimits(newLimits);
    setEditingWip(null);
    setActiveListMenu(null);
    if (statusColumn) {
      try {
        await columnApi.update(statusColumn.id, { config: { ...statusColumn.config, wipLimits: newLimits } });
        toast.success('Limite WIP mise a jour');
      } catch (error) { toast.error('Erreur'); }
    }
  };

  const itemsByStatus = useMemo(() => {
    const result = {};
    statusLabels.forEach((label) => {
      result[label.id] = items.filter((item) => {
        const value = item.values?.[statusColumn?.id];
        return value === label.id || (!value && label.id === statusLabels[0]?.id);
      });
    });
    return result;
  }, [items, statusColumn, statusLabels]);

  const getPersonUserIds = (item) => {
    if (!personColumn) return [];
    const value = item.values?.[personColumn.id];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    if (value?.userIds) return Array.isArray(value.userIds) ? value.userIds : [value.userIds];
    return [];
  };

  const getDueDateDisplay = (item, listStatusId) => {
    if (!dateColumn) return null;
    const raw = item.values?.[dateColumn.id];
    const dateStr = typeof raw === 'object' ? raw?.date : raw;
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (!isValid(date)) return null;
    const doneList = String(listStatusId || '').toLowerCase().includes('done');
    const overdue = !doneList && startOfDay(date) < startOfDay(new Date());
    return { text: format(date, 'd MMM', { locale: fr }), overdue };
  };

  const getPriorityDotColor = (item) => {
    if (!priorityColumn) return null;
    const value = item.values?.[priorityColumn.id];
    if (value == null || value === '') return null;
    const labels = priorityColumn.labels || [];
    const label = labels.find((l) => l.id === value || l.name === value);
    return label?.color || '#94a3b8';
  };

  const commentCount = (item) => item?._count?.comments ?? item?.commentCount ?? item?.commentsCount ?? item?.nbComments ?? 0;
  const attachmentCount = (item) => item?._count?.attachments ?? item?.attachmentCount ?? item?.attachmentsCount ?? item?.nbAttachments ?? 0;

  const handleCreateItem = async (statusId) => {
    const name = newItemName[statusId];
    if (!name?.trim()) return;
    try {
      const response = await itemApi.create({ boardId: currentBoard.id, name: name.trim() });
      if (statusColumn) await itemApi.updateValue(response.data.id, statusColumn.id, statusId);
      addItem({ ...response.data, values: { [statusColumn?.id]: statusId } });
      setNewItemName({ ...newItemName, [statusId]: '' });
      setShowNewItem({ ...showNewItem, [statusId]: false });
    } catch (error) { toast.error('Erreur lors de la creation'); }
  };

  const handleDragStart = (e, item) => { setDraggedItem(item); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    if (!draggedItem || !statusColumn) return;
    const currentStatus = draggedItem.values?.[statusColumn.id] || statusLabels[0]?.id;
    const workflow = currentBoard?.config?.workflow;
    if (workflow?.enabled && workflow?.transitions) {
      const allowedTransitions = workflow.transitions[currentStatus] || [];
      if (!allowedTransitions.includes(statusId)) {
        const fromLabel = statusLabels.find((l) => l.id === currentStatus);
        const toLabel = statusLabels.find((l) => l.id === statusId);
        toast.error(`Transition non autorisee : ${fromLabel?.name || currentStatus} → ${toLabel?.name || statusId}`);
        setDraggedItem(null);
        return;
      }
    }
    try {
      await itemApi.updateValue(draggedItem.id, statusColumn.id, statusId);
      updateItemValue(draggedItem.id, statusColumn.id, statusId);
      toast.success('Statut mis a jour');
    } catch (error) { toast.error('Erreur'); }
    setDraggedItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await itemApi.delete(itemId);
      deleteItem(itemId);
      toast.success('Item supprime');
    } catch (error) { toast.error('Erreur'); }
    setActiveMenu(null);
  };

  if (!statusColumn) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 mb-4">Ajoutez une colonne « Statut » pour utiliser la vue Kanban</p>
        <p className="text-sm text-gray-400">La vue Kanban utilise une colonne de type Statut pour organiser les items</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-3 overflow-x-auto overflow-y-hidden p-3">
      {statusLabels.map((status) => {
        const count = itemsByStatus[status.id]?.length || 0;
        const wipOver = wipLimits[status.id] && count > wipLimits[status.id];
        const barColor = statusBarColor(status.id, status.color);

        return (
          <div
            key={status.id}
            className={`flex w-[280px] shrink-0 flex-col rounded-xl bg-white border shadow-sm max-h-full ${
              wipOver ? 'ring-2 ring-red-400/60 border-red-200' : 'border-gray-200'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            {/* List header with colored top border */}
            <div className="rounded-t-xl px-3 pt-0.5">
              <div className="h-1 rounded-full mb-2" style={{ backgroundColor: barColor }} />
            </div>
            <div className={`flex shrink-0 items-center justify-between gap-2 px-3 pb-2.5 ${wipOver ? 'bg-red-50/50' : ''}`}>
              <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <h3 className="truncate font-semibold text-sm text-[#173D68]">{status.name || status.label || 'Sans nom'}</h3>
                <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  wipOver ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}{wipLimits[status.id] ? ` / ${wipLimits[status.id]}` : ''}
                </span>
              </div>
              <div className="relative shrink-0 group/list">
                <button
                  type="button"
                  onClick={() => { setActiveListMenu(activeListMenu === status.id ? null : status.id); setActiveMenu(null); }}
                  className="rounded-md p-1 text-gray-400 hover:text-[#173D68] hover:bg-gray-100 opacity-0 group-hover/list:opacity-100 transition-all"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {activeListMenu === status.id && (
                  <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                    <button type="button" onClick={() => setEditingWip(editingWip === status.id ? null : status.id)} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      Limite WIP…
                    </button>
                    {editingWip === status.id && (
                      <div className="border-t border-gray-100 px-3 py-2">
                        <label className="mb-1 block text-xs text-gray-500">Limite WIP</label>
                        <div className="flex gap-2">
                          <input
                            id={`wip-input-${status.id}`}
                            type="number" min="0" placeholder="Aucune" defaultValue={wipLimits[status.id] || ''}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSetWipLimit(status.id, e.target.value); }}
                            className="input w-full text-sm" autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => { const input = document.getElementById(`wip-input-${status.id}`); if (input) handleSetWipLimit(status.id, input.value); }}
                            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-white" style={{ backgroundColor: '#F36F21' }}
                          >OK</button>
                        </div>
                        {wipLimits[status.id] ? (
                          <button type="button" onClick={() => handleSetWipLimit(status.id, 0)} className="mt-2 text-xs text-red-500 hover:text-red-600">Supprimer la limite</button>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[80px]">
              <AnimatePresence>
                {itemsByStatus[status.id]?.map((item) => {
                  const due = getDueDateDisplay(item, status.id);
                  const cc = commentCount(item);
                  const ac = attachmentCount(item);
                  const prioColor = getPriorityDotColor(item);
                  const userIds = getPersonUserIds(item);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className={`group/card bg-white rounded-lg border border-gray-200 px-3 py-2.5 cursor-pointer hover:border-[#F36F21]/30 hover:shadow-md transition-all ${
                        draggedItem?.id === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Status color bar */}
                      <div className="mb-2 flex gap-1">
                        <span className="h-1.5 min-w-[40px] flex-1 max-w-[56px] rounded-full" style={{ backgroundColor: barColor }} />
                      </div>

                      {/* Title + menu */}
                      <div className="flex items-start justify-between gap-1">
                        <p
                          className="min-w-0 flex-1 font-semibold leading-snug text-[#173D68] text-sm"
                          onClick={() => setDetailItem(item)}
                          role="button" tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailItem(item); } }}
                        >
                          {item.name}
                        </p>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => { setActiveMenu(activeMenu === item.id ? null : item.id); setActiveListMenu(null); }}
                            className="rounded-md p-0.5 text-gray-400 opacity-0 group-hover/card:opacity-100 hover:bg-gray-100 hover:text-[#173D68] transition-all"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {activeMenu === item.id && (
                            <div className="absolute right-0 top-6 z-20 min-w-[140px] rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                              <button type="button" onClick={() => { setDetailItem(item); setActiveMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Edit2 className="h-4 w-4" /> Détails
                              </button>
                              <button type="button" onClick={() => handleDeleteItem(item.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        {due ? (
                          <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                            due.overdue ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Calendar className="h-3 w-3 shrink-0" />
                            {due.text}
                          </span>
                        ) : null}
                        {cc > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-gray-500">
                            <MessageSquare className="h-3 w-3 shrink-0" /> {cc}
                          </span>
                        ) : null}
                        {ac > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-gray-500">
                            <Paperclip className="h-3 w-3 shrink-0" /> {ac}
                          </span>
                        ) : null}
                        {prioColor ? (
                          <span className="inline-flex items-center" title="Priorite">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/5" style={{ backgroundColor: prioColor }} />
                          </span>
                        ) : null}
                      </div>

                      {/* Avatars */}
                      {userIds.length > 0 ? (
                        <div className="mt-2.5 flex justify-end">
                          <div className="flex -space-x-1.5">
                            {userIds.slice(0, 4).map((uid) => {
                              const name = getMemberName(uid) || '?';
                              return (
                                <div
                                  key={uid}
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white"
                                  style={{ backgroundColor: avatarBg(uid) }}
                                  title={name}
                                >
                                  {initialsFromName(name)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {draggedItem ? (
                <div className="flex h-10 items-center justify-center rounded-lg border-2 border-dashed border-[#F36F21]/40 bg-[#F36F21]/5">
                  <span className="text-xs font-medium text-[#F36F21]">Deposer ici</span>
                </div>
              ) : null}
            </div>

            {/* Add card */}
            <div className="shrink-0 px-2 pb-2 pt-1">
              {showNewItem[status.id] ? (
                <div className="space-y-2 rounded-lg bg-gray-50 p-2 border border-gray-100">
                  <input
                    type="text"
                    placeholder="Saisir un titre pour cette carte..."
                    value={newItemName[status.id] || ''}
                    onChange={(e) => setNewItemName({ ...newItemName, [status.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateItem(status.id);
                      if (e.key === 'Escape') setShowNewItem({ ...showNewItem, [status.id]: false });
                    }}
                    autoFocus
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 shadow-sm focus:border-[#F36F21] focus:outline-none focus:ring-1 focus:ring-[#F36F21]/30"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button" onClick={() => handleCreateItem(status.id)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: '#F36F21' }}
                    >Ajouter</button>
                    <button
                      type="button" onClick={() => setShowNewItem({ ...showNewItem, [status.id]: false })}
                      className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                    >Annuler</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewItem({ ...showNewItem, [status.id]: true })}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-gray-500 hover:text-[#F36F21] hover:bg-[#F36F21]/5 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une carte
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add list */}
      <button
        type="button"
        className="flex h-fit min-h-[40px] w-[280px] shrink-0 items-center justify-start gap-2 rounded-xl border-2 border-dashed border-gray-300 px-3 py-3 text-left text-sm font-semibold text-gray-400 transition-colors hover:border-[#F36F21] hover:text-[#F36F21] hover:bg-[#F36F21]/5"
        onClick={() => toast('Les listes correspondent aux valeurs de la colonne Statut. Modifiez les etiquettes dans les parametres du tableau.', { icon: 'ℹ️' })}
      >
        <Plus className="h-4 w-4 shrink-0" />
        Ajouter une autre liste
      </button>

      <ItemDetailsModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        onEdit={(it) => { setDetailItem(null); setEditingItem(it); }}
      />
      <EditItemModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} item={editingItem} workspaceId={currentBoard?.workspaceId} />
    </div>
  );
}
