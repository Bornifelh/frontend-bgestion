import { useState, useRef, useEffect } from 'react';
import { itemApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

export default function TextCell({ item, column, value }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.text || '');
  const inputRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);

  useEffect(() => {
    setInputValue(value?.text || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (inputValue !== (value?.text || '')) {
      try {
        await itemApi.updateValue(item.id, column.id, { text: inputValue });
        updateItemValue(item.id, column.id, { text: inputValue });
      } catch (error) {
        toast.error('Erreur lors de la mise à jour');
        setInputValue(value?.text || '');
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(value?.text || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-none text-sm text-surface-200 focus:outline-none"
        placeholder={column.settings?.placeholder || 'Entrez du texte...'}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full text-left text-sm truncate"
    >
      {value?.text || (
        <span className="text-surface-500">
          {column.settings?.placeholder || 'Texte...'}
        </span>
      )}
    </button>
  );
}
