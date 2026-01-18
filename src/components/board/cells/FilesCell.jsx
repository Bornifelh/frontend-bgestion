import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Image, 
  Film, 
  Music, 
  Archive, 
  File, 
  Plus, 
  Trash2, 
  Download, 
  Eye,
  ExternalLink,
  Upload,
  X,
  FileSpreadsheet,
  FileIcon,
  Loader2
} from 'lucide-react';
import { itemApi, fileApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

const FILE_ICONS = {
  // Documents
  pdf: { icon: FileText, color: '#ef4444' },
  doc: { icon: FileText, color: '#3b82f6' },
  docx: { icon: FileText, color: '#3b82f6' },
  txt: { icon: FileText, color: '#6b7280' },
  rtf: { icon: FileText, color: '#6b7280' },
  
  // Spreadsheets
  xls: { icon: FileSpreadsheet, color: '#22c55e' },
  xlsx: { icon: FileSpreadsheet, color: '#22c55e' },
  csv: { icon: FileSpreadsheet, color: '#22c55e' },
  
  // Presentations
  ppt: { icon: FileIcon, color: '#f97316' },
  pptx: { icon: FileIcon, color: '#f97316' },
  
  // Images
  jpg: { icon: Image, color: '#8b5cf6' },
  jpeg: { icon: Image, color: '#8b5cf6' },
  png: { icon: Image, color: '#8b5cf6' },
  gif: { icon: Image, color: '#8b5cf6' },
  svg: { icon: Image, color: '#8b5cf6' },
  webp: { icon: Image, color: '#8b5cf6' },
  
  // Video
  mp4: { icon: Film, color: '#ec4899' },
  avi: { icon: Film, color: '#ec4899' },
  mov: { icon: Film, color: '#ec4899' },
  mkv: { icon: Film, color: '#ec4899' },
  
  // Audio
  mp3: { icon: Music, color: '#14b8a6' },
  wav: { icon: Music, color: '#14b8a6' },
  flac: { icon: Music, color: '#14b8a6' },
  
  // Archives
  zip: { icon: Archive, color: '#eab308' },
  rar: { icon: Archive, color: '#eab308' },
  '7z': { icon: Archive, color: '#eab308' },
  tar: { icon: Archive, color: '#eab308' },
};

const getFileInfo = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || { icon: File, color: '#6b7280' };
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Office Online URLs for web editing
const getOfficeOnlineUrl = (file) => {
  if (!file?.url) return null;
  const ext = file.name?.split('.').pop()?.toLowerCase();
  
  // Microsoft Office Online
  if (['doc', 'docx'].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
  }
  
  return null;
};

export default function FilesCell({ item, column, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);

  // Handle value format
  const files = Array.isArray(value) ? value : (value?.files || []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('FilesCell handleOpen called', { isOpen, item: item?.id });
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 350),
      });
    }
    setIsOpen(!isOpen);
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    setUploading(true);
    const newFiles = [...files];

    for (const file of selectedFiles) {
      try {
        // Upload file to server to get a public URL (required for Office 365 Online)
        const response = await fileApi.upload(file, item.id, column.id);
        
        if (response.data?.file) {
          newFiles.push(response.data.file);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }

    try {
      await itemApi.updateValue(item.id, column.id, newFiles);
      updateItemValue(item.id, column.id, newFiles);
      toast.success(`${selectedFiles.length} fichier(s) ajouté(s)`);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = async (fileId) => {
    const fileToDelete = files.find(f => f.id === fileId);
    const newFiles = files.filter(f => f.id !== fileId);
    
    try {
      // Delete file from server if it has a storedName
      if (fileToDelete?.storedName) {
        try {
          await fileApi.delete(fileToDelete.storedName);
        } catch (err) {
          console.warn('Could not delete file from server:', err);
        }
      }
      
      await itemApi.updateValue(item.id, column.id, newFiles);
      updateItemValue(item.id, column.id, newFiles);
      toast.success('Fichier supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInOffice = (file) => {
    const officeUrl = getOfficeOnlineUrl(file);
    if (officeUrl) {
      window.open(officeUrl, '_blank');
    } else {
      toast.error('Ce type de fichier ne peut pas être ouvert dans Office Online');
    }
  };

  const isOfficeFile = (file) => {
    const ext = file.name?.split('.').pop()?.toLowerCase();
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  };

  const isImageFile = (file) => {
    const ext = file.name?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
  };

  const menuContent = (
    <motion.div
      key="files-cell-menu"
      ref={menuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[9999] w-80 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-surface-700">
        <span className="text-sm font-medium text-surface-200">
          Fichiers ({files.length})
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Ajouter
        </button>
      </div>

      {/* Files list */}
      <div className="max-h-64 overflow-y-auto">
        {files.length > 0 ? (
          <div className="divide-y divide-surface-700/50">
            {files.map((file) => {
              const { icon: FileIcon, color } = getFileInfo(file.name);
              return (
                <div key={file.id} className="p-2 hover:bg-surface-700/30 transition-colors group">
                  <div className="flex items-start gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <FileIcon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-200 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-surface-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isImageFile(file) && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1 hover:bg-surface-600 rounded text-surface-400 hover:text-surface-200"
                          title="Aperçu"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isOfficeFile(file) && (
                        <button
                          onClick={() => handleOpenInOffice(file)}
                          className="p-1 hover:bg-surface-600 rounded text-primary-400 hover:text-primary-300"
                          title="Ouvrir dans Office Online"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-1 hover:bg-surface-600 rounded text-surface-400 hover:text-surface-200"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-surface-400 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Upload className="w-8 h-8 text-surface-600 mx-auto mb-2" />
            <p className="text-sm text-surface-500">Aucun fichier</p>
            <p className="text-xs text-surface-600 mt-1">
              Glissez-déposez ou cliquez pour ajouter
            </p>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div 
        className="p-2 border-t border-surface-700 bg-surface-850"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dt = e.dataTransfer;
          if (dt.files.length) {
            fileInputRef.current.files = dt.files;
            handleFileSelect({ target: { files: dt.files } });
          }
        }}
      >
        <div className="border-2 border-dashed border-surface-600 rounded-lg p-3 text-center hover:border-primary-500 transition-colors">
          <p className="text-xs text-surface-500">
            Glissez vos fichiers ici
          </p>
        </div>
      </div>
    </motion.div>
  );

  // Image preview modal
  const previewModal = previewFile && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
      onClick={() => setPreviewFile(null)}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="relative max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setPreviewFile(null)}
          className="absolute -top-3 -right-3 w-8 h-8 bg-surface-800 rounded-full flex items-center justify-center text-surface-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={previewFile.url}
          alt={previewFile.name}
          className="max-w-full max-h-[85vh] rounded-lg"
        />
        <p className="text-center text-surface-400 mt-2 text-sm">{previewFile.name}</p>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="relative" style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        ref={buttonRef}
        onClick={handleOpen}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full flex items-center gap-1.5 min-h-[28px] cursor-pointer rounded-md hover:bg-surface-700/50 px-1 py-0.5 transition-colors bg-transparent border-none text-left relative z-10"
        style={{ pointerEvents: 'auto' }}
      >
        {files.length > 0 ? (
          <>
            <div className="flex items-center -space-x-1">
              {files.slice(0, 3).map((file, i) => {
                const { icon: Icon, color } = getFileInfo(file.name);
                return (
                  <div
                    key={file.id}
                    className="w-6 h-6 rounded flex items-center justify-center ring-2 ring-surface-900"
                    style={{ backgroundColor: `${color}20`, zIndex: 3 - i }}
                  >
                    <Icon className="w-3 h-3" style={{ color }} />
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-surface-400">
              {files.length} fichier{files.length > 1 ? 's' : ''}
            </span>
          </>
        ) : (
          <span className="text-sm text-surface-500 flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Fichiers
          </span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && menuContent}
        </AnimatePresence>,
        document.body
      )}
      {createPortal(
        <AnimatePresence>
          {previewFile && previewModal}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
