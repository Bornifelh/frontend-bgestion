import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  Kanban,
  Calendar,
  BarChart3,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Zap,
  Filter,
  GanttChart,
  X,
  Search,
} from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import { itemApi, exportApi } from '../../lib/api';
import CreateColumnModal from '../modals/CreateColumnModal';
import AutomationsModal from '../modals/AutomationsModal';
import toast from 'react-hot-toast';

const viewOptions = [
  { id: 'table', label: 'Tableau', icon: Table },
  { id: 'kanban', label: 'Kanban', icon: Kanban },
  { id: 'calendar', label: 'Calendrier', icon: Calendar },
  { id: 'timeline', label: 'Timeline', icon: GanttChart },
  { id: 'chart', label: 'Graphiques', icon: BarChart3 },
];

export default function BoardToolbar() {
  const {
    currentBoard,
    activeView,
    setActiveView,
    selectedItems,
    clearSelection,
    deleteItems,
    columns,
    setFilter,
    filter,
  } = useBoardStore();
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAutomations, setShowAutomations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const exportMenuRef = useRef(null);
  const filterMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply filters
  useEffect(() => {
    if (setFilter) {
      setFilter({ searchTerm, status: statusFilter, priority: priorityFilter });
    }
  }, [searchTerm, statusFilter, priorityFilter, setFilter]);

  const hasActiveFilters = searchTerm || statusFilter || priorityFilter;

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  // Get unique values for filters
  const statusColumn = columns?.find(c => c.type === 'status');
  const priorityColumn = columns?.find(c => c.type === 'priority');
  const statusOptions = statusColumn?.config?.options || [
    { value: 'todo', label: 'À faire', color: '#6b7280' },
    { value: 'in_progress', label: 'En cours', color: '#f59e0b' },
    { value: 'done', label: 'Terminé', color: '#10b981' },
  ];
  const priorityOptions = priorityColumn?.config?.options || [
    { value: 'low', label: 'Basse', color: '#6b7280' },
    { value: 'medium', label: 'Moyenne', color: '#f59e0b' },
    { value: 'high', label: 'Haute', color: '#ef4444' },
    { value: 'critical', label: 'Critique', color: '#dc2626' },
  ];

  const handleDeleteSelected = async () => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer ${selectedItems.length} item(s) ?`
      )
    )
      return;

    try {
      await itemApi.batchDelete(selectedItems);
      deleteItems(selectedItems);
      clearSelection();
      toast.success(`${selectedItems.length} item(s) supprimé(s)`);
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
        toast.success('Export CSV téléchargé');
      } else if (format === 'excel') {
        // For Excel, we'll export as CSV with .xls extension (simple compatibility)
        const { data } = await exportApi.board(currentBoard.id, 'json');
        const csv = convertToCSV(data.items);
        const blob = new Blob(['\ufeff' + csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        downloadBlob(blob, `${currentBoard.name}.xls`);
        toast.success('Export Excel téléchargé');
      } else if (format === 'json') {
        const { data } = await exportApi.board(currentBoard.id, 'json');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${currentBoard.name}.json`);
        toast.success('Export JSON téléchargé');
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
      <div className="flex items-center justify-between">
        {/* View tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface-800/50 rounded-xl">
          {viewOptions.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === view.id
                  ? 'bg-surface-700 text-surface-100'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <view.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-2 bg-surface-800/50 border border-surface-700 rounded-lg text-sm text-surface-200 placeholder-surface-500 focus:border-primary-500 focus:outline-none w-40 md:w-56"
            />
          </div>

          {/* Filters */}
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-ghost ${hasActiveFilters ? 'text-primary-400 bg-primary-500/10' : ''}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtres</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                  {[searchTerm, statusFilter, priorityFilter].filter(Boolean).length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-50 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-surface-200">Filtres avancés</h3>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-xs text-primary-400 hover:text-primary-300">
                        Réinitialiser
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Statut</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="input w-full text-sm"
                    >
                      <option value="">Tous les statuts</option>
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Priorité</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="input w-full text-sm"
                    >
                      <option value="">Toutes les priorités</option>
                      {priorityOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Automations */}
          <button onClick={() => setShowAutomations(true)} className="btn btn-ghost">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Automations</span>
          </button>

          {/* Selection actions */}
          {selectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-2 bg-surface-800 rounded-xl"
            >
              <span className="text-sm text-surface-300">
                {selectedItems.length} sélectionné(s)
              </span>
              <button
                onClick={handleDeleteSelected}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-surface-400 hover:text-surface-200"
              >
                Annuler
              </button>
            </motion.div>
          )}

          {/* Export button */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="btn btn-ghost"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Exporter</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-700 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-surface-200 text-sm font-medium">CSV</p>
                      <p className="text-surface-500 text-xs">Format universel</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-700 transition-colors text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-surface-200 text-sm font-medium">Excel</p>
                      <p className="text-surface-500 text-xs">Compatible Microsoft Excel</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-700 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-surface-200 text-sm font-medium">JSON</p>
                      <p className="text-surface-500 text-xs">Données brutes</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add column */}
          <button
            onClick={() => setShowColumnModal(true)}
            className="btn btn-secondary"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Colonne</span>
          </button>
        </div>
      </div>

      <CreateColumnModal
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        boardId={currentBoard?.id}
      />

      <AnimatePresence>
        {showAutomations && currentBoard?.id && (
          <AutomationsModal
            boardId={currentBoard.id}
            onClose={() => setShowAutomations(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
