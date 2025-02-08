import { useState } from 'react';

interface EditableTextProps {
  id: string;
  initialValue: string;
  onSave: (id: string, value: string) => void;
  isEditing: boolean;
}

export const EditableText = ({ id, initialValue, onSave, isEditing }: EditableTextProps) => {
  const [value, setValue] = useState(initialValue);

  if (!isEditing) {
    return <text id={id}>{value}</text>;
  }

  return (
    <foreignObject x="0" y="0" width="100" height="20">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onSave(id, value)}
        className="w-full border rounded px-2 py-1"
      />
    </foreignObject>
  );
}; 