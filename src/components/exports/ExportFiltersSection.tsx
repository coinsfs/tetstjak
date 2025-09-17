import React from 'react';
import { Plus, Settings, X, Filter } from 'lucide-react';
import { 
  ExportConfiguration, 
  CollectionFilter,
  CollectionsRelationshipsResponse
} from '@/types/export';
import CollectionFilterCreator from './CollectionFilterCreator';

interface ExportFiltersSectionProps {
  exportConfig: ExportConfiguration;
  collections: CollectionsRelationshipsResponse | null;
  availableFieldContexts: { key: string; displayName: string }[];
  token: string | null;
  showFilterCreator: boolean;
  editingFilter: CollectionFilter | null;
  onFilterAdd: (filter: CollectionFilter) => void;
  onFilterRemove: (filterId: string) => void;
  onFilterUpdate: (filterId: string, updatedFilter: CollectionFilter) => void;
  onShowFilterCreator: (show: boolean) => void;
  onSetEditingFilter: (filter: CollectionFilter | null) => void;
}

const ExportFiltersSection: React.FC<ExportFiltersSectionProps> = ({
  exportConfig,
  collections,
  availableFieldContexts,
  token,
  showFilterCreator,
  editingFilter,
  onFilterAdd,
  onFilterRemove,
  onFilterUpdate,
  onShowFilterCreator,
  onSetEditingFilter
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium text-gray-900">Data Filters</h3>
          </div>
          <button 
            onClick={() => onShowFilterCreator(true)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Filter
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Filter data berdasarkan kondisi tertentu</p>
      </div>

      {/* Filter Creator Modal */}
      {showFilterCreator && (
        <CollectionFilterCreator
          collections={collections}
          token={token}
          editingFilter={editingFilter}
          availableCollectionsForFilter={availableFieldContexts}
          onSave={(filter) => {
            if (editingFilter) {
              onFilterUpdate(editingFilter.id, filter);
            } else {
              onFilterAdd(filter);
            }
            onShowFilterCreator(false);
            onSetEditingFilter(null);
          }}
          onCancel={() => {
            onShowFilterCreator(false);
            onSetEditingFilter(null);
          }}
        />
      )}

      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {exportConfig.filters.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No filters configured</p>
              <p className="text-xs text-gray-400">Add filters to refine your data export</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="flex flex-row flex-nowrap overflow-x-auto gap-4 p-2 min-h-full">
              {exportConfig.filters.map((filter) => (
                <div
                  key={filter.id}
                  className="min-w-[280px] max-w-[320px] flex-shrink-0 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {filter.collection} Filter
                      </div>
                      <div className="text-xs text-gray-500">
                        {filter.conditions.length} condition{filter.conditions.length !== 1 ? 's' : ''} 
                        {filter.conditions.length > 1 && ` (${filter.logic.toUpperCase()})`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => {
                          onSetEditingFilter(filter);
                          onShowFilterCreator(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit filter"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onFilterRemove(filter.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {filter.conditions.slice(0, 2).map((condition, index) => (
                      <div key={condition.id} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                        <span className="font-medium">{condition.field}</span>
                        <span className="mx-1">{condition.operator}</span>
                        <span className="text-gray-800">"{String(condition.value)}"</span>
                      </div>
                    ))}
                    {filter.conditions.length > 2 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{filter.conditions.length - 2} more condition{filter.conditions.length - 2 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportFiltersSection;