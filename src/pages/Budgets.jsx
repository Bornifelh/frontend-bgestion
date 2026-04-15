import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, Plus, TrendingUp, TrendingDown, DollarSign,
  Calendar, MoreHorizontal, Trash2, ArrowRight, X,
} from 'lucide-react';
import { budgetApi } from '../lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const currencySymbols = { XAF: 'FCFA', EUR: '€', USD: '$', GBP: '£' };

export default function Budgets() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', workspaceId],
    queryFn: async () => {
      const response = await budgetApi.getByWorkspace(workspaceId);
      return response.data;
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (budgetId) => budgetApi.delete(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets', workspaceId]);
      toast.success('Budget supprime');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  const handleDelete = (budgetId, e) => {
    e.stopPropagation();
    if (confirm('Etes-vous sur de vouloir supprimer ce budget ?')) {
      deleteBudgetMutation.mutate(budgetId);
    }
    setActiveMenu(null);
  };

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
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' FCFA';
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#173D68] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F36F21]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#F36F21]" />
            </div>
            Gestion des budgets
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-12">Suivez et gerez les budgets de vos projets</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#F36F21' }}>
          <Plus className="w-4 h-4" /> Nouveau budget
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#173D68]/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#173D68]" />
            </div>
            <span className="text-sm text-gray-500">Budget total</span>
          </div>
          <p className="text-2xl font-bold text-[#173D68]">{formatCurrency(totals.total)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-sm text-gray-500">Depense</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.spent)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm text-gray-500">Restant</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.remaining)}</p>
        </div>
      </div>

      {/* Budgets list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#F36F21]/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-[#F36F21]" />
          </div>
          <h3 className="text-lg font-semibold text-[#173D68] mb-2">Creez votre premier budget</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">Les budgets vous permettent de suivre les depenses et de controler les couts de vos projets.</p>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg mx-auto" style={{ backgroundColor: '#F36F21' }}>
            <Plus className="w-4 h-4" /> Creer un budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              onClick={() => navigate(`/workspace/${workspaceId}/budget/${budget.id}`)}
              className="bg-white rounded-xl p-5 border border-gray-200 cursor-pointer hover:border-[#F36F21]/40 hover:shadow-md transition-all group shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${budget.color}15` }}>
                    <Wallet className="w-5 h-5" style={{ color: budget.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#173D68] flex items-center gap-2">
                      {budget.name}
                      <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    {budget.description && (
                      <p className="text-sm text-gray-400 line-clamp-1">{budget.description}</p>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === budget.id ? null : budget.id); }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {activeMenu === budget.id && (
                    <div className="dropdown right-0 top-full mt-1">
                      <button onClick={(e) => handleDelete(budget.id, e)} className="dropdown-item text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">{formatCurrency(budget.spentAmount, budget.currency)} depense</span>
                  <span className="text-[#173D68] font-bold">{budget.percentUsed}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(budget.percentUsed, 100)}%`,
                      backgroundColor: budget.percentUsed > 90 ? '#ef4444' : budget.percentUsed > 75 ? '#F36F21' : budget.color,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Budget: {formatCurrency(budget.totalAmount, budget.currency)}</span>
                {budget.endDate && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(budget.endDate), 'd MMM yyyy', { locale: fr })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                <span>{budget.categoryCount} categories</span>
                <span>{budget.expenseCount} depenses</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateBudgetModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} workspaceId={workspaceId} />
    </div>
  );
}

function CreateBudgetModal({ isOpen, onClose, workspaceId }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', totalAmount: '', currency: 'XAF',
    startDate: '', endDate: '', color: '#F36F21',
  });

  const colors = ['#F36F21', '#173D68', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#22c55e', '#14b8a6', '#3b82f6'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.totalAmount) return;
    setIsLoading(true);
    try {
      await budgetApi.create({
        workspaceId, name: formData.name,
        description: formData.description || null,
        totalAmount: parseFloat(formData.totalAmount),
        currency: formData.currency,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        color: formData.color,
      });
      queryClient.invalidateQueries(['budgets', workspaceId]);
      toast.success('Budget cree avec succes');
      onClose();
      setFormData({ name: '', description: '', totalAmount: '', currency: 'XAF', startDate: '', endDate: '', color: '#F36F21' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la creation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-12 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F36F21]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#F36F21]" />
            </div>
            <h2 className="text-lg font-semibold text-[#173D68]">Nouveau budget</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du budget</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Marketing Q1" className="input" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400">(optionnel)</span></label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description du budget..." className="input resize-none h-20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant total</label>
              <input type="number" min="0" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} placeholder="10000" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise</label>
              <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="input">
                <option value="XAF">XAF (FCFA)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de debut</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de fin</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur</label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color} type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-[#173D68] scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
            <button type="submit" disabled={isLoading || !formData.name.trim() || !formData.totalAmount} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#F36F21' }}>
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Creer le budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
