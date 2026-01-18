import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Receipt,
  Tag,
  Calendar,
  Building2,
  MoreHorizontal,
  Trash2,
  Edit,
  PieChart,
  X,
} from 'lucide-react';
import { budgetApi } from '../lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function BudgetDetails() {
  const { workspaceId, budgetId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // Fetch budget details
  const { data: budget, isLoading } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: async () => {
      const response = await budgetApi.getOne(budgetId);
      return response.data;
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId) => budgetApi.deleteExpense(budgetId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries(['budget', budgetId]);
      toast.success('Dépense supprimée');
    },
  });

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
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-400">Budget non trouvé</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/budgets`)}
          className="flex items-center gap-2 text-surface-400 hover:text-surface-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux budgets
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${budget.color}20` }}
            >
              <Wallet className="w-8 h-8" style={{ color: budget.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-surface-100">
                {budget.name}
              </h1>
              {budget.description && (
                <p className="text-surface-400 mt-1">{budget.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="btn btn-secondary"
            >
              <Tag className="w-4 h-4" />
              <span>Catégorie</span>
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Dépense</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-surface-400">Budget total</span>
          </div>
          <p className="text-2xl font-bold text-surface-100">
            {formatCurrency(budget.totalAmount, budget.currency)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-surface-400">Dépensé</span>
          </div>
          <p className="text-2xl font-bold text-surface-100">
            {formatCurrency(budget.spentAmount, budget.currency)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-surface-400">Restant</span>
          </div>
          <p className="text-2xl font-bold text-surface-100">
            {formatCurrency(budget.remainingAmount, budget.currency)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-surface-400">Utilisé</span>
          </div>
          <p className="text-2xl font-bold text-surface-100">
            {budget.percentUsed}%
          </p>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-surface-300">
            Progression du budget
          </span>
          <span className="text-sm text-surface-400">
            {formatCurrency(budget.spentAmount, budget.currency)} /{' '}
            {formatCurrency(budget.totalAmount, budget.currency)}
          </span>
        </div>
        <div className="h-4 bg-surface-700 rounded-full overflow-hidden">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Categories */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">
              Catégories
            </h2>
            {budget.categories.length === 0 ? (
              <p className="text-surface-500 text-sm py-4 text-center">
                Aucune catégorie
              </p>
            ) : (
              <div className="space-y-3">
                {budget.categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-surface-200">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-surface-300">
                      {formatCurrency(category.spentAmount, budget.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-100">
                Dépenses récentes
              </h2>
              <span className="text-sm text-surface-500">
                {budget.expenses.length} dépense(s)
              </span>
            </div>

            {budget.expenses.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500">Aucune dépense enregistrée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {budget.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 hover:bg-surface-800 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: expense.categoryColor
                            ? `${expense.categoryColor}20`
                            : 'rgb(51 65 85 / 0.5)',
                        }}
                      >
                        <Receipt
                          className="w-5 h-5"
                          style={{
                            color: expense.categoryColor || '#94a3b8',
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-surface-200">
                          {expense.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-surface-500">
                          {expense.categoryName && (
                            <span
                              className="px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${expense.categoryColor}20`,
                                color: expense.categoryColor,
                              }}
                            >
                              {expense.categoryName}
                            </span>
                          )}
                          {expense.vendor && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {expense.vendor}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(expense.expenseDate), 'd MMM yyyy', {
                              locale: fr,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-surface-100">
                        -{formatCurrency(expense.amount, budget.currency)}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === expense.id ? null : expense.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-surface-700 text-surface-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {activeMenu === expense.id && (
                          <div className="dropdown right-0 top-full mt-1">
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    'Supprimer cette dépense ?'
                                  )
                                ) {
                                  deleteExpenseMutation.mutate(expense.id);
                                }
                                setActiveMenu(null);
                              }}
                              className="dropdown-item text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        budget={budget}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        budgetId={budgetId}
      />
    </div>
  );
}

function AddExpenseModal({ isOpen, onClose, budget }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    vendor: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount) return;

    setIsLoading(true);
    try {
      await budgetApi.addExpense(budget.id, {
        description: formData.description,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || null,
        expenseDate: formData.expenseDate,
        vendor: formData.vendor || null,
        notes: formData.notes || null,
      });
      queryClient.invalidateQueries(['budget', budget.id]);
      toast.success('Dépense ajoutée');
      onClose();
      setFormData({
        description: '',
        amount: '',
        categoryId: '',
        expenseDate: format(new Date(), 'yyyy-MM-dd'),
        vendor: '',
        notes: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
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
              <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-surface-100">
                Nouvelle dépense
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
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ex: Achat de matériel"
                className="input"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Montant ({budget.currency})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expenseDate: e.target.value })
                  }
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Catégorie
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="input"
              >
                <option value="">Sans catégorie</option>
                {budget.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Fournisseur <span className="text-surface-500">(optionnel)</span>
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                placeholder="Ex: Amazon"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Notes <span className="text-surface-500">(optionnel)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Notes supplémentaires..."
                className="input resize-none h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.description.trim() || !formData.amount}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AddCategoryModal({ isOpen, onClose, budgetId }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    allocatedAmount: '',
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
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      await budgetApi.addCategory(budgetId, {
        name: formData.name,
        allocatedAmount: formData.allocatedAmount
          ? parseFloat(formData.allocatedAmount)
          : 0,
        color: formData.color,
      });
      queryClient.invalidateQueries(['budget', budgetId]);
      toast.success('Catégorie ajoutée');
      onClose();
      setFormData({ name: '', allocatedAmount: '', color: '#6366f1' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
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
          className="modal-content max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-surface-100">
                Nouvelle catégorie
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
                Nom de la catégorie
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Marketing"
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Budget alloué <span className="text-surface-500">(optionnel)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.allocatedAmount}
                onChange={(e) =>
                  setFormData({ ...formData, allocatedAmount: e.target.value })
                }
                placeholder="0"
                className="input"
              />
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
                disabled={isLoading || !formData.name.trim()}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
