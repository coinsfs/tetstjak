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

interface ExportConfigurationPreviewProps {
  exportConfig: ExportConfiguration;
  collections: CollectionsRelationshipsResponse | null;
  onFieldAdd: (field: SelectedField) => void;
  onFieldRemove: (fieldId: string) => void;
  onJoinAdd: (join: JoinConfiguration) => void;
  onJoinRemove: (joinId: string) => void;
  token: string | null;
}

const ExportConfigurationPreview: React.FC<ExportConfigurationPreviewProps> = ({
  exportConfig,
  collections,
  onFieldAdd,
  onFieldRemove,
  onJoinAdd,
  onJoinRemove,
  token
}) => {
  // Join Creator States
  const [showJoinCreator, setShowJoinCreator] = React.useState(false);
  const [currentJoinSourceCollection, setCurrentJoinSourceCollection] = React.useState<string>('');
  const [currentJoinTargetCollection, setCurrentJoinTargetCollection] = React.useState<string>('');
  const [currentJoinLocalField, setCurrentJoinLocalField] = React.useState<string>('');
  const [currentJoinForeignField, setCurrentJoinForeignField] = React.useState<string>('');
  const [sourceCollectionFields, setSourceCollectionFields] = React.useState<FieldInfo[]>([]);
  const [targetCollectionFields, setTargetCollectionFields] = React.useState<FieldInfo[]>([]);
  const [loadingJoinFields, setLoadingJoinFields] = React.useState(false);

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

  // Get collections that can be used as join sources (main collection + existing join targets)
  const getJoinSourceCollections = () => {
    const sources = [];
    
    // Add main collection
    if (exportConfig.main_collection) {
      sources.push({
        key: exportConfig.main_collection,
        display_name: collections?.relationships[exportConfig.main_collection]?.display_name || exportConfig.main_collection
      });
    }
    
    // Add existing join target collections
    exportConfig.joins.forEach(join => {
      if (!sources.find(s => s.key === join.target_collection)) {
        sources.push({
          key: join.target_collection,
          display_name: collections?.relationships[join.target_collection]?.display_name || join.target_collection
        });
      }
    });
    
    return sources;
  };

  // Get collections that can be joined from a specific source collection
  const getJoinTargetCollections = (sourceCollectionKey: string) => {
    if (!collections || !sourceCollectionKey) return [];
    
    const sourceCollection = collections.relationships[sourceCollectionKey];
    if (!sourceCollection || !sourceCollection.possible_joins) return [];
    
    return sourceCollection.possible_joins.map(join => ({
      key: join.collection,
      display_name: collections.relationships[join.collection]?.display_name || join.collection,
      suggested_local_field: join.suggested_local_field,
      suggested_foreign_field: join.suggested_foreign_field,
      relationship_type: join.relationship_type,
      description: join.description
    }));
  };
  const handleAddJoinClick = () => {
    setShowJoinCreator(true);
    // Set default source collection to main collection
    if (exportConfig.main_collection) {
      setCurrentJoinSourceCollection(exportConfig.main_collection);
    }
  };

  const handleJoinSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sourceCollection = e.target.value;
    setCurrentJoinSourceCollection(sourceCollection);
    
    // Reset dependent fields
    setCurrentJoinTargetCollection('');
    setCurrentJoinLocalField('');
    setCurrentJoinForeignField('');
    setSourceCollectionFields([]);
    setTargetCollectionFields([]);
  };

  const handleJoinTargetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetCollection = e.target.value;
    setCurrentJoinTargetCollection(targetCollection);
    
    if (!targetCollection || !token) return;
    
    try {
      setLoadingJoinFields(true);
      
      // Get fields for both source and target collections
      const [sourceFields, targetFields] = await Promise.all([
        exportService.getFieldSuggestions(token, currentJoinSourceCollection),
        exportService.getFieldSuggestions(token, targetCollection)
      ]);
      
      setSourceCollectionFields(sourceFields.available_fields);
      setTargetCollectionFields(targetFields.available_fields);
      
      // Try to auto-fill suggested fields
      const targetCollections = getJoinTargetCollections(currentJoinSourceCollection);
      const selectedTarget = targetCollections.find(t => t.key === targetCollection);
      
      if (selectedTarget) {
        setCurrentJoinLocalField(selectedTarget.suggested_local_field);
        setCurrentJoinForeignField(selectedTarget.suggested_foreign_field);
      }
      
    } catch (error) {
      console.error('Error loading join fields:', error);
      toast.error('Gagal memuat field untuk join');
    } finally {
      setLoadingJoinFields(false);
    }
  };

  const handleConfirmAddJoin = () => {
    if (!currentJoinSourceCollection || !currentJoinTargetCollection || 
        !currentJoinLocalField || !currentJoinForeignField) {
      return;
    }

    // Find the relationship info for description
    const targetCollections = getJoinTargetCollections(currentJoinSourceCollection);
    const selectedTarget = targetCollections.find(t => t.key === currentJoinTargetCollection);
    
    const joinConfig: JoinConfiguration = {
      id: `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source_collection: currentJoinSourceCollection,
      target_collection: currentJoinTargetCollection,
      local_field: currentJoinLocalField,
      foreign_field: currentJoinForeignField,
      relationship_type: selectedTarget?.relationship_type || 'direct',
      description: selectedTarget?.description || `Join ${currentJoinSourceCollection} to ${currentJoinTargetCollection}`,
      selected_fields: []
    };

    onJoinAdd(joinConfig);
    
    // Reset all join creator state
    setShowJoinCreator(false);
    setCurrentJoinSourceCollection('');
    setCurrentJoinTargetCollection('');
    setCurrentJoinLocalField('');
    setCurrentJoinForeignField('');
    setSourceCollectionFields([]);
    setTargetCollectionFields([]);
  };

  const handleCancelJoinCreation = () => {
    setShowJoinCreator(false);
    setCurrentJoinSourceCollection('');
    setCurrentJoinTargetCollection('');
    setCurrentJoinLocalField('');
    setCurrentJoinForeignField('');
    setSourceCollectionFields([]);
    setTargetCollectionFields([]);
  };

  const canConfirmJoin = currentJoinSourceCollection && currentJoinTargetCollection && 
                        currentJoinLocalField && currentJoinForeignField;

  const joinSourceCollections = getJoinSourceCollections();
  const joinTargetCollections = getJoinTargetCollections(currentJoinSourceCollection);

  // Filter fields for dropdowns
  const getFieldOptions = (fields: FieldInfo[]) => {
    return fields.filter(field => 
      field.category === 'recommended' || 
      field.field.includes('id') || 
      field.field.includes('_id')
    );
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