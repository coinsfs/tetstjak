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
  onFieldAdd: (field: SelectedField) => void;
  onFieldRemove: (fieldId: string) => void;
  onJoinAdd: (join: JoinConfiguration) => void;
  onJoinRemove: (joinId: string) => void;
  onFilterAdd: (filter: CollectionFilter) => void;
  onFilterRemove: (filterId: string) => void;
  onFilterUpdate: (filterId: string, updatedFilter: CollectionFilter) => void;
  token: string | null;
}

const ExportConfigurationPreview: React.FC<ExportConfigurationPreviewProps> = ({
  exportConfig,
  collections,
  availableFieldContexts,
  activeFieldContextCollection,
  setActiveFieldContextCollection,
  onFieldAdd,
  onFieldRemove,
  onJoinAdd,
  onJoinRemove,
  onFilterAdd,
  onFilterRemove,
  onFilterUpdate,
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
  
  // New states for suggested vs custom join
  const [joinMethod, setJoinMethod] = React.useState<'suggested' | 'custom'>('suggested');
  const [availablePossibleJoins, setAvailablePossibleJoins] = React.useState<any[]>([]);
  const [selectedPossibleJoin, setSelectedPossibleJoin] = React.useState<any | null>(null);
  
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

  // Get collections that can be used as join sources (main collection + existing join targets)
  const getJoinSourceCollections = () => {
    if (!collections) return [];
    
    // Return all available collections from the endpoint
    const allCollections = Object.entries(collections.relationships).map(([key, info]) => ({
      key,
      display_name: info.display_name
    }));

    // Sort to put main collection first if it exists
    if (exportConfig.main_collection) {
      const mainCollectionIndex = allCollections.findIndex(c => c.key === exportConfig.main_collection);
      if (mainCollectionIndex > -1) {
        const mainCollection = allCollections.splice(mainCollectionIndex, 1)[0];
        allCollections.unshift({
          ...mainCollection,
          display_name: `${mainCollection.display_name} (Main Collection)`
        });
      }
    }
    
    return allCollections;
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
    // Don't reset joinMethod - let user keep their preference
    setAvailablePossibleJoins([]);
    setSelectedPossibleJoin(null);
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
      
      // Get available possible joins for this source -> target combination
      const targetCollections = getJoinTargetCollections(currentJoinSourceCollection);
      const selectedTarget = targetCollections.find(t => t.key === targetCollection);
      
      // Find all possible joins from source to target
      const sourceCollection = collections?.relationships[currentJoinSourceCollection];
      const possibleJoins = sourceCollection?.possible_joins?.filter(join => 
        join.collection === targetCollection
      ) || [];
      
      setAvailablePossibleJoins(possibleJoins);
      
      if (possibleJoins.length > 0) {
        // Only auto-select if user hasn't chosen custom method
        if (joinMethod === 'suggested') {
          setSelectedPossibleJoin(possibleJoins[0]);
          setCurrentJoinLocalField(possibleJoins[0].suggested_local_field);
          setCurrentJoinForeignField(possibleJoins[0].suggested_foreign_field);
        }
      } else {
        // No suggestions available, switch to custom method
        setJoinMethod('custom');
        setSelectedPossibleJoin(null);
        setCurrentJoinLocalField('');
        setCurrentJoinForeignField('');
      }
      
    } catch (error) {
      console.error('Error loading join fields:', error);
      toast.error('Gagal memuat field untuk join');
    } finally {
      setLoadingJoinFields(false);
    }
  };

  const handleJoinMethodChange = (method: 'suggested' | 'custom') => {
    setJoinMethod(method);
    
    if (method === 'suggested' && availablePossibleJoins.length > 0) {
      // Auto-select first suggested join
      setSelectedPossibleJoin(availablePossibleJoins[0]);
      setCurrentJoinLocalField(availablePossibleJoins[0].suggested_local_field);
      setCurrentJoinForeignField(availablePossibleJoins[0].suggested_foreign_field);
    } else if (method === 'custom') {
      // Clear suggested selection
      setSelectedPossibleJoin(null);
      setCurrentJoinLocalField('');
      setCurrentJoinForeignField('');
    }
  };

  const handlePossibleJoinSelect = (possibleJoin: any) => {
    setSelectedPossibleJoin(possibleJoin);
    setCurrentJoinLocalField(possibleJoin.suggested_local_field);
    setCurrentJoinForeignField(possibleJoin.suggested_foreign_field);
  };

  const handleConfirmAddJoin = () => {
    if (!currentJoinSourceCollection || !currentJoinTargetCollection) {
      return;
    }

    let joinConfig: JoinConfiguration;
    
    if (joinMethod === 'suggested' && selectedPossibleJoin) {
      // Use suggested join configuration
      joinConfig = {
        id: `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source_collection: currentJoinSourceCollection,
        target_collection: currentJoinTargetCollection,
        local_field: selectedPossibleJoin.suggested_local_field,
        foreign_field: selectedPossibleJoin.suggested_foreign_field,
        relationship_type: selectedPossibleJoin.relationship_type,
        description: selectedPossibleJoin.description,
        selected_fields: []
      };
    } else if (joinMethod === 'custom' && currentJoinLocalField && currentJoinForeignField) {
      // Use custom join configuration
      joinConfig = {
        id: `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source_collection: currentJoinSourceCollection,
        target_collection: currentJoinTargetCollection,
        local_field: currentJoinLocalField,
        foreign_field: currentJoinForeignField,
        relationship_type: 'custom',
        description: `Custom join ${currentJoinSourceCollection} to ${currentJoinTargetCollection}`,
        selected_fields: []
      };
    } else {
      return; // Invalid configuration
    }

    onJoinAdd(joinConfig);
    
    // Reset all join creator state
    setShowJoinCreator(false);
    setCurrentJoinSourceCollection('');
    setCurrentJoinTargetCollection('');
    setCurrentJoinLocalField('');
    setCurrentJoinForeignField('');
    setSourceCollectionFields([]);
    setTargetCollectionFields([]);
    setJoinMethod('suggested');
    setAvailablePossibleJoins([]);
    setSelectedPossibleJoin(null);
  };

  const handleCancelJoinCreation = () => {
    setShowJoinCreator(false);
    setCurrentJoinSourceCollection('');
    setCurrentJoinTargetCollection('');
    setCurrentJoinLocalField('');
    setCurrentJoinForeignField('');
    setSourceCollectionFields([]);
    setTargetCollectionFields([]);
    setJoinMethod('suggested');
    setAvailablePossibleJoins([]);
    setSelectedPossibleJoin(null);
  };

  const canConfirmJoin = currentJoinSourceCollection && currentJoinTargetCollection && 
                        ((joinMethod === 'suggested' && selectedPossibleJoin) ||
                         (joinMethod === 'custom' && currentJoinLocalField && currentJoinForeignField));

  const joinSourceCollections = getJoinSourceCollections();
  const joinTargetCollections = getJoinTargetCollections(currentJoinSourceCollection);

  // Filter fields for dropdowns
  const getFieldOptions = (fields: FieldInfo[], forCustomJoin: boolean = false) => {
    if (forCustomJoin) {
      // For custom join, return all available fields
      return fields;
    } else {
      // For suggested join dropdowns, filter to relevant fields
      return fields.filter(field => 
        field.category === 'recommended' || 
        field.field.includes('id') || 
        field.field.includes('_id')
      );
    }
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
                  onClick={handleAddJoinClick}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Join
                </button>
              </div>
              
              {/* Join Collection Picker */}
              {showJoinCreator && (
                <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">Create Join Configuration</h5>
                    <button
                      onClick={handleCancelJoinCreation}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Join From */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Join From
                      </label>
                      <select
                        value={currentJoinSourceCollection}
                        onChange={handleJoinSourceChange}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select source collection...</option>
                        {joinSourceCollections.map((collection) => (
                          <option key={collection.key} value={collection.key}>
                            {collection.display_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Join To */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Join To
                      </label>
                      <select
                        value={currentJoinTargetCollection}
                        onChange={handleJoinTargetChange}
                        disabled={!currentJoinSourceCollection}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select target collection...</option>
                        {joinTargetCollections.map((collection) => (
                          <option key={collection.key} value={collection.key}>
                            {collection.display_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Join Method Selection */}
                    {currentJoinTargetCollection && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Join Method
                        </label>
                        <div className="flex gap-4 mb-3">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="joinMethod"
                              value="suggested"
                              checked={joinMethod === 'suggested'}
                              onChange={() => handleJoinMethodChange('suggested')}
                              disabled={availablePossibleJoins.length === 0}
                              className="mr-2"
                            />
                            <span className={`text-sm ${availablePossibleJoins.length === 0 ? 'text-gray-400' : ''}`}>
                              Suggested Joins {availablePossibleJoins.length === 0 ? '(None available)' : `(${availablePossibleJoins.length})`}
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="joinMethod"
                              value="custom"
                              checked={joinMethod === 'custom'}
                              onChange={() => handleJoinMethodChange('custom')}
                              className="mr-2"
                            />
                            <span className="text-sm">Custom Join</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Suggested Joins */}
                    {currentJoinTargetCollection && joinMethod === 'suggested' && availablePossibleJoins.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Available Join Options
                        </label>
                        <div className="space-y-2 mb-3">
                          {availablePossibleJoins.map((possibleJoin, index) => (
                            <label key={index} className="flex items-start p-2 border rounded cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="possibleJoin"
                                checked={selectedPossibleJoin === possibleJoin}
                                onChange={() => handlePossibleJoinSelect(possibleJoin)}
                                className="mr-2 mt-1"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {possibleJoin.suggested_local_field} → {possibleJoin.suggested_foreign_field}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {possibleJoin.description}
                                </div>
                                <div className="text-xs text-blue-600">
                                  Type: {possibleJoin.relationship_type}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Join Fields */}
                    {currentJoinTargetCollection && joinMethod === 'custom' && !loadingJoinFields && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Local Field ({currentJoinSourceCollection})
                        </label>
                        <select
                          value={currentJoinLocalField}
                          onChange={(e) => setCurrentJoinLocalField(e.target.value)}
                          className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select local field...</option>
                          {getFieldOptions(sourceCollectionFields, true).map((field) => (
                            <option key={field.field} value={field.field}>
                              {field.alias} ({field.field})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {currentJoinTargetCollection && joinMethod === 'custom' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Foreign Field ({currentJoinTargetCollection})
                        </label>
                        <select
                          value={currentJoinForeignField}
                          onChange={(e) => setCurrentJoinForeignField(e.target.value)}
                          className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select foreign field...</option>
                          {getFieldOptions(targetCollectionFields, true).map((field) => (
                            <option key={field.field} value={field.field}>
                              {field.alias} ({field.field})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleConfirmAddJoin}
                        disabled={!canConfirmJoin || loadingJoinFields}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {loadingJoinFields ? 'Loading...' : 'Add Join'}
                      </button>
                      <button
                        onClick={handleCancelJoinCreation}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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