import React from 'react';
import { Database, Layers } from 'lucide-react';
import { 
  CollectionsRelationshipsResponse, 
  FieldInfo
} from '@/types/export';
import FieldItem from './FieldItem';

interface AvailableFieldsPanelProps {
  collections: CollectionsRelationshipsResponse | null;
  selectedMainCollection: string;
  onMainCollectionChange: (collection: string) => void;
  collectionToDisplayFieldsFor: string;
  availableFields: FieldInfo[];
  loadingFields: boolean;
}

const AvailableFieldsPanel: React.FC<AvailableFieldsPanelProps> = ({
  collections,
  selectedMainCollection,
  onMainCollectionChange,
  collectionToDisplayFieldsFor,
  availableFields,
  loadingFields
}) => {
  console.log('🔍 AvailableFieldsPanel - Rendering with availableFields:', availableFields);

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
    </div>
  );
};

export default AvailableFieldsPanel;