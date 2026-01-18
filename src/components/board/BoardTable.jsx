import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Copy,
  Edit2,
  X,
} from "lucide-react";
import { useBoardStore } from "../../stores/boardStore";
import { itemApi } from "../../lib/api";
import ItemCell from "./cells/ItemCell";
import EditItemModal from "../modals/EditItemModal";
import toast from "react-hot-toast";

export default function BoardTable() {
  const {
    currentBoard,
    columns,
    groups,
    items,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    toggleGroupCollapse,
    addItem,
    deleteItem,
  } = useBoardStore();

  const [activeMenu, setActiveMenu] = useState(null);
  const [newItemName, setNewItemName] = useState({});
  const [showNewItem, setShowNewItem] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group items by group
  const groupedItems = useMemo(() => {
    const result = {};
    groups.forEach((group) => {
      result[group.id] = items
        .filter((item) => item.groupId === group.id)
        .sort((a, b) => a.position - b.position);
    });
    // Items without group
    result["ungrouped"] = items
      .filter((item) => !item.groupId)
      .sort((a, b) => a.position - b.position);
    return result;
  }, [groups, items]);

  const handleCreateItem = async (groupId) => {
    const name = newItemName[groupId];
    if (!name?.trim()) return;

    try {
      const response = await itemApi.create({
        boardId: currentBoard.id,
        groupId: groupId !== "ungrouped" ? groupId : null,
        name: name.trim(),
      });
      addItem(response.data);
      setNewItemName({ ...newItemName, [groupId]: "" });
      setShowNewItem({ ...showNewItem, [groupId]: false });
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await itemApi.delete(itemId);
      deleteItem(itemId);
      toast.success("Item supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
    setActiveMenu(null);
  };

  const handleDuplicateItem = async (itemId) => {
    try {
      const response = await itemApi.duplicate(itemId);
      addItem(response.data);
      toast.success("Item dupliqué");
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
    setActiveMenu(null);
  };

  const visibleColumns = columns.filter((col) => col.isVisible !== false);

  const renderItemRow = (item, groupId) => (
    <div
      key={item.id}
      className="board-row flex items-center group hover:bg-surface-800/30">
      <div className="w-10 flex-shrink-0 flex items-center justify-center">
        <GripVertical className="w-4 h-4 text-surface-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        <input
          type="checkbox"
          checked={selectedItems.includes(item.id)}
          onChange={() => toggleItemSelection(item.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500 cursor-pointer"
        />
      </div>
      <div
        className="flex-1 min-w-[200px] board-cell font-medium text-surface-200 cursor-pointer hover:text-primary-400 transition-colors truncate"
        onClick={() => setEditingItem(item)}>
        {item.name}
      </div>
      {visibleColumns.map((column) => (
        <div
          key={column.id}
          className="board-cell flex-shrink-0"
          style={{ width: column.width || 150 }}>
          <ItemCell
            item={item}
            column={column}
            value={item.values?.[column.id]}
          />
        </div>
      ))}
      <div
        className="w-12 flex-shrink-0 flex items-center justify-center"
        ref={activeMenu === item.id ? menuRef : null}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(activeMenu === item.id ? null : item.id);
          }}
          className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500 opacity-0 group-hover:opacity-100 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderContextMenu = (item) => {
    if (activeMenu !== item.id) return null;

    return (
      <div
        className="fixed z-50 bg-surface-800 border border-surface-700 rounded-xl shadow-xl py-2 min-w-[160px]"
        style={{
          top: menuRef.current?.getBoundingClientRect().bottom + 4 || 30,
          right: menuRef.current?.getBoundingClientRect().right || 30,
        }}>
        <button
          onClick={() => {
            setEditingItem(item);
            setActiveMenu(null);
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors">
          <Edit2 className="w-4 h-4" />
          <span>Modifier</span>
        </button>
        <button
          onClick={() => handleDuplicateItem(item.id)}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors">
          <Copy className="w-4 h-4" />
          <span>Dupliquer</span>
        </button>
        <div className="border-t border-surface-700 my-1" />
        <button
          onClick={() => handleDeleteItem(item.id)}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
          <Trash2 className="w-4 h-4" />
          <span>Supprimer</span>
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="card p-0 overflow-hidden flex flex-col h-full">
        {/* Scrollable container */}
        <div className="overflow-x-auto flex-1">
          <div className="min-w-max">
            {/* Table header */}
            <div className="board-header flex border-b border-surface-700 sticky top-0 bg-surface-900 z-10">
              <div className="w-10 flex-shrink-0" />
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    e.target.checked ? selectAllItems() : clearSelection()
                  }
                  checked={
                    selectedItems.length === items.length && items.length > 0
                  }
                  className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500 cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-[200px] board-header-cell font-semibold">
                Item
              </div>
              {visibleColumns.map((column) => (
                <div
                  key={column.id}
                  className="board-header-cell flex-shrink-0 font-semibold"
                  style={{ width: column.width || 150 }}>
                  {column.title}
                </div>
              ))}
              <div className="w-12 flex-shrink-0" />
            </div>

            {/* Groups */}
            {groups.map((group) => (
              <div
                key={group.id}
                className="border-b border-surface-800 last:border-0">
                {/* Group header */}
                <button
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="group-header w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-800/30 transition-colors"
                  style={{ borderLeftColor: group.color, borderLeftWidth: 4 }}>
                  {group.isCollapsed ? (
                    <ChevronRight className="w-5 h-5 text-surface-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-surface-500" />
                  )}
                  <span className="font-semibold text-surface-200">
                    {group.name}
                  </span>
                  <span className="text-sm text-surface-500 bg-surface-800 px-2 py-0.5 rounded-full">
                    {groupedItems[group.id]?.length || 0}
                  </span>
                </button>

                {/* Group items */}
                <AnimatePresence>
                  {!group.isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      {groupedItems[group.id]?.map((item) =>
                        renderItemRow(item, group.id)
                      )}

                      {/* Add item row */}
                      <div className="flex items-center px-4 py-2 border-t border-surface-800/50">
                        <div className="w-10 flex-shrink-0" />
                        <div className="w-8 flex-shrink-0" />
                        {showNewItem[group.id] ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Nom de l'item..."
                              value={newItemName[group.id] || ""}
                              onChange={(e) =>
                                setNewItemName({
                                  ...newItemName,
                                  [group.id]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleCreateItem(group.id);
                                if (e.key === "Escape")
                                  setShowNewItem({
                                    ...showNewItem,
                                    [group.id]: false,
                                  });
                              }}
                              autoFocus
                              className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-primary-500"
                            />
                            <button
                              onClick={() => handleCreateItem(group.id)}
                              className="btn btn-primary py-1.5 px-3 text-sm">
                              Ajouter
                            </button>
                            <button
                              onClick={() =>
                                setShowNewItem({
                                  ...showNewItem,
                                  [group.id]: false,
                                })
                              }
                              className="p-1.5 hover:bg-surface-700 rounded-lg text-surface-500">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setShowNewItem({
                                ...showNewItem,
                                [group.id]: true,
                              })
                            }
                            className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary-400 transition-colors">
                            <Plus className="w-4 h-4" />
                            <span>Ajouter un item</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Ungrouped items */}
            {groupedItems["ungrouped"]?.length > 0 && (
              <div className="border-t border-surface-700">
                <div className="flex items-center gap-3 px-4 py-3 bg-surface-800/20">
                  <span className="font-semibold text-surface-400">
                    Sans groupe
                  </span>
                  <span className="text-sm text-surface-500 bg-surface-800 px-2 py-0.5 rounded-full">
                    {groupedItems["ungrouped"].length}
                  </span>
                </div>
                {groupedItems["ungrouped"].map((item) =>
                  renderItemRow(item, "ungrouped")
                )}
              </div>
            )}

            {/* Empty state */}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-surface-400 mb-2">
                  Aucun item dans ce tableau
                </p>
                <p className="text-sm text-surface-500">
                  Cliquez sur "Ajouter un item" pour commencer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu - rendered at body level to avoid overflow issues */}
      {activeMenu &&
        items.find((i) => i.id === activeMenu) &&
        renderContextMenu(items.find((i) => i.id === activeMenu))}

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        workspaceId={currentBoard?.workspaceId}
      />
    </>
  );
}
