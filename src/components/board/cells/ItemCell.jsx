import { useState } from 'react';
import StatusCell from './StatusCell';
import PersonCell from './PersonCell';
import DateCell from './DateCell';
import TextCell from './TextCell';
import NumberCell from './NumberCell';
import CheckboxCell from './CheckboxCell';
import PriorityCell from './PriorityCell';
import ProgressCell from './ProgressCell';
import FilesCell from './FilesCell';

const cellComponents = {
  status: StatusCell,
  person: PersonCell,
  date: DateCell,
  text: TextCell,
  number: NumberCell,
  checkbox: CheckboxCell,
  priority: PriorityCell,
  progress: ProgressCell,
  files: FilesCell,
  file: FilesCell,
};

export default function ItemCell({ item, column, value }) {
  const CellComponent = cellComponents[column.type] || TextCell;

  return (
    <CellComponent
      item={item}
      column={column}
      value={value}
    />
  );
}
