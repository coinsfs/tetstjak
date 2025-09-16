import React, { useState } from 'react';
import { Settings, Plus, X } from 'lucide-react';
import { 
  CollectionsRelationshipsResponse, 
  CollectionFilter
} from '@/types/export';
import CollectionFilterCreator from './CollectionFilterCreator';

interface FiltersPanelProps {
  filters: CollectionFilter[];
  onFilterAdd: (filter: CollectionFilter) => void;
  onFilterRemove: (filterId: string) => void;
  onFilterUpdate: (filterId: string, updatedFilter: CollectionFilter) => void;
  collections: CollectionsRelationshipsResponse | null;
  token: string | null;
  availableCollectionsForFilter: { key: string; displayName: string }[];
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  onFilterAdd,
  onFilterRemove,
  onFilterUpdate,
  collections,
  token,
  availableCollectionsForFilter
}) => {
  const [showFilterCreator, setShowFilterCreator] = useState(false);
  const [editingFilter, setEditingFilter] = useState<CollectionFilter | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Data Filters
        </h4>
        <button 
          onClick={() => setShowFilterCreator(true)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Filter
        </button>
      </div>
      
      <div className="flex flex-nowrap overflow-x-auto space-x-3 pb-2">
        {filters.length === 0 ? (
          <div className="flex-shrink-0 w-80 p-3 border border-gray-200 rounded-lg text-center text-gray-500">
            <Settings className="w-5 h-5 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">No filters configured</p>
            <p className="text-xs text-gray-400">Add filters to refine your data export</p>
          </div>
        ) : (
          filters.map((filter) => (
            <div
              key={filter.id}
              className="flex-shrink-0 w-80 p-3 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {filter.collection} Filter
                  </div>
                  <div className="text-xs text-gray-500">
                    {filter.conditions.length} condition{filter.conditions.length !== 1 ? 's' : ''} 
                    {filter.conditions.length > 1 && ` (${filter.logic.toUpperCase()})`}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {filter.conditions.map((condition, index) => (
                      <span 
                        key={condition.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {condition.field} {condition.operator} {String(condition.value)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingFilter(filter);
                      setShowFilterCreator(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit filter"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onFilterRemove(filter.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Filter Creator Modal */}
      {showFilterCreator && (
        <CollectionFilterCreator
          collections={collections}
          token={token}
          editingFilter={editingFilter}
          availableCollectionsForFilter={availableCollectionsForFilter}
          onSave={(filter) => {
            if (editingFilter) {
              onFilterUpdate(editingFilter.id, filter);
            } else {
              onFilterAdd(filter);
            }
            setShowFilterCreator(false);
            setEditingFilter(null);
          }}
          onCancel={() => {
            setShowFilterCreator(false);
            setEditingFilter(null);
          }}
        />
      )}
    </div>
  );
};

export default FiltersPanel;