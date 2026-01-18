import { useState, useRef, useEffect } from 'react';
import { itemApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

export default function NumberCell({ item, column, value }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.number?.toString() || '');
  const inputRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);

  const prefix = column.settings?.prefix || '';
  const suffix = column.settings?.suffix || '';

  useEffect(() => {
    setInputValue(value?.number?.toString() || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue !== value?.number) {
      try {
        await itemApi.updateValue(item.id, column.id, { number: numValue });
        updateItemValue(item.id, column.id, { number: numValue });
      } catch (error) {
        toast.error('Erreur lors de la mise à jour');
        setInputValue(value?.number?.toString() || '');
      }
    } else if (inputValue === '' && value?.number !== undefined) {
      try {
        await itemApi.updateValue(item.id, column.id, { number: null });
        updateItemValue(item.id, column.id, { number: null });
      } catch (error) {
        toast.error('Erreur lors de la mise à jour');
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(value?.number?.toString() || '');
      setIsEditing(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '';
    return `${prefix}${num.toLocaleString('fr-FR')}${suffix}`;
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-none text-sm text-surface-200 focus:outline-none"
        placeholder="0"
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full text-left text-sm"
    >
      {value?.number !== undefined && value?.number !== null ? (
        <span className="text-surface-200">{formatNumber(value.number)}</span>
      ) : (
        <span className="text-surface-500">-</span>
      )}
    </button>
  );
}
