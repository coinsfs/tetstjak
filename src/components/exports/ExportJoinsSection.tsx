import React from 'react';
import { Plus, Settings, X, Database } from 'lucide-react';
import { 
  ExportConfiguration, 
  JoinConfiguration,
  CollectionsRelationshipsResponse,
  FieldInfo
} from '@/types/export';
import { exportService } from '@/services/export';
import toast from 'react-hot-toast';

interface ExportJoinsSectionProps {
  exportConfig: ExportConfiguration;
  collections: CollectionsRelationshipsResponse | null;
  availableFieldContexts: { key: string; displayName: string }[];
  token: string | null;
  showJoinCreator: boolean;
  currentJoinSourceCollection: string;
  currentJoinTargetCollection: string;
  currentJoinLocalField: string;
  currentJoinForeignField: string;
  sourceCollectionFields: FieldInfo[];
  targetCollectionFields: FieldInfo[];
  loadingJoinFields: boolean;
  joinMethod: 'suggested' | 'custom';
  availablePossibleJoins: any[];
  selectedPossibleJoin: any | null;
  onJoinAdd: (join: JoinConfiguration) => void;
  onJoinRemove: (joinId: string) => void;
  onShowJoinCreator: (show: boolean) => void;
  onJoinSourceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onJoinTargetChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onJoinMethodChange: (method: 'suggested' | 'custom') => void;
  onPossibleJoinSelect: (possibleJoin: any) => void;
  onJoinLocalFieldChange: (field: string) => void;
  onJoinForeignFieldChange: (field: string) => void;
  onConfirmAddJoin: () => void;
  onCancelJoinCreation: () => void;
  getJoinSourceCollections: () => { key: string; display_name: string }[];
  getJoinTargetCollections: (sourceCollectionKey: string) => any[];
}

const ExportJoinsSection: React.FC<ExportJoinsSectionProps> = ({
  exportConfig,
  collections,
  availableFieldContexts,
  token,
  showJoinCreator,
  currentJoinSourceCollection,
  currentJoinTargetCollection,
  currentJoinLocalField,
  currentJoinForeignField,
  sourceCollectionFields,
  targetCollectionFields,
  loadingJoinFields,
  joinMethod,
  availablePossibleJoins,
  selectedPossibleJoin,
  onJoinAdd,
  onJoinRemove,
  onShowJoinCreator,
  onJoinSourceChange,
  onJoinTargetChange,
  onJoinMethodChange,
  onPossibleJoinSelect,
  onJoinLocalFieldChange,
  onJoinForeignFieldChange,
  onConfirmAddJoin,
  onCancelJoinCreation,
  getJoinSourceCollections,
  getJoinTargetCollections
}) => {
  const joinSourceCollections = getJoinSourceCollections();
  const joinTargetCollections = getJoinTargetCollections(currentJoinSourceCollection);

  const canConfirmJoin = currentJoinSourceCollection && currentJoinTargetCollection && 
                        ((joinMethod === 'suggested' && selectedPossibleJoin) ||
                         (joinMethod === 'custom' && currentJoinLocalField && currentJoinForeignField));

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
      <div className="flex-shrink-0 bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">Joins & Lookups</h3>
          </div>
          <button 
            onClick={() => onShowJoinCreator(true)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Join
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Gabungkan data dari berbagai tabel</p>
      </div>

      {/* Join Creator Modal */}
      {showJoinCreator && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Join Configuration</h3>
                  <p className="text-sm text-gray-600">Gabungkan data dari berbagai koleksi</p>
                </div>
              </div>
              <button
                onClick={onCancelJoinCreation}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-4">
                {/* Join From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join From
                  </label>
                  <select
                    value={currentJoinSourceCollection}
                    onChange={onJoinSourceChange}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join To
                  </label>
                  <select
                    value={currentJoinTargetCollection}
                    onChange={onJoinTargetChange}
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
                          onChange={() => onJoinMethodChange('suggested')}
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
                          onChange={() => onJoinMethodChange('custom')}
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
                            onChange={() => onPossibleJoinSelect(possibleJoin)}
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
                        onChange={(e) => onJoinLocalFieldChange(e.target.value)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foreign Field ({currentJoinTargetCollection})
                      </label>
                      <select
                        value={currentJoinForeignField}
                        onChange={(e) => onJoinForeignFieldChange(e.target.value)}
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
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onCancelJoinCreation}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmAddJoin}
                disabled={!canConfirmJoin || loadingJoinFields}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingJoinFields ? 'Loading...' : 'Add Join'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {exportConfig.joins.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No joins configured</p>
              <p className="text-xs text-gray-400">Add joins to include related data</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="flex flex-row flex-nowrap overflow-x-auto gap-4 p-2 min-h-full">
              {exportConfig.joins.map((join) => (
                <div
                  key={join.id}
                  className="min-w-[280px] max-w-[320px] flex-shrink-0 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {join.source_collection} → {join.target_collection}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {join.local_field} → {join.foreign_field}
                      </div>
                    </div>
                    <button
                      onClick={() => onJoinRemove(join.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-2"
                      title="Remove join"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {join.description && (
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {join.description}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-blue-600">
                    Type: {join.relationship_type}
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

export default ExportJoinsSection;