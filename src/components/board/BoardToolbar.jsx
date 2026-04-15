import { useState, useRef, useEffect } from 'react';
import {
  Plus, Trash2, Download, FileSpreadsheet, FileText, ChevronDown,
  Zap, Filter, X, Search, Save, Star, BookmarkPlus, GitBranch,
} from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import { itemApi, exportApi, savedFilterApi, favoriteApi, templateApi } from '../../lib/api';
import CreateColumnModal from '../modals/CreateColumnModal';
import AutomationsModal from '../modals/AutomationsModal';
import WorkflowConfigModal from '../modals/WorkflowConfigModal';
import toast from 'react-hot-toast';

export default function BoardToolbar() {
  const {
    currentBoard, selectedItems, clearSelection, deleteItems,
    columns, setFilter, filter, isBoardFavorite, setIsBoardFavorite,
  } = useBoardStore();
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAutomations, setShowAutomations] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const exportMenuRef = useRef(null);
  const filterMenuRef = useRef(null);

  useEffect(() => {
    if (currentBoard?.id) {
      savedFilterApi.getByBoard(currentBoard.id).then(res => setSavedFilters(res.data || [])).catch(() => {});
    }
  }, [currentBoard?.id]);

  const toggleFavorite = async () => {
    if (!currentBoard?.id) return;
    try {
      if (isBoardFavorite) {
        await favoriteApi.remove('board', currentBoard.id);
        setIsBoardFavorite(false);
        toast.success('Retire des favoris');
      } else {
        await favoriteApi.add('board', currentBoard.id);
        setIsBoardFavorite(true);
        toast.success('Ajoute aux favoris');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleSaveFilter = async () => {
    if (!currentBoard?.id) return;
    const name = prompt('Nom du filtre :');
    if (!name) return;
    try {
      const { data } = await savedFilterApi.create({
        boardId: currentBoard.id, name,
        filters: { searchTerm, status: statusFilter, priority: priorityFilter },
        isShared: false,
      });
      setSavedFilters(prev => [data, ...prev]);
      toast.success('Filtre sauvegarde');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const applySavedFilter = (filter) => {
    const f = filter.filters || {};
    setSearchTerm(f.searchTerm || '');
    setStatusFilter(f.status || '');
    setPriorityFilter(f.priority || '');
    setShowSavedFilters(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setShowExportMenu(false);
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) setShowFilters(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (setFilter) setFilter({ searchTerm, status: statusFilter, priority: priorityFilter });
  }, [searchTerm, statusFilter, priorityFilter, setFilter]);

  const hasActiveFilters = searchTerm || statusFilter || priorityFilter;

  const clearFilters = () => { setSearchTerm(''); setStatusFilter(''); setPriorityFilter(''); };

  const statusColumn = columns?.find(c => c.type === 'status');
  const priorityColumn = columns?.find(c => c.type === 'priority');
  const statusOptions = statusColumn?.config?.options || [
    { value: 'todo', label: 'A faire', color: '#6b7280' },
    { value: 'in_progress', label: 'En cours', color: '#f59e0b' },
    { value: 'done', label: 'Termine', color: '#10b981' },
  ];
  const priorityOptions = priorityColumn?.config?.options || [
    { value: 'low', label: 'Basse', color: '#6b7280' },
    { value: 'medium', label: 'Moyenne', color: '#f59e0b' },
    { value: 'high', label: 'Haute', color: '#ef4444' },
    { value: 'critical', label: 'Critique', color: '#dc2626' },
  ];

  const handleDeleteSelected = async () => {
    if (!confirm(`Etes-vous sur de vouloir supprimer ${selectedItems.length} item(s) ?`)) return;
    try {
      await itemApi.batchDelete(selectedItems);
      deleteItems(selectedItems);
      clearSelection();
      toast.success(`${selectedItems.length} item(s) supprime(s)`);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = async (format) => {
    if (!currentBoard?.id || exporting) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      if (format === 'csv') {
        const response = await exportApi.board(currentBoard.id, 'csv');
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `${currentBoard.name}.csv`);
        toast.success('Export CSV telecharge');
      } else if (format === 'excel') {
        const { data } = await exportApi.board(currentBoard.id, 'json');
        const csv = convertToCSV(data.items);
        const blob = new Blob(['\ufeff' + csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        downloadBlob(blob, `${currentBoard.name}.xls`);
        toast.success('Export Excel telecharge');
      } else if (format === 'json') {
        const { data } = await exportApi.board(currentBoard.id, 'json');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${currentBoard.name}.json`);
        toast.success('Export JSON telecharge');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (items) => {
    if (!items || items.length === 0) return '';
    const headers = Object.keys(items[0]);
    const csvRows = [headers.join(',')];
    items.forEach(row => {
      const values = headers.map(h => {
        const val = (row[h] || '').toString().replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });
    return csvRows.join('\n');
  };

  return (
    <>
      <div className="relative flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 text-gray-700">
        {/* Search */}
        <div className="relative min-w-[140px] max-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 py-0 pl-8 pr-2 text-sm placeholder:text-gray-400 focus:border-[#F36F21] focus:outline-none focus:ring-1 focus:ring-[#F36F21]/30 focus:bg-white transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="relative flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2" ref={filterMenuRef}>
          <button
            id="board-toolbar-filter-btn"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 h-8 px-2.5 rounded-lg border text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'border-[#F36F21]/30 bg-[#F36F21]/5 text-[#F36F21]'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Filtres</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            {hasActiveFilters && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: '#F36F21' }}>
                {[searchTerm, statusFilter, priorityFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          <div className="hidden h-5 w-px bg-gray-200 sm:block" aria-hidden />

          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 max-w-[9rem] rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs focus:border-[#F36F21] focus:outline-none focus:ring-1 focus:ring-[#F36F21]/30 sm:max-w-[11rem] sm:text-sm"
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 max-w-[9rem] rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs focus:border-[#F36F21] focus:outline-none focus:ring-1 focus:ring-[#F36F21]/30 sm:max-w-[11rem] sm:text-sm"
            >
              <option value="">Toutes les priorites</option>
              {priorityOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>

          {showFilters && (
            <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-semibold text-[#173D68]">Filtres sauvegardes</h3>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="text-xs font-medium text-[#F36F21] hover:text-[#d45e1a]">Reinitialiser</button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button" onClick={handleSaveFilter} disabled={!hasActiveFilters}
                  className="flex items-center gap-1 text-xs font-medium text-[#F36F21] disabled:opacity-40"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" /> Sauvegarder
                </button>
                {savedFilters.length > 0 && (
                  <button type="button" onClick={() => setShowSavedFilters(!showSavedFilters)} className="text-xs text-gray-500 hover:text-[#173D68]">
                    Filtres sauvegardes ({savedFilters.length})
                  </button>
                )}
              </div>
              {showSavedFilters && savedFilters.length > 0 && (
                <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-2">
                  {savedFilters.map((sf) => (
                    <div key={sf.id} className="flex items-center gap-1 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50">
                      <button type="button" onClick={() => applySavedFilter(sf)} className="min-w-0 flex-1 px-2 py-1.5 text-left text-sm text-gray-600">{sf.name}</button>
                      <button
                        type="button"
                        onClick={async (e) => { e.stopPropagation(); await savedFilterApi.delete(sf.id); setSavedFilters((prev) => prev.filter((f) => f.id !== sf.id)); }}
                        className="shrink-0 p-1.5 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <button
            type="button" onClick={toggleFavorite}
            className={`flex items-center gap-1 h-8 rounded-lg border border-transparent px-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors ${isBoardFavorite ? 'text-yellow-500' : ''}`}
            title={isBoardFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star className={`h-4 w-4 ${isBoardFavorite ? 'fill-current' : ''}`} />
            <span className="hidden lg:inline">Favori</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!currentBoard?.id) return;
              const name = prompt('Nom du template :');
              if (!name) return;
              try {
                await templateApi.create({ boardId: currentBoard.id, name, description: `Template de ${currentBoard.name}` });
                toast.success('Template sauvegarde');
              } catch (error) { toast.error('Erreur lors de la sauvegarde'); }
            }}
            className="flex items-center gap-1 h-8 rounded-lg border border-transparent px-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Save className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">Template</span>
          </button>

          <button type="button" onClick={() => setShowWorkflow(true)} className="flex items-center gap-1 h-8 rounded-lg border border-transparent px-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            <GitBranch className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">Workflow</span>
          </button>

          <button type="button" onClick={() => setShowAutomations(true)} className="flex items-center gap-1 h-8 rounded-lg border border-transparent px-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            <Zap className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">Automations</span>
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              type="button" onClick={() => setShowExportMenu(!showExportMenu)} disabled={exporting}
              className="flex items-center gap-1 h-8 rounded-lg border border-transparent px-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-60 transition-colors"
            >
              {exporting ? (
                <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-[#F36F21]" />
              ) : (
                <Download className="h-4 w-4 shrink-0" />
              )}
              <span className="hidden sm:inline">Exporter</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                <button type="button" onClick={() => handleExport('csv')} className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
                  <FileText className="h-4 w-4 shrink-0 text-green-600" />
                  <div><p className="text-sm font-medium text-gray-700">CSV</p><p className="text-xs text-gray-400">Format universel</p></div>
                </button>
                <button type="button" onClick={() => handleExport('excel')} className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div><p className="text-sm font-medium text-gray-700">Excel</p><p className="text-xs text-gray-400">Compatible Microsoft Excel</p></div>
                </button>
                <button type="button" onClick={() => handleExport('json')} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
                  <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                  <div><p className="text-sm font-medium text-gray-700">JSON</p><p className="text-xs text-gray-400">Donnees brutes</p></div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button" onClick={() => setShowColumnModal(true)}
            className="flex items-center gap-1 h-8 shrink-0 rounded-lg px-3 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#F36F21' }}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Colonne</span>
          </button>
        </div>

        {/* Selection actions */}
        {selectedItems.length > 0 && (
          <div className="flex w-full basis-full items-center justify-between gap-2 rounded-lg border border-[#F36F21]/20 bg-[#F36F21]/5 px-3 py-2">
            <span className="text-xs font-semibold text-[#173D68] sm:text-sm">
              {selectedItems.length} selectionne(s)
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={handleDeleteSelected} className="flex items-center gap-1 h-7 px-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
              <button type="button" onClick={clearSelection} className="h-7 px-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Annuler</button>
            </div>
          </div>
        )}
      </div>

      <CreateColumnModal isOpen={showColumnModal} onClose={() => setShowColumnModal(false)} boardId={currentBoard?.id} />
      {showAutomations && currentBoard?.id && (
        <AutomationsModal boardId={currentBoard.id} onClose={() => setShowAutomations(false)} />
      )}
      <WorkflowConfigModal isOpen={showWorkflow} onClose={() => setShowWorkflow(false)} />
    </>
  );
}
