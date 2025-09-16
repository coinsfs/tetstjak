import React from 'react';
import { Database, Layers, Settings, Plus, X } from 'lucide-react';
import { 
  CollectionsRelationshipsResponse, 
  FieldInfo,
  CollectionFilter,
  JoinConfiguration
} from '@/types/export';
import FieldItem from './FieldItem';
import CollectionFilterCreator from './CollectionFilterCreator';
import JoinCreatorModal from './JoinCreatorModal';

interface AvailableCollectionsAndFieldsProps {
  collections: CollectionsRelationshipsResponse | null;
  selectedMainCollection: string;
  onMainCollectionChange: (collection: string) => void;
  collectionToDisplayFieldsFor: string;
  availableFields: FieldInfo[];
  loadingFields: boolean;
  filters: CollectionFilter[];
  joins: JoinConfiguration[];
  onFilterAdd: (filter: CollectionFilter) => void;
  onFilterRemove: (filterId: string) => void;
  onFilterUpdate: (filterId: string, updatedFilter: CollectionFilter) => void;
  onJoinAdd: (join: JoinConfiguration) => void;
  onJoinRemove: (joinId: string) => void;
  token: string | null;
}

const AvailableCollectionsAndFields: React.FC<AvailableCollectionsAndFieldsProps> = ({
  collections,
  selectedMainCollection,
  onMainCollectionChange,
  collectionToDisplayFieldsFor,
  availableFields,
  loadingFields,
  filters,
  joins,
  onFilterAdd,
  onFilterRemove,
  onFilterUpdate,
  onJoinAdd,
  onJoinRemove,
  token
}) => {
  const [showFilterCreator, setShowFilterCreator] = React.useState(false);
  const [editingFilter, setEditingFilter] = React.useState<CollectionFilter | null>(null);
  const [showJoinCreator, setShowJoinCreator] = React.useState(false);

  console.log('🔍 AvailableCollectionsAndFields - Rendering with availableFields:', availableFields);

  // Get available collections for filtering (main collection + joined collections)
  const getAvailableCollectionsForFilter = () => {
    if (!collections) return [];
    
    const contexts: { key: string; displayName: string }[] = [];
    
    // Add main collection if exists
    if (selectedMainCollection) {
      const mainCollectionInfo = collections.relationships[selectedMainCollection];
      contexts.push({
        key: selectedMainCollection,
        displayName: `${mainCollectionInfo?.display_name || selectedMainCollection} (Main)`
      });
    }

    // Add joined collections
    joins.forEach(join => {
      const targetCollectionInfo = collections.relationships[join.target_collection];
      const existingContext = contexts.find(c => c.key === join.target_collection);
      
      if (!existingContext) {
        contexts.push({
          key: join.target_collection,
          displayName: `${targetCollectionInfo?.display_name || join.target_collection} (Joined)`
        });
      }
    });

    return contexts;
  };

  if (!collections) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Collection Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Database className="w-4 h-4 inline mr-1" />
          Main Collection
        </label>
        <select
          value={selectedMainCollection}
          onChange={(e) => onMainCollectionChange(e.target.value)}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a collection...</option>
          {Object.entries(collections.relationships).map(([key, info]) => (
            <option key={key} value={key}>
              {info.display_name} ({info.total_joinable} joins available)
            </option>
          ))}
        </select>
      </div>

      {/* Field Suggestions */}
      {selectedMainCollection && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              <Layers className="w-4 h-4 inline mr-1" />
              Available Fields
            </h3>
            {loadingFields && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            )}
          </div>

          <div>
            {console.log('🔍 Rendering fields for collection:', collectionToDisplayFieldsFor)}
            {console.log('🔍 availableFields:', availableFields)}
            {(!availableFields || availableFields.length === 0) && !loadingFields ? (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {collectionToDisplayFieldsFor 
                    ? `All fields for ${collectionToDisplayFieldsFor} are already selected`
                    : 'No fields available'
                  }
                </p>
              </div>
            ) : (
              availableFields?.map((field, index) => (
                <FieldItem
                  key={`${field.field}-${index}`}
                  field={field}
                  collection={collectionToDisplayFieldsFor}
                />
              )) || null
            )}
          </div>
        </div>
      )}

      {/* Data Filters Section */}
      {selectedMainCollection && (
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
          
          <div className="space-y-2">
            {filters.length === 0 ? (
              <div className="p-3 border border-gray-200 rounded-lg text-center text-gray-500">
                <Settings className="w-5 h-5 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">No filters configured</p>
                <p className="text-xs text-gray-400">Add filters to refine your data export</p>
              </div>
            ) : (
              filters.map((filter) => (
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
      )}

      {/* Joins & Lookups Section */}
      {selectedMainCollection && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Joins & Lookups</h4>
            <button 
              onClick={() => setShowJoinCreator(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Join
            </button>
          </div>
          
          <div className="space-y-2">
            {joins.length === 0 ? (
              <div className="p-3 border border-gray-200 rounded-lg text-center text-gray-500">
                <Database className="w-5 h-5 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">No joins configured</p>
                <p className="text-xs text-gray-400">Add joins to include related data</p>
              </div>
            ) : (
              joins.map((join) => (
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
      )}

      {/* Filter Creator Modal */}
      {showFilterCreator && (
        <CollectionFilterCreator
          collections={collections}
          token={token}
          editingFilter={editingFilter}
          availableCollectionsForFilter={getAvailableCollectionsForFilter()}
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

      {/* Join Creator Modal */}
      <JoinCreatorModal
        collections={collections}
        token={token}
        isOpen={showJoinCreator}
        existingJoins={joins}
        mainCollection={selectedMainCollection}
        onSave={(join) => {
          onJoinAdd(join);
          setShowJoinCreator(false);
        }}
        onCancel={() => setShowJoinCreator(false)}
      />
    </div>
  );
};

export default AvailableCollectionsAndFields;