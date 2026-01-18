import { Check } from 'lucide-react';
import { itemApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

export default function CheckboxCell({ item, column, value }) {
  const updateItemValue = useBoardStore((state) => state.updateItemValue);
  const isChecked = value?.checked || false;

  const handleToggle = async () => {
    try {
      await itemApi.updateValue(item.id, column.id, { checked: !isChecked });
      updateItemValue(item.id, column.id, { checked: !isChecked });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
        isChecked
          ? 'bg-primary-500 border-primary-500'
          : 'border-surface-600 hover:border-surface-500'
      }`}
    >
      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
    </button>
  );
}
