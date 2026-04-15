import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Copy,
  Edit2,
  X,
  Plus,
  ListPlus,
  Clipboard,
  Palette,
  Type,
  Check,
} from "lucide-react";
import { useBoardStore } from "../../stores/boardStore";
import { itemApi, groupApi } from "../../lib/api";
import ItemCell from "./cells/ItemCell";
import EditItemModal from "../modals/EditItemModal";
import toast from "react-hot-toast";

const GROUP_COLORS = [
  '#173D68', '#F36F21', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#6366f1',
  '#14b8a6', '#f97316', '#84cc16', '#a855f7', '#64748b',
];

function boardNameInitials(name) {
  const trimmed = name?.trim() || "";
  if (!trimmed) return "BR";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 4);
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export default function BoardTable() {
  const {
    currentBoard, columns, groups, items, selectedItems,
    toggleItemSelection, selectAllItems, clearSelection,
    toggleGroupCollapse, addItem, addGroup, updateGroup, deleteGroup, deleteItem, getFilteredItems,
  } = useBoardStore();

  const filteredItems = getFilteredItems();

  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [newItemName, setNewItemName] = useState({});
  const [showNewItem, setShowNewItem] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  const [groupMenu, setGroupMenu] = useState(null);
  const [groupMenuPos, setGroupMenuPos] = useState({ top: 0, left: 0 });
  const [renamingGroup, setRenamingGroup] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [colorPickerGroup, setColorPickerGroup] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const renameInputRef = useRef(null);
  const newGroupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeMenu]);

  const groupedItems = useMemo(() => {
    const result = {};
    groups.forEach((group) => {
      result[group.id] = filteredItems.filter((item) => item.groupId === group.id).sort((a, b) => a.position - b.position);
    });
    result["ungrouped"] = filteredItems.filter((item) => !item.groupId).sort((a, b) => a.position - b.position);
    return result;
  }, [groups, filteredItems]);

  const boardInitials = useMemo(() => boardNameInitials(currentBoard?.name), [currentBoard?.name]);

  const itemDisplayIdByItemId = useMemo(() => {
    const map = new Map();
    let seq = 0;
    groups.forEach((group) => {
      (groupedItems[group.id] || []).forEach((item) => { map.set(item.id, `${boardInitials}-T${102 + seq}`); seq += 1; });
    });
    (groupedItems["ungrouped"] || []).forEach((item) => { map.set(item.id, `${boardInitials}-T${102 + seq}`); seq += 1; });
    return map;
  }, [groups, groupedItems, boardInitials]);

  const handleCreateItem = async (groupId) => {
    const name = newItemName[groupId];
    if (!name?.trim()) return;
    try {
      const response = await itemApi.create({ boardId: currentBoard.id, groupId: groupId !== "ungrouped" ? groupId : null, name: name.trim() });
      addItem(response.data);
      setNewItemName({ ...newItemName, [groupId]: "" });
      setShowNewItem({ ...showNewItem, [groupId]: false });
    } catch (error) {
      toast.error("Erreur lors de la creation");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Supprimer cet item ?")) return;
    try {
      await itemApi.delete(itemId);
      deleteItem(itemId);
      toast.success("Item supprime");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
    setActiveMenu(null);
  };

  const handleDuplicateItem = async (itemId) => {
    try {
      const response = await itemApi.duplicate(itemId);
      addItem(response.data);
      toast.success("Item duplique");
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
    setActiveMenu(null);
  };

  const handleAddTaskList = () => {
    setShowNewGroup(true);
    setNewGroupName('');
    setTimeout(() => newGroupRef.current?.focus(), 50);
  };

  const submitNewGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || !currentBoard?.id) { setShowNewGroup(false); return; }
    try {
      const { data } = await groupApi.create({ boardId: currentBoard.id, name: trimmed, color: '#173D68' });
      addGroup(data);
      toast.success('Liste creee');
    } catch (_) {
      toast.error('Erreur lors de la creation');
    }
    setShowNewGroup(false);
    setNewGroupName('');
  };

  const openGroupMenu = (e, groupId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.bottom + 4;
    let left = rect.left;
    if (left + 220 > window.innerWidth) left = window.innerWidth - 228;
    setGroupMenuPos({ top, left });
    setGroupMenu(groupMenu === groupId ? null : groupId);
    setColorPickerGroup(null);
  };

  const startRenameGroup = (group) => {
    setRenamingGroup(group.id);
    setRenameValue(group.name);
    setGroupMenu(null);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const submitRenameGroup = async (groupId) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingGroup(null); return; }
    try {
      await groupApi.update(groupId, { name: trimmed });
      updateGroup(groupId, { name: trimmed });
      toast.success('Groupe renomme');
    } catch (_) {
      toast.error('Erreur');
    }
    setRenamingGroup(null);
  };

  const handleChangeGroupColor = async (groupId, color) => {
    try {
      await groupApi.update(groupId, { color });
      updateGroup(groupId, { color });
    } catch (_) {
      toast.error('Erreur');
    }
    setColorPickerGroup(null);
    setGroupMenu(null);
  };

  const handleDeleteGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    const count = groupedItems[groupId]?.length || 0;
    const msg = count > 0
      ? `Supprimer la liste "${group?.name}" et liberer ses ${count} tache(s) ?`
      : `Supprimer la liste "${group?.name}" ?`;
    if (!confirm(msg)) return;
    try {
      await groupApi.delete(groupId);
      deleteGroup(groupId);
      toast.success('Liste supprimee');
    } catch (_) {
      toast.error('Erreur');
    }
    setGroupMenu(null);
  };

  useEffect(() => {
    if (!groupMenu) return;
    const close = (e) => {
      if (!e.target.closest('[data-group-menu]')) setGroupMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [groupMenu]);

  const openContextMenu = useCallback((e, itemId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 160;
    let top = rect.bottom + 4;
    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    if (typeof window !== "undefined") {
      if (top + menuHeight > window.innerHeight) top = rect.top - menuHeight - 4;
      if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 8;
    }
    setMenuPosition({ top, left });
    setActiveMenu(activeMenu === itemId ? null : itemId);
  }, [activeMenu]);

  const visibleColumns = columns.filter((col) => col.isVisible !== false);

  const renderItemRow = (item) => (
    <div
      key={item.id}
      className="board-row flex items-stretch min-h-[42px] group border-b border-gray-100 hover:bg-[#F36F21]/[0.02] transition-colors"
    >
      {/* Grip */}
      <div className="w-9 flex-shrink-0 flex items-center justify-center border-r border-gray-100">
        <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-grab opacity-0 group-hover:opacity-60 transition-opacity" />
      </div>
      {/* Checkbox */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center border-r border-gray-100">
        <input
          type="checkbox"
          checked={selectedItems.includes(item.id)}
          onChange={() => toggleItemSelection(item.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded border-gray-300 text-[#F36F21] focus:ring-[#F36F21] cursor-pointer"
        />
      </div>
      {/* ID */}
      <div className="w-[7.25rem] flex-shrink-0 flex items-center px-3 border-r border-gray-100 tabular-nums font-mono text-xs text-gray-400">
        {itemDisplayIdByItemId.get(item.id) ?? `${boardInitials}-T-`}
      </div>
      {/* Name */}
      <div
        className="flex-1 min-w-[200px] px-3 font-medium text-[#173D68] cursor-pointer hover:text-[#F36F21] truncate border-r border-gray-100 flex items-center transition-colors"
        onClick={() => setEditingItem(item)}
      >
        {item.name}
      </div>
      {/* Columns */}
      {visibleColumns.map((column) => (
        <div
          key={column.id}
          className="board-cell flex-shrink-0 flex items-center border-r border-gray-100 last:border-r-0"
          style={{ width: column.width || 150 }}
        >
          <ItemCell item={item} column={column} value={item.values?.[column.id]} />
        </div>
      ))}
      {/* Action button */}
      <div className="w-11 flex-shrink-0 flex items-center justify-center border-l border-gray-100">
        <button
          type="button"
          onClick={(e) => openContextMenu(e, item.id)}
          className="p-1.5 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-[#173D68] transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderNewItemRow = (groupId) => {
    if (!showNewItem[groupId]) return null;
    return (
      <div className="flex items-stretch border-b border-gray-100 bg-[#F36F21]/[0.02]">
        <div className="w-9 flex-shrink-0 border-r border-gray-100" />
        <div className="w-8 flex-shrink-0 border-r border-gray-100" />
        <div className="w-[7.25rem] flex-shrink-0 border-r border-gray-100" />
        <div className="flex-1 flex items-center gap-2 px-3 py-2 min-w-[200px] border-r border-gray-100">
          <input
            type="text"
            placeholder="Nom de la tache..."
            value={newItemName[groupId] || ""}
            onChange={(e) => setNewItemName({ ...newItemName, [groupId]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateItem(groupId);
              if (e.key === "Escape") setShowNewItem({ ...showNewItem, [groupId]: false });
            }}
            autoFocus
            className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] transition-colors"
          />
          <button type="button" onClick={() => handleCreateItem(groupId)} className="px-3 py-1.5 text-sm font-medium text-white rounded-lg shrink-0 hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
            Ajouter
          </button>
          <button type="button" onClick={() => setShowNewItem({ ...showNewItem, [groupId]: false })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        {visibleColumns.map((column) => (
          <div key={column.id} className="flex-shrink-0 border-r border-gray-100 last:border-r-0" style={{ width: column.width || 150 }} />
        ))}
        <div className="w-11 flex-shrink-0 border-l border-gray-100" />
      </div>
    );
  };

  const renderAddButtons = (groupId) => (
    <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-white">
      <button
        type="button"
        onClick={() => setShowNewItem({ ...showNewItem, [groupId]: true })}
        className="flex items-center gap-1.5 text-sm text-[#F36F21] hover:text-[#e05e15] font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Ajouter une tache
      </button>
      <button
        type="button"
        onClick={handleAddTaskList}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#173D68] font-medium transition-colors"
      >
        <ListPlus className="w-3.5 h-3.5" />
        Nouvelle liste
      </button>
    </div>
  );

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
        <div className="overflow-x-auto flex-1">
          <div className="min-w-max">
            {/* Table header */}
            <div className="board-header flex items-stretch border-b border-gray-200 bg-gray-50">
              <div className="w-9 flex-shrink-0 border-r border-gray-100" />
              <div className="w-8 flex-shrink-0 flex items-center justify-center border-r border-gray-100">
                <input
                  type="checkbox"
                  onChange={(e) => e.target.checked ? selectAllItems() : clearSelection()}
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#F36F21] focus:ring-[#F36F21] cursor-pointer"
                />
              </div>
              <div className="board-header-cell w-[7.25rem] flex-shrink-0 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 flex items-center px-3">
                ID
              </div>
              <div className="board-header-cell flex-1 min-w-[200px] text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 flex items-center px-3">
                Tache
              </div>
              {visibleColumns.map((column) => (
                <div
                  key={column.id}
                  className="board-header-cell flex-shrink-0 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 last:border-r-0 flex items-center px-3"
                  style={{ width: column.width || 150 }}
                >
                  {column.title}
                </div>
              ))}
              <div className="w-11 flex-shrink-0 border-l border-gray-100" />
            </div>

            {/* Groups */}
            {groups.map((group) => (
              <div key={group.id} className="border-b border-gray-200 last:border-b-0">
                <div
                  className="flex items-center border-l-[3px] pl-3 pr-2 py-2.5 bg-gray-50/60 hover:bg-gray-50 border-b border-gray-200 transition-colors group/hdr"
                  style={{ borderLeftColor: group.color || '#173D68' }}
                >
                  <button type="button" onClick={() => toggleGroupCollapse(group.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                    {group.isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    {renamingGroup === group.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitRenameGroup(group.id); if (e.key === 'Escape') setRenamingGroup(null); }}
                        onBlur={() => submitRenameGroup(group.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-bold text-[#173D68] bg-white border border-[#F36F21]/40 rounded-md px-2 py-0.5 outline-none focus:ring-2 focus:ring-[#F36F21]/20 w-48"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[#173D68] truncate">{group.name}</span>
                    )}
                    <span className="text-xs font-medium text-gray-400 bg-gray-200/50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {groupedItems[group.id]?.length || 0}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openGroupMenu(e, group.id)}
                    className="p-1.5 rounded-lg text-gray-400 opacity-0 group-hover/hdr:opacity-100 hover:bg-gray-200 hover:text-[#173D68] transition-all flex-shrink-0"
                    data-group-menu
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {!group.isCollapsed && (
                  <div className="bg-white">
                    {groupedItems[group.id]?.map((item) => renderItemRow(item))}
                    {renderNewItemRow(group.id)}
                    {renderAddButtons(group.id)}
                  </div>
                )}
              </div>
            ))}

            {/* Ungrouped items */}
            {groupedItems["ungrouped"]?.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="w-full border-l-[3px] border-l-gray-300 pl-3 pr-4 py-2.5 bg-gray-50/60 border-b border-gray-200">
                  <span className="text-sm font-bold text-[#173D68]">Sans groupe</span>
                  <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-200/50 px-1.5 py-0.5 rounded-full">
                    {groupedItems["ungrouped"].length}
                  </span>
                </div>
                <div className="bg-white">
                  {groupedItems["ungrouped"].map((item) => renderItemRow(item))}
                  {renderNewItemRow("ungrouped")}
                  {renderAddButtons("ungrouped")}
                </div>
              </div>
            )}

            {/* New group inline creation */}
            {showNewGroup && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-[#F36F21]/[0.02]">
                <ListPlus className="w-4 h-4 text-[#F36F21] flex-shrink-0" />
                <input
                  ref={newGroupRef}
                  type="text"
                  placeholder="Nom de la nouvelle liste..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitNewGroup(); if (e.key === 'Escape') setShowNewGroup(false); }}
                  className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21]"
                />
                <button type="button" onClick={submitNewGroup} className="px-3 py-1.5 text-sm font-medium text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#F36F21' }}>Creer</button>
                <button type="button" onClick={() => setShowNewGroup(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Empty state */}
            {filteredItems.length === 0 && !showNewGroup && (
              <div className="flex flex-col items-center justify-center py-16 text-center border-t border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <Clipboard className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-[#173D68] font-medium mb-1 text-sm">Aucun item dans ce tableau</p>
                <p className="text-xs text-gray-400">Utilisez « Ajouter une tache » sous une liste pour commencer</p>
                <button type="button" onClick={handleAddTaskList} className="mt-3 flex items-center gap-1.5 text-sm text-[#F36F21] hover:text-[#e05e15] font-medium">
                  <Plus className="w-3.5 h-3.5" /> Creer une liste
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {activeMenu && items.find((i) => i.id === activeMenu) && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[200px] animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 mb-0.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingItem(items.find((i) => i.id === activeMenu));
              setActiveMenu(null);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-[#F36F21]/5 hover:text-[#F36F21] transition-colors group/item"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover/item:bg-[#F36F21]/10 flex items-center justify-center transition-colors">
              <Edit2 className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-[#F36F21] transition-colors" />
            </div>
            <div>
              <span className="font-medium">Modifier</span>
              <p className="text-[10px] text-gray-400 group-hover/item:text-[#F36F21]/60">Ouvrir les details</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleDuplicateItem(activeMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-[#173D68]/5 hover:text-[#173D68] transition-colors group/item"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover/item:bg-[#173D68]/10 flex items-center justify-center transition-colors">
              <Copy className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-[#173D68] transition-colors" />
            </div>
            <div>
              <span className="font-medium">Dupliquer</span>
              <p className="text-[10px] text-gray-400 group-hover/item:text-[#173D68]/60">Creer une copie</p>
            </div>
          </button>
          <div className="border-t border-gray-100 my-1 mx-3" />
          <button
            type="button"
            onClick={() => handleDeleteItem(activeMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors group/item"
          >
            <div className="w-7 h-7 rounded-lg bg-red-50 group-hover/item:bg-red-100 flex items-center justify-center transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover/item:text-red-600 transition-colors" />
            </div>
            <div>
              <span className="font-medium">Supprimer</span>
              <p className="text-[10px] text-red-400 group-hover/item:text-red-500">Action irreversible</p>
            </div>
          </button>
        </div>
      )}

      {/* Group context menu */}
      {groupMenu && (
        <div
          data-group-menu
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[220px] animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ top: groupMenuPos.top, left: groupMenuPos.left }}
        >
          <div className="px-3 py-1.5 mb-0.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gestion de la liste</p>
          </div>
          <button
            type="button"
            onClick={() => startRenameGroup(groups.find(g => g.id === groupMenu))}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-[#F36F21]/5 hover:text-[#F36F21] transition-colors group/item"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover/item:bg-[#F36F21]/10 flex items-center justify-center transition-colors">
              <Type className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-[#F36F21]" />
            </div>
            <div><span className="font-medium">Renommer</span><p className="text-[10px] text-gray-400">Modifier le nom</p></div>
          </button>
          <button
            type="button"
            onClick={() => setColorPickerGroup(colorPickerGroup === groupMenu ? null : groupMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors group/item"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover/item:bg-purple-100 flex items-center justify-center transition-colors">
              <Palette className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-purple-600" />
            </div>
            <div className="flex-1"><span className="font-medium">Couleur</span><p className="text-[10px] text-gray-400">Changer la couleur</p></div>
            <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: groups.find(g => g.id === groupMenu)?.color || '#173D68' }} />
          </button>
          {colorPickerGroup === groupMenu && (
            <div className="px-3 py-2 border-t border-gray-100">
              <div className="grid grid-cols-5 gap-1.5">
                {GROUP_COLORS.map((c) => {
                  const isCurrent = (groups.find(g => g.id === groupMenu)?.color || '#173D68') === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChangeGroupColor(groupMenu, c)}
                      className={`w-7 h-7 rounded-lg transition-all ${isCurrent ? 'ring-2 ring-offset-1 ring-[#F36F21] scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    >
                      {isCurrent && <Check className="w-3 h-3 text-white mx-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="border-t border-gray-100 my-1 mx-3" />
          <button
            type="button"
            onClick={() => handleDeleteGroup(groupMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors group/item"
          >
            <div className="w-7 h-7 rounded-lg bg-red-50 group-hover/item:bg-red-100 flex items-center justify-center transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover/item:text-red-600" />
            </div>
            <div><span className="font-medium">Supprimer</span><p className="text-[10px] text-red-400">Les taches seront deplacees hors groupe</p></div>
          </button>
        </div>
      )}

      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        workspaceId={currentBoard?.workspaceId}
      />
    </>
  );
}
