import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Database, Settings, X } from 'lucide-react';
import { 
  ExportConfiguration, 
  SelectedField, 
  JoinConfiguration, 
  DragItem,
  CollectionsRelationshipsResponse,
  FieldInfo
} from '@/types/export';
import { exportService } from '@/services/export';
import toast from 'react-hot-toast';
import CollectionFilterCreator from './CollectionFilterCreator';

interface ExportConfigurationPreviewProps {
  exportConfig: ExportConfiguration;
  collections: CollectionsRelationshipsResponse | null;
  availableFieldContexts: { key: string; displayName: string }[];
  activeFieldContextCollection: string;
  setActiveFieldContextCollection: (collection: string) => void;
  onTriggerJoinCreation: () => void;
  onFieldAdd: (field: SelectedField) => void;
  onFieldRemove: (fieldId: string) => void;
  onJoinAdd: (join: JoinConfiguration) => void;
  onJoinRemove: (joinId: string) => void;
  token: string | null;
}

const ExportConfigurationPreview: React.FC<ExportConfigurationPreviewProps> = ({
  exportConfig,
  collections,
  availableFieldContexts,
  activeFieldContextCollection,
  setActiveFieldContextCollection,
  onTriggerJoinCreation,
  onFieldAdd,
  onFieldRemove,
  onJoinAdd,
  onJoinRemove,
  onFilterAdd,
  onFilterRemove,
  onFilterUpdate,
}) => {
  // Filter Creator States
  const [showFilterCreator, setShowFilterCreator] = React.useState(false);
  const [editingFilter, setEditingFilter] = React.useState<CollectionFilter | null>(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'field', 
    drop: (item: DragItem) => {
      const selectedField: SelectedField = {
        id: `${item.collection}.${item.field.field}`,
        field: item.field.field,
        alias: item.field.alias,
        collection: item.collection,
        category: item.field.category
      };
      onFieldAdd(selectedField);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Export Configuration</h3>
        </div>
        {exportConfig.main_collection && (
          <p className="text-sm text-gray-600 mt-1">
            Main Collection: <span className="font-medium">{exportConfig.main_collection}</span>
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {!exportConfig.main_collection ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Collection Selected</p>
              <p className="text-sm">Please select a main collection to start configuring your export</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Field Context Selection */}
            {availableFieldContexts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Available Collections</h4>
                <div className="flex flex-wrap gap-2">
                  {availableFieldContexts.map((context) => (
                    <button
                      key={context.key}
                availableCollectionsForFilter={availableFieldContexts}
                      onClick={() => setActiveFieldContextCollection(context.key)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        activeFieldContextCollection === context.key
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Database className="w-4 h-4 inline mr-1" />
                      {context.displayName}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select a collection to view its available fields for export
                </p>
              </div>
            )}

            {/* Selected Fields */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Selected Fields</h4>
              <div
                ref={drop}
                className={`min-h-32 p-4 border-2 border-dashed rounded-lg transition-colors ${
                  isOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                {exportConfig.selected_fields.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Drag fields here to include them in your export</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exportConfig.selected_fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {field.alias}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({field.collection}.{field.field})
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {field.category.replace('_', ' ')}
                          </div>
                        </div>
                        <button
                          onClick={() => onFieldRemove(field.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filters Configuration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Data Filters</h4>
                <button 
                  onClick={() => setShowFilterCreator(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Filter
                </button>
              </div>
              
              {/* Filter Creator Placeholder */}
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
                    setShowFilterCreator(false);
                    setEditingFilter(null);
                  }}
                  onCancel={() => {
                    setShowFilterCreator(false);
                    setEditingFilter(null);
                  }}
                />
              )}
              
              <div className="space-y-2">
                {exportConfig.filters.length === 0 ? (
                  <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
                    <Settings className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No filters configured</p>
                    <p className="text-xs text-gray-400">Add filters to refine your data export</p>
                  </div>
                ) : (
                  exportConfig.filters.map((filter) => (
                    <div
                      key={filter.id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50"
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
                          <div className="text-xs text-gray-400 mt-1">
                            {filter.conditions.map((condition, index) => (
                              <span key={condition.id}>
                                {condition.field} {condition.operator} {String(condition.value)}
                                {index < filter.conditions.length - 1 && ` ${filter.logic.toUpperCase()} `}
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
            </div>
            {/* Joins Configuration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Joins & Lookups</h4>
                <button 
                  onClick={onTriggerJoinCreation}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Join
                </button>
              </div>
              
              <div className="space-y-2">
                {exportConfig.joins.length === 0 ? (
                  <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
                    <Settings className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No joins configured</p>
                    <p className="text-xs text-gray-400">Add joins to include related data</p>
                  </div>
                ) : (
                  exportConfig.joins.map((join) => (
                    <div
                      key={join.id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {join.source_collection} → {join.target_collection}
                          </div>
                          <div className="text-xs text-gray-500">
                            {join.local_field} → {join.foreign_field}
                          </div>
                          {join.description && (
                            <div className="text-xs text-gray-400 mt-1">
                              {join.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onJoinRemove(join.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportConfigurationPreview;