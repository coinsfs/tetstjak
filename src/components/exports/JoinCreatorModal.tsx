import React, { useState, useEffect } from 'react';
import { X, Plus, Database, Settings } from 'lucide-react';
import { 
  CollectionsRelationshipsResponse, 
  JoinConfiguration,
  FieldInfo 
} from '@/types/export';
import { exportService } from '@/services/export';
import toast from 'react-hot-toast';

interface JoinCreatorModalProps {
  collections: CollectionsRelationshipsResponse | null;
  token: string | null;
  isOpen: boolean;
  existingJoins: JoinConfiguration[];
  mainCollection: string;
  onSave: (join: JoinConfiguration) => void;
  onCancel: () => void;
}

const JoinCreatorModal: React.FC<JoinCreatorModalProps> = ({
  collections,
  token,
  isOpen,
  existingJoins,
  mainCollection,
  onSave,
  onCancel
}) => {
  const [currentJoinSourceCollection, setCurrentJoinSourceCollection] = useState<string>('');
  const [currentJoinTargetCollection, setCurrentJoinTargetCollection] = useState<string>('');
  const [currentJoinLocalField, setCurrentJoinLocalField] = useState<string>('');
  const [currentJoinForeignField, setCurrentJoinForeignField] = useState<string>('');
  const [sourceCollectionFields, setSourceCollectionFields] = useState<FieldInfo[]>([]);
  const [targetCollectionFields, setTargetCollectionFields] = useState<FieldInfo[]>([]);
  const [loadingJoinFields, setLoadingJoinFields] = useState(false);
  const [joinMethod, setJoinMethod] = useState<'suggested' | 'custom'>('suggested');
  const [availablePossibleJoins, setAvailablePossibleJoins] = useState<any[]>([]);
  const [selectedPossibleJoin, setSelectedPossibleJoin] = useState<any | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentJoinSourceCollection(mainCollection);
      setCurrentJoinTargetCollection('');
      setCurrentJoinLocalField('');
      setCurrentJoinForeignField('');
      setSourceCollectionFields([]);
      setTargetCollectionFields([]);
      setJoinMethod('suggested');
      setAvailablePossibleJoins([]);
      setSelectedPossibleJoin(null);
    }
  }, [isOpen, mainCollection]);

  // Get collections that can be used as join sources (main collection + existing join targets)
  const getJoinSourceCollections = () => {
    if (!collections) return [];
    
    const sourceCollections: { key: string; display_name: string }[] = [];
    
    // Add main collection if it exists
    if (mainCollection) {
      const mainCollectionInfo = collections.relationships[mainCollection];
      sourceCollections.push({
        key: mainCollection,
        display_name: `${mainCollectionInfo?.display_name || mainCollection} (Main Collection)`
      });
    }
    
    // Add all joined collections as potential sources for further joins
    existingJoins.forEach(join => {
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

    onSave(joinConfig);
  };

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

  const canConfirmJoin = currentJoinSourceCollection && currentJoinTargetCollection && 
                        ((joinMethod === 'suggested' && selectedPossibleJoin) ||
                         (joinMethod === 'custom' && currentJoinLocalField && currentJoinForeignField));

  const joinSourceCollections = getJoinSourceCollections();
  const joinTargetCollections = getJoinTargetCollections(currentJoinSourceCollection);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create Join Configuration</h3>
              <p className="text-sm text-gray-600">
                Join collections to include related data in your export
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* Join From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join From
              </label>
              <select
                value={currentJoinSourceCollection}
                onChange={handleJoinSourceChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join To
              </label>
              <select
                value={currentJoinTargetCollection}
                onChange={handleJoinTargetChange}
                disabled={!currentJoinSourceCollection}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Join Options
                </label>
                <div className="space-y-2 mb-3">
                  {availablePossibleJoins.map((possibleJoin, index) => (
                    <label key={index} className="flex items-start p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="possibleJoin"
                        checked={selectedPossibleJoin === possibleJoin}
                        onChange={() => handlePossibleJoinSelect(possibleJoin)}
                        className="mr-3 mt-1"
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
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local Field ({currentJoinSourceCollection})
                  </label>
                  <select
                    value={currentJoinLocalField}
                    onChange={(e) => setCurrentJoinLocalField(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foreign Field ({currentJoinTargetCollection})
                  </label>
                  <select
                    value={currentJoinForeignField}
                    onChange={(e) => setCurrentJoinForeignField(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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

            {loadingJoinFields && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading fields...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAddJoin}
            disabled={!canConfirmJoin || loadingJoinFields}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingJoinFields ? 'Loading...' : 'Add Join'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinCreatorModal;