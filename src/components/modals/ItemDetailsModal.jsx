import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MessageSquare, Paperclip, FileText, Send, Trash2,
  Upload, Download, Image, File, FileSpreadsheet,
  CornerDownRight, MoreHorizontal, Edit3, Clock, User,
  ChevronRight,
} from 'lucide-react';
import { commentApi, fileApi } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { useBoardStore } from '../../stores/boardStore';
import toast from 'react-hot-toast';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getFileIcon(type) {
  if (!type) return File;
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  return File;
}

function UserAvatar({ firstName, lastName, size = 'md' }) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  const s = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <div className={`${s} rounded-full bg-[#173D68]/10 text-[#173D68] font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

function CommentItem({ comment, onDelete, onReply, currentUserId }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group">
      <div className="flex gap-2.5">
        <UserAvatar firstName={comment.firstName} lastName={comment.lastName} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#173D68]">
              {comment.firstName} {comment.lastName}
            </span>
            <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
            {comment.userId === currentUserId && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 ml-auto p-1 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mt-0.5">{comment.content}</p>
          <button
            type="button"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 mt-1 text-xs text-gray-400 hover:text-[#F36F21] transition-colors"
          >
            <CornerDownRight className="w-3 h-3" />
            Répondre
          </button>

          {showReplyForm && (
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#F36F21] transition-colors"
                placeholder="Votre réponse..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
              />
              <button
                type="button"
                onClick={handleReply}
                disabled={!replyText.trim() || isSubmitting}
                className="px-3 py-1.5 bg-[#F36F21] text-white rounded-lg text-xs font-medium hover:bg-[#e0611a] disabled:opacity-40 transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          )}

          {comment.replies?.length > 0 && (
            <div className="mt-3 pl-3 border-l-2 border-gray-100 space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2 group/reply">
                  <UserAvatar firstName={reply.firstName} lastName={reply.lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#173D68]">
                        {reply.firstName} {reply.lastName}
                      </span>
                      <span className="text-[10px] text-gray-400">{timeAgo(reply.createdAt)}</span>
                      {reply.userId === currentUserId && (
                        <button
                          type="button"
                          onClick={() => onDelete(reply.id)}
                          className="opacity-0 group-hover/reply:opacity-100 ml-auto p-1 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap break-words mt-0.5">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentsTab({ itemId }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const loadComments = useCallback(async () => {
    if (!itemId) return;
    try {
      const res = await commentApi.getByItem(itemId);
      setComments(res.data || []);
    } catch {
      toast.error('Erreur chargement commentaires');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleSend = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    try {
      const res = await commentApi.create({ itemId, content: newComment.trim() });
      setComments((prev) => [{ ...res.data, replies: [] }, ...prev]);
      setNewComment('');
      inputRef.current?.focus();
    } catch {
      toast.error('Erreur envoi commentaire');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (parentId, content) => {
    const res = await commentApi.create({ itemId, content, parentId });
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), res.data] } : c
      )
    );
  };

  const handleDelete = async (commentId) => {
    try {
      await commentApi.delete(commentId);
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: (c.replies || []).filter((r) => r.id !== commentId),
          }))
      );
      toast.success('Commentaire supprimé');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F36F21] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Aucun commentaire</p>
            <p className="text-xs mt-1">Soyez le premier à commenter</p>
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={user?.id}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 px-5 py-3 bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#F36F21] transition-colors"
            placeholder="Ajouter un commentaire... (utilisez @ pour mentionner)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!newComment.trim() || sending}
            className="px-4 py-2 bg-[#F36F21] text-white rounded-lg text-sm font-medium hover:bg-[#e0611a] disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FilesTab({ itemId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadFiles = useCallback(async () => {
    if (!itemId) return;
    try {
      const res = await fileApi.getByItem(itemId);
      setFiles(res.data || []);
    } catch {
      toast.error('Erreur chargement fichiers');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setUploading(true);
    try {
      if (selected.length === 1) {
        const res = await fileApi.upload(selected[0], itemId);
        setFiles((prev) => [res.data.file, ...prev]);
      } else {
        const res = await fileApi.uploadMultiple(selected, itemId);
        setFiles((prev) => [...(res.data.files || []), ...prev]);
      }
      toast.success(`${selected.length} fichier(s) ajouté(s)`);
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file) => {
    try {
      await fileApi.delete(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success('Fichier supprimé');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F36F21] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">
            {files.length} fichier{files.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F36F21] text-white rounded-lg text-xs font-medium hover:bg-[#e0611a] disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Ajouter
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {files.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 cursor-pointer hover:border-[#F36F21]/30 hover:bg-[#F36F21]/[0.02] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Aucun fichier joint</p>
            <p className="text-xs mt-1">Cliquez ou glissez pour ajouter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const IconComp = getFileIcon(file.fileType);
              const isImage = file.fileType?.startsWith('image/');
              return (
                <div
                  key={file.id}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#F36F21]/20 hover:bg-[#F36F21]/[0.02] transition-colors"
                >
                  {isImage && file.fileUrl ? (
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <IconComp className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#173D68] truncate">{file.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{formatBytes(file.fileSize)}</span>
                      {file.firstName && (
                        <span className="text-[10px] text-gray-400">
                          par {file.firstName} {file.lastName}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{timeAgo(file.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-[#173D68] rounded transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'comments', label: 'Commentaires', Icon: MessageSquare },
  { id: 'files', label: 'Fichiers', Icon: Paperclip },
];

export default function ItemDetailsModal({ isOpen, onClose, item, onEdit }) {
  const [activeTab, setActiveTab] = useState('comments');
  const { columns } = useBoardStore();

  useEffect(() => {
    if (isOpen) setActiveTab('comments');
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const statusCol = columns.find((c) => c.type === 'status');
  const statusValue = statusCol ? item.values?.[statusCol.id] : null;
  const statusLabel = statusCol?.labels?.find((l) => l.id === statusValue);

  const personCol = columns.find((c) => c.type === 'person');
  const personValue = personCol ? item.values?.[personCol.id] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            {/* Header */}
            <div className="shrink-0 px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[#173D68] truncate">{item.name}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {statusLabel && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: statusLabel.color || '#6b7280' }}
                      >
                        {statusLabel.label}
                      </span>
                    )}
                    {personValue && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {personValue}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => { onClose(); onEdit(item); }}
                      className="p-2 text-gray-400 hover:text-[#F36F21] hover:bg-[#F36F21]/5 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <nav className="flex items-center gap-1 mt-3 -mb-px">
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                      activeTab === id
                        ? 'border-[#F36F21] text-[#F36F21] bg-[#F36F21]/5'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === 'comments' && <CommentsTab itemId={item.id} />}
              {activeTab === 'files' && <FilesTab itemId={item.id} />}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
