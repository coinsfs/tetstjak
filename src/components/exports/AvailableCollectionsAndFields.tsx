import React, { useState, useEffect } from 'react';
import { Database, Layers } from 'lucide-react';
import { exportService } from '@/services/export';
import { 
  CollectionsRelationshipsResponse, 
  FieldSuggestionsResponse,
  FieldInfo 
} from '@/types/export';
import FieldItem from './FieldItem';
import toast from 'react-hot-toast';

interface AvailableCollectionsAndFieldsProps {
  collections: CollectionsRelationshipsResponse | null;
  selectedMainCollection: string;
  onMainCollectionChange: (collection: string) => void;
  collectionToDisplayFieldsFor: string;
  token: string | null;
}

const AvailableCollectionsAndFields: React.FC<AvailableCollectionsAndFieldsProps> = ({
  collections,
  selectedMainCollection,
  onMainCollectionChange,
  collectionToDisplayFieldsFor,
  token
}) => {
  const [fieldSuggestions, setFieldSuggestions] = useState<FieldSuggestionsResponse | null>(null);
  const [loadingFields, setLoadingFields] = useState(false);

  // Load field suggestions when main collection changes
  useEffect(() => {
    const loadFieldSuggestions = async () => {
      console.log('🔍 AvailableCollectionsAndFields - loadFieldSuggestions called');
      console.log('🔍 collectionToDisplayFieldsFor:', collectionToDisplayFieldsFor);
      console.log('🔍 token exists:', !!token);
      
      if (!token || !collectionToDisplayFieldsFor) {
        console.log('🔍 Clearing fieldSuggestions - no token or collection');
        setFieldSuggestions(null);
        return;
      }

      try {
        setLoadingFields(true);
        // Reset field suggestions to show loading state
        setFieldSuggestions(null);
        
        console.log('🔍 Calling exportService.getFieldSuggestions for:', collectionToDisplayFieldsFor);
        const data = await exportService.getFieldSuggestions(token, collectionToDisplayFieldsFor);
        console.log('🔍 Received field suggestions data:', data);
        console.log('🔍 Available fields count:', data.available_fields?.length || 0);
        setFieldSuggestions(data);
      } catch (error) {
        console.error('🔍 Error loading field suggestions:', error);
        toast.error('Gagal memuat field suggestions');
        setFieldSuggestions(null);
      } finally {
        console.log('🔍 Setting loadingFields to false');
        setLoadingFields(false);
      }
    };

    loadFieldSuggestions();
  }, [token, collectionToDisplayFieldsFor]);


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
    <div className="p-4 space-y-4">
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

          {fieldSuggestions && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {console.log('🔍 Rendering fields for collection:', collectionToDisplayFieldsFor)}
              {console.log('🔍 fieldSuggestions.available_fields:', fieldSuggestions.available_fields)}
              {fieldSuggestions.available_fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No fields available</p>
                </div>
              ) : (
                fieldSuggestions.available_fields.map((field, index) => (
                  <FieldItem
                    key={`${field.field}-${index}`}
                    field={field}
                    collection={collectionToDisplayFieldsFor}
                  />
                ))
              )}
            </div>
          )}

          {!fieldSuggestions && !loadingFields && collectionToDisplayFieldsFor && (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No field data available for {collectionToDisplayFieldsFor}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailableCollectionsAndFields;