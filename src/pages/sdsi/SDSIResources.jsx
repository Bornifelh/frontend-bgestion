import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, User, Cpu, Package, Building2, Search, ArrowLeft,
  Edit2, Trash2, X, Mail, Phone, Briefcase, DollarSign, Percent,
  Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { sdsiApi } from '../../lib/api';
import toast from 'react-hot-toast';

const typeConfig = {
  human: { label: 'Humaine', color: 'bg-blue-500', icon: User },
  technical: { label: 'Technique', color: 'bg-purple-500', icon: Cpu },
  material: { label: 'Matérielle', color: 'bg-amber-500', icon: Package },
  external: { label: 'Externe', color: 'bg-emerald-500', icon: Building2 },
};

const formatCurrency = (amount, currency = 'XAF') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function SDSIResources() {
  const { workspaceId } = useParams();
  const [resources, setResources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [expandedResource, setExpandedResource] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'human',
    description: '',
    capacity: 100,
    unit: '%',
    costPerUnit: '',
    currency: 'XAF',
    skills: '',
    email: '',
    phone: '',
    department: '',
  });

  const [allocationData, setAllocationData] = useState({
    projectId: '',
    percentage: 50,
    startDate: '',
    endDate: '',
    role: '',
  });

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [resourcesRes, projectsRes] = await Promise.all([
        sdsiApi.getResources(workspaceId),
        sdsiApi.getProjects(workspaceId),
      ]);
      setResources(resourcesRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllocations = async (resourceId) => {
    try {
      const res = await sdsiApi.getResourceAllocations(resourceId);
      return res.data;
    } catch (error) {
      toast.error('Erreur lors du chargement des allocations');
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        workspaceId,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : null,
      };
      
      if (editingResource) {
        await sdsiApi.updateResource(editingResource.id, data);
        toast.success('Ressource mise à jour');
      } else {
        await sdsiApi.createResource(data);
        toast.success('Ressource créée');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    try {
      await sdsiApi.createAllocation(selectedResource.id, allocationData);
      toast.success('Allocation créée');
      setShowAllocationModal(false);
      resetAllocationForm();
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'allocation');
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      description: resource.description || '',
      capacity: resource.capacity || 100,
      unit: resource.unit || '%',
      costPerUnit: resource.costPerUnit || '',
      currency: resource.currency || 'XAF',
      skills: Array.isArray(resource.skills) ? resource.skills.join(', ') : '',
      email: resource.email || '',
      phone: resource.phone || '',
      department: resource.department || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Supprimer cette ressource ?')) return;
    try {
      await sdsiApi.deleteResource(resourceId);
      toast.success('Ressource supprimée');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteAllocation = async (allocationId) => {
    if (!confirm('Supprimer cette allocation ?')) return;
    try {
      await sdsiApi.deleteAllocation(allocationId);
      toast.success('Allocation supprimée');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const toggleExpand = async (resource) => {
    if (expandedResource === resource.id) {
      setExpandedResource(null);
    } else {
      const allocations = await loadAllocations(resource.id);
      setResources(prev => prev.map(r => 
        r.id === resource.id ? { ...r, allocations } : r
      ));
      setExpandedResource(resource.id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'human',
      description: '',
      capacity: 100,
      unit: '%',
      costPerUnit: '',
      currency: 'XAF',
      skills: '',
      email: '',
      phone: '',
      department: '',
    });
    setEditingResource(null);
  };

  const resetAllocationForm = () => {
    setAllocationData({
      projectId: '',
      percentage: 50,
      startDate: '',
      endDate: '',
      role: '',
    });
    setSelectedResource(null);
  };

  const openAllocationModal = (resource) => {
    setSelectedResource(resource);
    setShowAllocationModal(true);
  };

  const filteredResources = resources.filter(r => {
    const matchesType = !filterType || r.type === filterType;
    const matchesSearch = !searchTerm || 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group by type
  const groupedResources = filteredResources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {});

  const stats = {
    total: resources.length,
    human: resources.filter(r => r.type === 'human').length,
    technical: resources.filter(r => r.type === 'technical').length,
    overAllocated: resources.filter(r => r.currentAllocation > 100).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/workspace/${workspaceId}/sdsi`}
            className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-100 flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-500" />
              Gestion des Ressources
            </h1>
            <p className="text-surface-400 mt-1">
              Gérez et allouez vos ressources aux projets
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Nouvelle ressource
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-surface-400">Total</span>
            <Users className="w-5 h-5 text-surface-500" />
          </div>
          <p className="text-2xl font-bold text-surface-100 mt-2">{stats.total}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-surface-400">Humaines</span>
            <User className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">{stats.human}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-surface-400">Techniques</span>
            <Cpu className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-2">{stats.technical}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-surface-400">Sur-allouées</span>
            <Percent className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">{stats.overAllocated}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une ressource..."
            className="input pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input w-56"
        >
          <option value="">Tous les types</option>
          {Object.entries(typeConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Resources by Type */}
      <div className="space-y-6">
        {Object.entries(groupedResources).map(([type, typeResources]) => {
          const config = typeConfig[type];
          const TypeIcon = config?.icon || User;
          
          return (
            <div key={type} className="space-y-3">
              <h3 className="text-lg font-semibold text-surface-200 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${config?.color} flex items-center justify-center`}>
                  <TypeIcon className="w-4 h-4 text-white" />
                </div>
                Ressources {config?.label}s ({typeResources.length})
              </h3>
              
              <div className="grid gap-3">
                {typeResources.map((resource, index) => {
                  const isExpanded = expandedResource === resource.id;
                  const allocationPercent = resource.currentAllocation || 0;
                  const isOverAllocated = allocationPercent > 100;
                  
                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="card overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar/Icon */}
                          <div className={`w-12 h-12 rounded-xl ${config?.color} flex items-center justify-center`}>
                            <TypeIcon className="w-6 h-6 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-surface-100">{resource.name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-surface-400">
                              {resource.department && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {resource.department}
                                </span>
                              )}
                              {resource.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {resource.email}
                                </span>
                              )}
                              {resource.costPerUnit && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(resource.costPerUnit, resource.currency)}/{resource.unit}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Allocation bar */}
                          <div className="w-40">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-surface-400">Allocation</span>
                              <span className={isOverAllocated ? 'text-red-400' : 'text-surface-300'}>
                                {allocationPercent.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOverAllocated ? 'bg-red-500' : 
                                  allocationPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(allocationPercent, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openAllocationModal(resource)}
                              className="btn btn-sm btn-secondary"
                            >
                              <Plus className="w-3 h-3" />
                              Allouer
                            </button>
                            <button
                              onClick={() => toggleExpand(resource)}
                              className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-surface-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-surface-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(resource)}
                              className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-surface-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(resource.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {/* Skills */}
                        {Array.isArray(resource.skills) && resource.skills.length > 0 && (
                          <div className="flex items-center gap-2 mt-3 pl-16">
                            {resource.skills.map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-surface-700 text-surface-300 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expanded allocations */}
                      <AnimatePresence>
                        {isExpanded && resource.allocations && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-surface-700"
                          >
                            <div className="p-4 bg-surface-800/50">
                              <h5 className="text-sm font-medium text-surface-300 mb-3">
                                Allocations actives ({resource.allocations.length})
                              </h5>
                              {resource.allocations.length > 0 ? (
                                <div className="space-y-2">
                                  {resource.allocations.map(alloc => (
                                    <div
                                      key={alloc.id}
                                      className="flex items-center justify-between p-3 bg-surface-800 rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                          <Briefcase className="w-4 h-4 text-primary-400" />
                                        </div>
                                        <div>
                                          <span className="text-surface-200 font-medium">
                                            {alloc.projectCode} - {alloc.projectName}
                                          </span>
                                          {alloc.role && (
                                            <p className="text-xs text-surface-500">{alloc.role}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-primary-400 font-medium">
                                          {alloc.percentage}%
                                        </span>
                                        {alloc.startDate && (
                                          <span className="text-xs text-surface-500">
                                            {new Date(alloc.startDate).toLocaleDateString('fr-FR')}
                                            {alloc.endDate && ` → ${new Date(alloc.endDate).toLocaleDateString('fr-FR')}`}
                                          </span>
                                        )}
                                        <button
                                          onClick={() => handleDeleteAllocation(alloc.id)}
                                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3 text-red-400" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-surface-500">Aucune allocation</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.keys(groupedResources).length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-surface-300 mb-2">Aucune ressource</h3>
            <p className="text-surface-500 mb-4">Ajoutez vos premières ressources</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Ajouter une ressource
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Resource Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-900 rounded-2xl border border-surface-700 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-surface-700 sticky top-0 bg-surface-900">
                <h2 className="text-xl font-display font-bold text-surface-100">
                  {editingResource ? 'Modifier la ressource' : 'Nouvelle ressource'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="Ex: Jean Dupont"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input"
                      required
                    >
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[60px]"
                    placeholder="Description de la ressource..."
                  />
                </div>

                {formData.type === 'human' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="input"
                          placeholder="email@exemple.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                          Téléphone
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="input"
                          placeholder="+237 6XX XXX XXX"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-2">
                        Département
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="input"
                        placeholder="Ex: DSI, RH, Finance..."
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Capacité
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="input"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Unité
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="input"
                    >
                      <option value="%">Pourcentage (%)</option>
                      <option value="h">Heures (h)</option>
                      <option value="j">Jours (j)</option>
                      <option value="u">Unités (u)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Coût par unité
                    </label>
                    <input
                      type="number"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Devise
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="input"
                    >
                      <option value="XAF">XAF (FCFA)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Compétences (séparées par des virgules)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="input"
                    placeholder="Ex: Java, React, Management..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingResource ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Allocation Modal */}
      <AnimatePresence>
        {showAllocationModal && selectedResource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-900 rounded-2xl border border-surface-700 w-full max-w-md"
            >
              <div className="flex items-center justify-between p-6 border-b border-surface-700">
                <div>
                  <h2 className="text-xl font-display font-bold text-surface-100">
                    Allouer la ressource
                  </h2>
                  <p className="text-sm text-surface-400 mt-1">{selectedResource.name}</p>
                </div>
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAllocationSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Projet *
                  </label>
                  <select
                    value={allocationData.projectId}
                    onChange={(e) => setAllocationData({ ...allocationData, projectId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Sélectionner un projet</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Pourcentage d'allocation: {allocationData.percentage}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={allocationData.percentage}
                    onChange={(e) => setAllocationData({ ...allocationData, percentage: parseInt(e.target.value) })}
                    className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between text-xs text-surface-500 mt-1">
                    <span>5%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Rôle sur le projet
                  </label>
                  <input
                    type="text"
                    value={allocationData.role}
                    onChange={(e) => setAllocationData({ ...allocationData, role: e.target.value })}
                    className="input"
                    placeholder="Ex: Chef de projet, Développeur..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={allocationData.startDate}
                      onChange={(e) => setAllocationData({ ...allocationData, startDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={allocationData.endDate}
                      onChange={(e) => setAllocationData({ ...allocationData, endDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAllocationModal(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Allouer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
