import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit,
  PieChart,
  ArrowRight,
  X,
} from 'lucide-react';
import { budgetApi } from '../lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const currencySymbols = {
  XAF: 'FCFA',
  EUR: '€',
  USD: '$',
  GBP: '£',
};

export default function Budgets() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // Fetch budgets
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', workspaceId],
    queryFn: async () => {
      const response = await budgetApi.getByWorkspace(workspaceId);
      return response.data;
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: (budgetId) => budgetApi.delete(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets', workspaceId]);
      toast.success('Budget supprimé');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  const handleDelete = (budgetId, e) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
      deleteBudgetMutation.mutate(budgetId);
    }
    setActiveMenu(null);
  };

  // Calculate totals
  const totals = budgets.reduce(
    (acc, b) => ({
      total: acc.total + b.totalAmount,
      spent: acc.spent + b.spentAmount,
      remaining: acc.remaining + b.remainingAmount,
    }),
    { total: 0, spent: 0, remaining: 0 }
  );

  const formatCurrency = (amount, currency = 'XAF') => {
    if (currency === 'XAF') {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + ' FCFA';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-100 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary-400" />
            Gestion des budgets
          </h1>
          <p className="text-surface-400 mt-1">
            Suivez et gérez les budgets de vos projets
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau budget</span>
        </button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-surface-100">
            {formatCurrency(totals.total)}
          </p>
          <p className="text-sm text-surface-400">Budget total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-surface-100">
            {formatCurrency(totals.spent)}
          </p>
          <p className="text-sm text-surface-400">Dépensé</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-surface-100">
            {formatCurrency(totals.remaining)}
          </p>
          <p className="text-sm text-surface-400">Restant</p>
        </motion.div>
      </div>

      {/* Budgets list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-xl font-display font-semibold text-surface-100 mb-2">
            Créez votre premier budget
          </h3>
          <p className="text-surface-400 max-w-md mx-auto mb-6">
            Les budgets vous permettent de suivre les dépenses et de contrôler
            les coûts de vos projets.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un budget</span>
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget, index) => (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/workspace/${workspaceId}/budget/${budget.id}`)}
              className="card p-6 cursor-pointer hover:border-primary-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${budget.color}20` }}
                  >
                    <Wallet className="w-6 h-6" style={{ color: budget.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                      {budget.name}
                      <ArrowRight className="w-4 h-4 text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    {budget.description && (
                      <p className="text-sm text-surface-500 line-clamp-1">
                        {budget.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === budget.id ? null : budget.id);
                    }}
                    className="p-2 rounded-lg hover:bg-surface-700 text-surface-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {activeMenu === budget.id && (
                    <div className="dropdown right-0 top-full mt-1">
                      <button
                        onClick={(e) => handleDelete(budget.id, e)}
                        className="dropdown-item text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-surface-400">
                    {formatCurrency(budget.spentAmount, budget.currency)} dépensé
                  </span>
                  <span className="text-surface-300 font-medium">
                    {budget.percentUsed}%
                  </span>
                </div>
                <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(budget.percentUsed, 100)}%`,
                      backgroundColor:
                        budget.percentUsed > 90
                          ? '#ef4444'
                          : budget.percentUsed > 75
                          ? '#f97316'
                          : budget.color,
                    }}
                  />
                </div>
              </div>

              {/* Budget info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-400">
                  Budget: {formatCurrency(budget.totalAmount, budget.currency)}
                </span>
                {budget.endDate && (
                  <span className="flex items-center gap-1 text-surface-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(budget.endDate), 'd MMM yyyy', { locale: fr })}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-700/50 text-xs text-surface-500">
                <span>{budget.categoryCount} catégories</span>
                <span>{budget.expenseCount} dépenses</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      <CreateBudgetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}

function CreateBudgetModal({ isOpen, onClose, workspaceId }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalAmount: '',
    currency: 'XAF',
    startDate: '',
    endDate: '',
    color: '#6366f1',
  });

  const colors = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
    '#3b82f6',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.totalAmount) return;

    setIsLoading(true);
    try {
      await budgetApi.create({
        workspaceId,
        name: formData.name,
        description: formData.description || null,
        totalAmount: parseFloat(formData.totalAmount),
        currency: formData.currency,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        color: formData.color,
      });
      queryClient.invalidateQueries(['budgets', workspaceId]);
      toast.success('Budget créé avec succès');
      onClose();
      setFormData({
        name: '',
        description: '',
        totalAmount: '',
        currency: 'XAF',
        startDate: '',
        endDate: '',
        color: '#6366f1',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-surface-100">
                Nouveau budget
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Nom du budget
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Marketing Q1"
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Description <span className="text-surface-500">(optionnel)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du budget..."
                className="input resize-none h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Montant total
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: e.target.value })
                  }
                  placeholder="10000"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Devise
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="input"
                >
                  <option value="XAF">XAF (FCFA)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Couleur
              </label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-offset-surface-900 ring-white scale-110'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim() || !formData.totalAmount}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Créer le budget'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
