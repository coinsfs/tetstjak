import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Database, Settings, X } from 'lucide-react';
import { 
  ExportConfiguration, 
  SelectedField, 
  JoinConfiguration, 
  DragItem,
  CollectionsRelationshipsResponse 
} from '@/types/export';

interface ExportConfigurationPreviewProps {
  exportConfig: ExportConfiguration;
  collections: CollectionsRelationshipsResponse | null;
  onFieldAdd: (field: SelectedField) => void;
  onFieldRemove: (fieldId: string) => void;
  onJoinAdd: (join: JoinConfiguration) => void;
  onJoinRemove: (joinId: string) => void;
}

const ExportConfigurationPreview: React.FC<ExportConfigurationPreviewProps> = ({
  exportConfig,
  collections,
  onFieldAdd,
  onFieldRemove,
  onJoinAdd,
  onJoinRemove
}) => {
  const [showJoinCollectionPicker, setShowJoinCollectionPicker] = React.useState(false);
  const [selectedJoinTarget, setSelectedJoinTarget] = React.useState<string | null>(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'field', 
    drop: (item: DragItem) => {
      const selectedField: SelectedField = {
        id: `${item.field.collection}.${item.field.field}`,
        field: item.field.field,
        alias: item.field.alias,
        collection: item.field.collection,
        category: item.field.category
      };
      onFieldAdd(selectedField);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  const handleAddJoinClick = () => {
    setShowJoinCollectionPicker(true);
  };

  const handleJoinCollectionSelect = (targetCollectionKey: string) => {
    if (!collections || !targetCollectionKey) return;

    const targetCollectionInfo = collections.relationships[targetCollectionKey];
    if (!targetCollectionInfo || !targetCollectionInfo.possible_joins || targetCollectionInfo.possible_joins.length === 0) {
      return;
    }

    // Use the first possible join
    const firstJoin = targetCollectionInfo.possible_joins[0];
    
    // Create JoinConfiguration
    const joinConfig: JoinConfiguration = {
      id: `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      target_collection: targetCollectionKey,
      local_field: firstJoin.suggested_local_field,
      foreign_field: firstJoin.suggested_foreign_field,
      relationship_type: firstJoin.relationship_type,
      description: firstJoin.description,
      selected_fields: []
    };

    onJoinAdd(joinConfig);
    
    // Reset state
    setShowJoinCollectionPicker(false);
    setSelectedJoinTarget(null);
  };

  const handleCancelJoinSelection = () => {
    setShowJoinCollectionPicker(false);
    setSelectedJoinTarget(null);
  };

  // Get available collections for joining (exclude main collection)
  const getAvailableJoinCollections = () => {
    if (!collections || !exportConfig.main_collection) return [];
    
    return Object.entries(collections.relationships)
      .filter(([key, info]) => 
        key !== exportConfig.main_collection && 
        info.possible_joins && 
        info.possible_joins.length > 0
      )
      .map(([key, info]) => ({
        key,
        display_name: info.display_name,
        total_joinable: info.total_joinable
      }));
  };

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

            {/* Joins Configuration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Joins & Lookups</h4>
                <button 
                  onClick={handleAddJoinClick}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Join
                </button>
              </div>
              
              {/* Join Collection Picker */}
              {showJoinCollectionPicker && (
                <div className="mb-4 p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">Select Collection to Join</h5>
                    <button
                      onClick={handleCancelJoinSelection}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    value={selectedJoinTarget || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        handleJoinCollectionSelect(value);
                      }
                    }}
                    className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a collection to join...</option>
                    {getAvailableJoinCollections().map((collection) => (
                      <option key={collection.key} value={collection.key}>
                        {collection.display_name} ({collection.total_joinable} joins available)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
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
                            {join.target_collection}
                          </div>
                          <div className="text-xs text-gray-500">
                            {join.local_field} → {join.foreign_field}
                          </div>
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