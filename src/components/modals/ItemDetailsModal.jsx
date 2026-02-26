import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, Trash2, MessageSquare, CheckSquare, Activity, Paperclip,
  Clock, User, Calendar, Send, MoreHorizontal, ChevronDown, ChevronRight,
  Plus, GripVertical, Check, Edit2, Reply, Eye, EyeOff, Link2, Play, Square,
  Timer, Search, ArrowRightLeft, AtSign
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { itemApi, commentApi, subtaskApi, activityApi, timeEntryApi, watcherApi, dependencyApi, searchApi, memberApi } from '../../lib/api';
import { useBoardStore } from '../../stores/boardStore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ItemDetailsModal({ isOpen, onClose, item }) {
  const { columns, groups, updateItem, updateItemValue, deleteItem } = useBoardStore();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', groupId: '', values: {} });
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  
  // Subtasks state
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [subtaskProgress, setSubtaskProgress] = useState({ total: 0, completed: 0, progress: 0 });
  
  // Activity state
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  
  // Time tracking state
  const [timeEntries, setTimeEntries] = useState([]);
  const [loadingTime, setLoadingTime] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timeDescription, setTimeDescription] = useState('');
  
  // Watchers state
  const [isWatching, setIsWatching] = useState(false);
  const [watcherCount, setWatcherCount] = useState(0);
  
  // Dependencies state
  const [dependencies, setDependencies] = useState({ blocking: [], blockedBy: [], related: [] });
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [depSearchTerm, setDepSearchTerm] = useState('');
  const [depSearchResults, setDepSearchResults] = useState([]);
  const [depType, setDepType] = useState('finish_to_start');
  const [searchingDeps, setSearchingDeps] = useState(false);
  
  // @Mentions state
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionResults, setMentionResults] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        groupId: item.groupId || '',
        values: { ...item.values } || {},
      });
      loadComments();
      loadSubtasks();
      loadWatcherStatus();
      loadWorkspaceMembers();
    }
  }, [item]);
  
  // Timer interval
  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.start_time).getTime()) / 1000);
        setTimerElapsed(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const loadComments = async () => {
    if (!item) return;
    setLoadingComments(true);
    try {
      const { data } = await commentApi.getByItem(item.id);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadSubtasks = async () => {
    if (!item) return;
    setLoadingSubtasks(true);
    try {
      const [subtasksRes, progressRes] = await Promise.all([
        subtaskApi.getByItem(item.id),
        subtaskApi.getProgress(item.id),
      ]);
      setSubtasks(subtasksRes.data);
      setSubtaskProgress(progressRes.data);
    } catch (error) {
      console.error('Error loading subtasks:', error);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  const loadActivities = async () => {
    if (!item || activities.length > 0) return;
    setLoadingActivities(true);
    try {
      const { data } = await activityApi.getByItem(item.id);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };
  
  const loadTimeEntries = async () => {
    if (!item) return;
    setLoadingTime(true);
    try {
      const [entriesRes, activeRes] = await Promise.all([
        timeEntryApi.getByItem(item.id),
        timeEntryApi.getActive(),
      ]);
      setTimeEntries(entriesRes.data);
      if (activeRes.data && activeRes.data.item_id === item.id) {
        setActiveTimer(activeRes.data);
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
    } finally {
      setLoadingTime(false);
    }
  };
  
  const loadWatcherStatus = async () => {
    if (!item) return;
    try {
      const [watchingRes, watchersRes] = await Promise.all([
        watcherApi.isWatching(item.id),
        watcherApi.getWatchers(item.id),
      ]);
      setIsWatching(watchingRes.data.watching);
      setWatcherCount(watchersRes.data.length);
    } catch (error) {
      console.error('Error loading watcher status:', error);
    }
  };
  
  const loadDependencies = async () => {
    if (!item) return;
    setLoadingDeps(true);
    try {
      const { data } = await dependencyApi.getByItem(item.id);
      setDependencies(data);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    } finally {
      setLoadingDeps(false);
    }
  };
  
  const loadWorkspaceMembers = async () => {
    try {
      const board = useBoardStore.getState().currentBoard;
      if (board?.workspaceId) {
        const { data } = await memberApi.getByWorkspace(board.workspaceId);
        setWorkspaceMembers(data || []);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };
  
  const handleSearchDependency = async (term) => {
    setDepSearchTerm(term);
    if (term.length < 2) {
      setDepSearchResults([]);
      return;
    }
    setSearchingDeps(true);
    try {
      const { data } = await searchApi.quick({ q: term, type: 'items' });
      setDepSearchResults((data || []).filter(r => r.id !== item.id).slice(0, 8));
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearchingDeps(false);
    }
  };
  
  const handleCreateDependency = async (targetItemId) => {
    try {
      await dependencyApi.create({
        itemId: item.id,
        dependsOnId: targetItemId,
        dependencyType: depType,
      });
      setDepSearchTerm('');
      setDepSearchResults([]);
      loadDependencies();
      toast.success('Dépendance créée');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    }
  };
  
  const handleCommentInput = (e) => {
    const value = e.target.value;
    setNewComment(value);
    
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const search = mentionMatch[1].toLowerCase();
      setMentionSearch(search);
      const filtered = workspaceMembers.filter(m => {
        const name = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
        return name.includes(search);
      }).slice(0, 5);
      setMentionResults(filtered);
      setShowMentions(filtered.length > 0);
    } else {
      setShowMentions(false);
    }
  };
  
  const insertMention = (member) => {
    const name = `${member.firstName} ${member.lastName}`;
    const mentionRegex = /@\w*$/;
    const newValue = newComment.replace(mentionRegex, `@${name} `);
    setNewComment(newValue);
    setShowMentions(false);
  };

  const handleToggleWatch = async () => {
    try {
      if (isWatching) {
        await watcherApi.unwatch(item.id);
        setIsWatching(false);
        setWatcherCount(prev => prev - 1);
      } else {
        await watcherApi.watch(item.id);
        setIsWatching(true);
        setWatcherCount(prev => prev + 1);
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };
  
  const handleStartTimer = async () => {
    try {
      const { data } = await timeEntryApi.create({ itemId: item.id, description: timeDescription || null });
      setActiveTimer(data);
      setTimerElapsed(0);
      setTimeDescription('');
      toast.success('Chronomètre démarré');
    } catch (error) {
      toast.error('Erreur');
    }
  };
  
  const handleStopTimer = async () => {
    try {
      const { data } = await timeEntryApi.stop();
      setActiveTimer(null);
      setTimerElapsed(0);
      setTimeEntries(prev => [data, ...prev]);
      toast.success('Temps enregistré');
    } catch (error) {
      toast.error('Erreur');
    }
  };
  
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const formatMinutes = (minutes) => {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !item || isLoading) return;
    setIsLoading(true);
    try {
      await itemApi.update(item.id, {
        name: formData.name.trim(),
        groupId: formData.groupId || null,
      });

      const updatePromises = [];
      for (const [columnId, value] of Object.entries(formData.values)) {
        if (item.values?.[columnId] !== value) {
          updatePromises.push(itemApi.updateValue(item.id, columnId, value));
        }
      }
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      updateItem(item.id, {
        name: formData.name.trim(),
        groupId: formData.groupId || null,
        values: formData.values,
      });

      toast.success('Item modifié');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await commentApi.create({
        itemId: item.id,
        content: newComment.trim(),
        parentId: replyTo?.id || null,
      });
      
      if (replyTo) {
        setComments(prev => prev.map(c => 
          c.id === replyTo.id 
            ? { ...c, replies: [...(c.replies || []), data] }
            : c
        ));
        setReplyTo(null);
      } else {
        setComments(prev => [data, ...prev]);
      }
      setNewComment('');
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const { data } = await subtaskApi.create({
        itemId: item.id,
        name: newSubtask.trim(),
      });
      setSubtasks(prev => [...prev, data]);
      setSubtaskProgress(prev => ({
        ...prev,
        total: prev.total + 1,
        progress: Math.round((prev.completed / (prev.total + 1)) * 100),
      }));
      setNewSubtask('');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleToggleSubtask = async (subtask) => {
    try {
      const { data } = await subtaskApi.toggle(subtask.id);
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? data : s));
      setSubtaskProgress(prev => ({
        ...prev,
        completed: data.isCompleted ? prev.completed + 1 : prev.completed - 1,
        progress: Math.round(((data.isCompleted ? prev.completed + 1 : prev.completed - 1) / prev.total) * 100),
      }));
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await subtaskApi.delete(subtaskId);
      const deleted = subtasks.find(s => s.id === subtaskId);
      setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
      setSubtaskProgress(prev => ({
        total: prev.total - 1,
        completed: deleted?.isCompleted ? prev.completed - 1 : prev.completed,
        progress: prev.total > 1 ? Math.round(((deleted?.isCompleted ? prev.completed - 1 : prev.completed) / (prev.total - 1)) * 100) : 0,
      }));
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (!isOpen || !item) return null;

  const tabs = [
    { id: 'details', label: 'Détails', icon: Edit2 },
    { id: 'subtasks', label: `Checklist (${subtaskProgress.completed}/${subtaskProgress.total})`, icon: CheckSquare },
    { id: 'comments', label: `Commentaires (${comments.length})`, icon: MessageSquare },
    { id: 'time', label: 'Temps', icon: Timer },
    { id: 'dependencies', label: 'Dépendances', icon: Link2 },
    { id: 'activity', label: 'Activité', icon: Activity },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface-900 rounded-2xl w-full max-w-4xl shadow-2xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-surface-700">
            <div className="flex-1 mr-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xl font-semibold text-surface-100 bg-transparent border-none outline-none w-full hover:bg-surface-800/50 focus:bg-surface-800 px-2 py-1 -ml-2 rounded-lg transition-colors"
                placeholder="Nom de l'item..."
              />
              {groups.length > 0 && (
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="mt-2 text-sm text-surface-400 bg-transparent border-none outline-none cursor-pointer hover:text-surface-300"
                >
                  <option value="">Sans groupe</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleWatch}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isWatching ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-surface-700 text-surface-400'
                }`}
                title={isWatching ? 'Ne plus observer' : 'Observer'}
              >
                {isWatching ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {watcherCount > 0 && <span>{watcherCount}</span>}
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-700 text-surface-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-surface-700 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'activity') loadActivities();
                  if (tab.id === 'time') loadTimeEntries();
                  if (tab.id === 'dependencies') loadDependencies();
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-surface-400 hover:text-surface-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="grid grid-cols-2 gap-4">
                {columns.map((column) => (
                  <div key={column.id} className="space-y-2">
                    <label className="text-sm font-medium text-surface-400">{column.title}</label>
                    {renderColumnInput(column, formData, setFormData)}
                  </div>
                ))}
              </div>
            )}

            {/* Subtasks Tab */}
            {activeTab === 'subtasks' && (
              <div className="space-y-4">
                {/* Progress bar */}
                {subtaskProgress.total > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-surface-400">Progression</span>
                      <span className="text-surface-200 font-medium">{subtaskProgress.progress}%</span>
                    </div>
                    <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subtaskProgress.progress}%` }}
                        className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Add subtask */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Ajouter une sous-tâche..."
                    className="input flex-1"
                  />
                  <button onClick={handleAddSubtask} className="btn-primary">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtasks list */}
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 group ${
                        subtask.isCompleted ? 'opacity-60' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleToggleSubtask(subtask)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          subtask.isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-surface-500 hover:border-primary-500'
                        }`}
                      >
                        {subtask.isCompleted && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`flex-1 ${subtask.isCompleted ? 'line-through text-surface-500' : 'text-surface-200'}`}>
                        {subtask.name}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-surface-500 hover:text-red-400 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {subtasks.length === 0 && !loadingSubtasks && (
                  <p className="text-center text-surface-500 py-8">Aucune sous-tâche</p>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* New comment input */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold flex-shrink-0">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    {replyTo && (
                      <div className="flex items-center gap-2 text-sm text-surface-400 mb-2">
                        <Reply className="w-4 h-4" />
                        Réponse à {replyTo.firstName} {replyTo.lastName}
                        <button onClick={() => setReplyTo(null)} className="hover:text-surface-200">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="relative flex gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={newComment}
                          onChange={handleCommentInput}
                          placeholder="Ajouter un commentaire... (utilisez @ pour mentionner)"
                          className="input w-full resize-none"
                          rows={2}
                        />
                        {showMentions && (
                          <div className="absolute bottom-full mb-1 left-0 w-full bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                            {mentionResults.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => insertMention(m)}
                                className="w-full text-left px-3 py-2 hover:bg-surface-700 transition-colors flex items-center gap-2 text-sm"
                              >
                                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-semibold">
                                  {m.firstName?.[0]}{m.lastName?.[0]}
                                </div>
                                <span className="text-surface-200">{m.firstName} {m.lastName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={handleAddComment} disabled={!newComment.trim()} className="btn-primary self-end">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments list */}
                <div className="space-y-4 mt-6">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReply={() => setReplyTo(comment)}
                    />
                  ))}
                </div>

                {comments.length === 0 && !loadingComments && (
                  <p className="text-center text-surface-500 py-8">Aucun commentaire</p>
                )}
              </div>
            )}

            {/* Time Tracking Tab */}
            {activeTab === 'time' && (
              <div className="space-y-4">
                {/* Timer control */}
                <div className="bg-surface-800/50 rounded-xl p-4">
                  {activeTimer ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-mono font-bold text-primary-400">{formatDuration(timerElapsed)}</p>
                        <p className="text-sm text-surface-400 mt-1">Chronomètre en cours...</p>
                      </div>
                      <button onClick={handleStopTimer} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                        <Square className="w-4 h-4" />
                        Arrêter
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={timeDescription}
                        onChange={(e) => setTimeDescription(e.target.value)}
                        placeholder="Description (optionnel)..."
                        className="input"
                      />
                      <button onClick={handleStartTimer} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                        <Play className="w-4 h-4" />
                        Démarrer le chronomètre
                      </button>
                    </div>
                  )}
                </div>

                {/* Time entries list */}
                <div className="space-y-2">
                  {timeEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-surface-800/30 rounded-lg group">
                      <div className="flex-1">
                        <p className="text-sm text-surface-200">
                          {entry.first_name} {entry.last_name}
                        </p>
                        {entry.description && (
                          <p className="text-xs text-surface-500 mt-0.5">{entry.description}</p>
                        )}
                        <p className="text-xs text-surface-500 mt-0.5">
                          {format(new Date(entry.start_time), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary-400">
                        {formatMinutes(entry.duration_minutes || entry.current_duration)}
                      </span>
                    </div>
                  ))}
                </div>

                {timeEntries.length === 0 && !loadingTime && (
                  <p className="text-center text-surface-500 py-8">Aucune entrée de temps</p>
                )}

                {timeEntries.length > 0 && (
                  <div className="bg-surface-800/50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-surface-400">Total</span>
                    <span className="font-semibold text-surface-200">
                      {formatMinutes(timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Dependencies Tab */}
            {activeTab === 'dependencies' && (
              <div className="space-y-4">
                {/* Add dependency form */}
                <div className="bg-surface-800/50 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-medium text-surface-200 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Ajouter une dépendance
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={depType}
                      onChange={(e) => setDepType(e.target.value)}
                      className="input w-auto text-sm"
                    >
                      <option value="finish_to_start">est bloqué par</option>
                      <option value="blocks">bloque</option>
                      <option value="related_to">est lié à</option>
                      <option value="duplicates">duplique</option>
                      <option value="is_duplicated_by">est dupliqué par</option>
                      <option value="causes">cause</option>
                      <option value="is_caused_by">est causé par</option>
                    </select>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="text"
                        value={depSearchTerm}
                        onChange={(e) => handleSearchDependency(e.target.value)}
                        placeholder="Rechercher un item..."
                        className="input pl-9 w-full text-sm"
                      />
                      {depSearchResults.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-surface-800 border border-surface-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {depSearchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleCreateDependency(result.id)}
                              className="w-full text-left px-3 py-2 hover:bg-surface-700 transition-colors flex items-center gap-2"
                            >
                              <Link2 className="w-3.5 h-3.5 text-surface-500" />
                              <span className="text-sm text-surface-200 truncate">{result.name}</span>
                              {result.board_name && (
                                <span className="text-xs text-surface-500 ml-auto flex-shrink-0">({result.board_name})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {loadingDeps ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {dependencies.blocking?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-surface-400 mb-2">Bloque</h4>
                        {dependencies.blocking.map((dep) => (
                          <div key={dep.id} className="flex items-center justify-between p-3 bg-surface-800/30 rounded-lg mb-2 group">
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-orange-400" />
                              <span className="text-sm text-surface-200">{dep.item_name}</span>
                              <span className="text-xs text-surface-500">({dep.board_name})</span>
                            </div>
                            <button
                              onClick={async () => {
                                await dependencyApi.delete(dep.id);
                                loadDependencies();
                                toast.success('Dépendance supprimée');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-surface-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {dependencies.blockedBy?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-surface-400 mb-2">Bloqué par</h4>
                        {dependencies.blockedBy.map((dep) => (
                          <div key={dep.id} className="flex items-center justify-between p-3 bg-surface-800/30 rounded-lg mb-2 group">
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-red-400" />
                              <span className="text-sm text-surface-200">{dep.item_name}</span>
                              <span className="text-xs text-surface-500">({dep.board_name})</span>
                            </div>
                            <button
                              onClick={async () => {
                                await dependencyApi.delete(dep.id);
                                loadDependencies();
                                toast.success('Dépendance supprimée');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-surface-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Other dependency types (related, duplicates, causes, etc.) */}
                    {Object.entries(dependencies)
                      .filter(([key]) => !['blocking', 'blockedBy'].includes(key))
                      .filter(([, deps]) => Array.isArray(deps) && deps.length > 0)
                      .map(([type, deps]) => (
                        <div key={type}>
                          <h4 className="text-sm font-medium text-surface-400 mb-2">{getDepTypeLabel(type)}</h4>
                          {deps.map((dep) => (
                            <div key={dep.id} className="flex items-center justify-between p-3 bg-surface-800/30 rounded-lg mb-2 group">
                              <div className="flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-surface-200">{dep.item_name}</span>
                                <span className="text-xs text-surface-500">({dep.board_name})</span>
                                {dep.dependency_type && (
                                  <span className="text-xs text-surface-600 italic">{dep.dependency_type}</span>
                                )}
                              </div>
                              <button
                                onClick={async () => {
                                  await dependencyApi.delete(dep.id);
                                  loadDependencies();
                                  toast.success('Dépendance supprimée');
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-surface-500 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}

                    {(dependencies.blocking?.length || 0) === 0 && (dependencies.blockedBy?.length || 0) === 0 && 
                     Object.entries(dependencies).filter(([key]) => !['blocking', 'blockedBy'].includes(key)).every(([, deps]) => !Array.isArray(deps) || deps.length === 0) && (
                      <p className="text-center text-surface-500 py-4">Aucune dépendance</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                {loadingActivities ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-surface-400 flex-shrink-0">
                        {activity.userName?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-300">
                          <span className="font-medium text-surface-200">{activity.userName || 'Utilisateur'}</span>
                          {' '}{getActivityText(activity.action)}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-surface-500 py-8">Aucune activité</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-surface-700 bg-surface-800/50">
            <button
              onClick={async () => {
                if (!confirm('Supprimer cet item ?')) return;
                try {
                  await itemApi.delete(item.id);
                  deleteItem(item.id);
                  toast.success('Item supprimé');
                  onClose();
                } catch (error) {
                  toast.error('Erreur');
                }
              }}
              className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="btn btn-secondary">Annuler</button>
              <button onClick={handleSubmit} disabled={isLoading || !formData.name.trim()} className="btn btn-primary">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CommentItem({ comment, onReply }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-surface-300 font-semibold flex-shrink-0">
        {comment.firstName?.[0]}{comment.lastName?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-surface-200">{comment.firstName} {comment.lastName}</span>
          <span className="text-xs text-surface-500">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
          </span>
        </div>
        <p className="text-surface-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
        <button onClick={onReply} className="text-xs text-surface-500 hover:text-primary-400 mt-1">
          Répondre
        </button>
        
        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-surface-700 space-y-3">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-surface-400 text-sm flex-shrink-0">
                  {reply.firstName?.[0]}{reply.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-surface-300 text-sm">{reply.firstName} {reply.lastName}</span>
                    <span className="text-xs text-surface-500">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="text-surface-400 text-sm mt-0.5">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderColumnInput(column, formData, setFormData) {
  const value = formData.values[column.id];
  const handleChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      values: { ...prev.values, [column.id]: newValue },
    }));
  };

  switch (column.type) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="input"
          placeholder="..."
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="input"
        />
      );

    case 'date':
      let dateValue = '';
      if (value) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) dateValue = d.toISOString().split('T')[0];
      }
      return (
        <input
          type="date"
          value={dateValue}
          onChange={(e) => handleChange(e.target.value)}
          className="input"
        />
      );

    case 'status':
      return (
        <div className="flex flex-wrap gap-2">
          {column.labels?.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() => handleChange(label.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                value === label.id ? 'ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: label.color, color: 'white' }}
            >
              {label.name}
            </button>
          ))}
        </div>
      );

    case 'priority':
      const priorities = [
        { id: 'low', name: 'Basse', color: '#6b7280' },
        { id: 'medium', name: 'Moyenne', color: '#f59e0b' },
        { id: 'high', name: 'Haute', color: '#ef4444' },
        { id: 'critical', name: 'Critique', color: '#7c3aed' },
      ];
      return (
        <div className="flex flex-wrap gap-2">
          {priorities.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleChange(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                value === p.id ? 'ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: p.color, color: 'white' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      );

    case 'progress':
      const progressValue = typeof value === 'object' ? (value?.progress ?? 0) : (value ?? 0);
      return (
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="100"
            value={progressValue}
            onChange={(e) => handleChange({ progress: parseInt(e.target.value) })}
            className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <span className="text-primary-400 font-medium">{progressValue}%</span>
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <span className="text-surface-300">{value ? 'Oui' : 'Non'}</span>
        </label>
      );

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="input"
        />
      );
  }
}

function getDepTypeLabel(type) {
  const labels = {
    related: 'Lié à',
    duplicates: 'Duplique',
    is_duplicated_by: 'Est dupliqué par',
    causes: 'Cause',
    is_caused_by: 'Est causé par',
    related_to: 'Lié à',
  };
  return labels[type] || type;
}

function getActivityText(action) {
  const actions = {
    'item_created': 'a créé cet item',
    'item_updated': 'a modifié cet item',
    'item_deleted': 'a supprimé cet item',
    'value_updated': 'a mis à jour une valeur',
    'comment_added': 'a ajouté un commentaire',
    'subtask_added': 'a ajouté une sous-tâche',
    'subtask_completed': 'a terminé une sous-tâche',
    'assignee_added': 'a assigné un membre',
    'status_changed': 'a changé le statut',
  };
  return actions[action] || action;
}
