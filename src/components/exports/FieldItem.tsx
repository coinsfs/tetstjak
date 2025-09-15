import React from 'react';
import { useDrag } from 'react-dnd';
import { FieldInfo, ItemTypes, DragItem } from '@/types/export';
import { GripVertical } from 'lucide-react';

interface FieldItemProps {
  field: FieldInfo;
  collection: string;
}

const FieldItem: React.FC<FieldItemProps> = ({ field, collection }) => {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ItemTypes.FIELD,
    item: {
      type: ItemTypes.FIELD,
      field,
      collection
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'recommended': return 'bg-green-100 text-green-800';
      case 'optional': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'user_info': return 'bg-indigo-100 text-indigo-800';
      case 'timestamps': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={drag}
      className={`flex items-center justify-between p-2 rounded-md border cursor-move transition-all ${
        isDragging 
          ? 'opacity-50 border-blue-300 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">
            {field.alias}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {field.field}
          </div>
        </div>
      </div>
      
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(field.category)}`}>
        {field.category}
      </span>
    </div>
  );
};

export default FieldItem;