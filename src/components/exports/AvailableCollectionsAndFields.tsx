import React, { useState, useEffect } from 'react';
import { Database, ChevronDown, ChevronRight, Layers } from 'lucide-react';
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['recommended']));

  // Load field suggestions when main collection changes
  useEffect(() => {
    const loadFieldSuggestions = async () => {
      if (!token || !collectionToDisplayFieldsFor) {
        setFieldSuggestions(null);
        return;
      }

      try {
        setLoadingFields(true);
        const data = await exportService.getFieldSuggestions(token, collectionToDisplayFieldsFor);
        setFieldSuggestions(data);
      } catch (error) {
        console.error('Error loading field suggestions:', error);
        toast.error('Gagal memuat field suggestions');
      } finally {
        setLoadingFields(false);
      }
    };

    loadFieldSuggestions();
  }, [token, collectionToDisplayFieldsFor]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getCategoryFields = (category: string): FieldInfo[] => {
    if (!fieldSuggestions) return [];
    
    if (category === 'recommended') {
      return fieldSuggestions.smart_suggestions.recommended.map(fieldName => {
        const field = fieldSuggestions.available_fields.find(f => f.field === fieldName);
        return field || { field: fieldName, alias: fieldName, category: 'recommended' };
      });
    }
    
    if (category === 'optional') {
      return fieldSuggestions.smart_suggestions.optional.map(fieldName => {
        const field = fieldSuggestions.available_fields.find(f => f.field === fieldName);
        return field || { field: fieldName, alias: fieldName, category: 'optional' };
      });
    }
    
    if (category === 'advanced') {
      return fieldSuggestions.smart_suggestions.advanced.map(fieldName => {
        const field = fieldSuggestions.available_fields.find(f => f.field === fieldName);
        return field || { field: fieldName, alias: fieldName, category: 'advanced' };
      });
    }

    return fieldSuggestions.available_fields.filter(f => f.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'recommended': return '⭐';
      case 'optional': return '📋';
      case 'advanced': return '⚙️';
      case 'user_info': return '👤';
      case 'timestamps': return '🕒';
      default: return '📄';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'recommended': return 'Recommended Fields';
      case 'optional': return 'Optional Fields';
      case 'advanced': return 'Advanced Fields';
      case 'user_info': return 'User Information';
      case 'timestamps': return 'Timestamps';
      case 'other': return 'Other Fields';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
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
            <div className="space-y-2">
              {/* Smart Suggestions Categories */}
              {['recommended', 'optional', 'advanced'].map(category => {
                const fields = getCategoryFields(category);
                if (fields.length === 0) return null;

                const isExpanded = expandedCategories.has(category);
                
                return (
                  <div key={category} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{getCategoryIcon(category)}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {getCategoryLabel(category)}
                        </span>
                        <span className="text-xs text-gray-500">({fields.length})</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-3 pb-2 space-y-1 border-t border-gray-100">
                        {fields.map((field, index) => (
                          <FieldItem
                            key={`${category}-${field.field}-${index}`}
                            field={field}
                            collection={collectionToDisplayFieldsFor}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Regular Categories */}
              {Array.from(new Set(fieldSuggestions.available_fields.map(f => f.category)))
                .filter(cat => !['recommended', 'optional', 'advanced'].includes(cat))
                .map(category => {
                  const fields = getCategoryFields(category);
                  if (fields.length === 0) return null;

                  const isExpanded = expandedCategories.has(category);
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getCategoryIcon(category)}</span>
                          <span className="text-sm font-medium text-gray-700">
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-xs text-gray-500">({fields.length})</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-3 pb-2 space-y-1 border-t border-gray-100">
                          {fields.map((field, index) => (
                            <FieldItem
                              key={`${category}-${field.field}-${index}`}
                              field={field}
                              collection={selectedMainCollection}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailableCollectionsAndFields;