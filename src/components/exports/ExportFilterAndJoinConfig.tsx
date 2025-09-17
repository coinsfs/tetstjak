import React, { useState, useEffect } from 'react';
import { Plus, Database, Settings, X, Trash2 } from 'lucide-react';
import { 
  ExportConfiguration, 
  JoinConfiguration, 
  CollectionFilter,
  CollectionsRelationshipsResponse,
  FieldInfo
} from '@/types/export';
import { exportService } from '@/services/export';
import toast from 'react-hot-toast';
import CollectionFilterCreator from './CollectionFilterCreator';

interface ExportFilterAndJoinConfigProps {
  exportConfig: ExportConfiguration;
  collections: CollectionsRelationshipsResponse | null;
  availableFieldContexts: { key: string; displayName: string }[];
  token: string | null;
  onJoinAdd: (join: JoinConfiguration) => void;
  onJoinRemove: (joinId: string) => void;
  onFilterAdd: (filter: CollectionFilter) => void;
  onFilterRemove: (filterId: string) => void;
  onFilterUpdate: (filterId: string, updatedFilter: CollectionFilter) => void;
}

const ExportFilterAndJoinConfig: React.FC<ExportFilterAndJoinConfigProps> = ({
  exportConfig,
  collections,
  availableFieldContexts,
  token,
  onJoinAdd,
  onJoinRemove,
  onFilterAdd,
  onFilterRemove,
  onFilterUpdate
}) => {
  // Join Creator States
  const [showJoinCreator, setShowJoinCreator] = useState(false);
  const [currentJoinSourceCollection, setCurrentJoinSourceCollection] = useState<string>('');
  const [currentJoinTargetCollection, setCurrentJoinTargetCollection] = useState<string>('');
  const [currentJoinLocalField, setCurrentJoinLocalField] = useState<string>('');
  const [currentJoinForeignField, setCurrentJoinForeignField] = useState<string>('');
  const [sourceCollectionFields, setSourceCollectionFields] = useState<FieldInfo[]>([]);
  const [targetCollectionFields, setTargetCollectionFields] = useState<FieldInfo[]>([]);
  const [loadingJoinFields, setLoadingJoinFields] = useState(false);
  
  // New states for suggested vs custom join
  const [joinMethod, setJoinMethod] = useState<'suggested' | 'custom'>('suggested');
  const [availablePossibleJoins, setAvailablePossibleJoins] = useState<any[]>([]);
  const [selectedPossibleJoin, setSelectedPossibleJoin] = useState<any | null>(null);
  
  // Filter Creator States
  const [showFilterCreator, setShowFilterCreator] = useState(false);
  const [editingFilter, setEditingFilter] = useState<CollectionFilter | null>(null);

  // Get collections that can be used as join sources (main collection + existing join targets)
  const getJoinSourceCollections = () => {
    if (!collections) return [];
    
    const sourceCollections: { key: string; display_name: string }[] = [];
    
    // Add main collection if it exists
    if (exportConfig.main_collection) {
      const mainCollectionInfo = collections.relationships[exportConfig.main_collection];
      sourceCollections.push({
        key: exportConfig.main_collection,
        display_name: `${mainCollectionInfo?.display_name || exportConfig.main_collection} (Main Collection)`
      });
    }
    
    // Add all joined collections as potential sources for further joins
    exportConfig.joins.forEach(join => {
      const joinCollectionInfo = collections.relationships[join.target_collection];
      // Avoid duplicates
      if (!sourceCollections.find(c => c.key === join.target_collection)) {
        sourceCollections.push({
          key: join.target_collection,
          display_name: `${joinCollectionInfo?.display_name || join.target_collection} (Joined Collection)`
        });
      }
    });
    
    return sourceCollections.map(({ key, display_name }) => ({
      key,
      display_name
    }));
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Configuration</h3>
        </div>
        <p className="text-sm text-gray-600">Configure filters and joins for your export</p>
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="flex h-80">
        {/* Data Filters - Left Half */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900">Data Filters</h4>
            <button 
              onClick={() => setShowFilterCreator(true)}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Filter
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {exportConfig.filters.length === 0 ? (
                <div className="flex-shrink-0 w-64 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                  <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No filters configured</p>
                  <p className="text-xs text-gray-400 mt-1">Add filters to refine your data export</p>
                </div>
              ) : (
                exportConfig.filters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex-shrink-0 w-64 p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {filter.collection} Filter
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
                    <div className="text-xs text-gray-500 mb-2">
                      {filter.conditions.length} condition{filter.conditions.length !== 1 ? 's' : ''} 
                      {filter.conditions.length > 1 && ` (${filter.logic.toUpperCase()})`}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      {filter.conditions.slice(0, 2).map((condition, index) => (
                        <div key={condition.id} className="truncate">
                          {condition.field} {condition.operator} {String(condition.value)}
                        </div>
                      ))}
                      {filter.conditions.length > 2 && (
                        <div className="text-gray-400">
                          +{filter.conditions.length - 2} more...
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Joins & Lookups - Right Half */}
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900">Joins & Lookups</h4>
            <button 
              onClick={handleAddJoinClick}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Join
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-x-auto">
            {/* Join Creator */}
            {showJoinCreator && (
              <div className="flex-shrink-0 w-96 mr-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between mb-3">
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
                            Suggested {availablePossibleJoins.length === 0 ? '(None)' : `(${availablePossibleJoins.length})`}
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
                          <span className="text-sm">Custom</span>
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
                      <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
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
                              <div className="text-xs text-gray-500 truncate">
                                {possibleJoin.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Join Fields */}
                  {currentJoinTargetCollection && joinMethod === 'custom' && !loadingJoinFields && (
                    <>
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
                    </>
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

            <div className="flex gap-4 min-w-max">
              {exportConfig.joins.length === 0 && !showJoinCreator ? (
                <div className="flex-shrink-0 w-64 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                  <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No joins configured</p>
                  <p className="text-xs text-gray-400 mt-1">Add joins to include related data</p>
                </div>
              ) : (
                exportConfig.joins.map((join) => (
                  <div
                    key={join.id}
                    className="flex-shrink-0 w-64 p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {join.source_collection} → {join.target_collection}
                      </div>
                      <button
                        onClick={() => onJoinRemove(join.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {join.local_field} → {join.foreign_field}
                    </div>
                    {join.description && (
                      <div className="text-xs text-gray-400 truncate">
                        {join.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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

export default ExportFilterAndJoinConfig;