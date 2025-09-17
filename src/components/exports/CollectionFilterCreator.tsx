import React, { useState, useEffect } from 'react';
import { X, Plus, Database, Filter, Trash2 } from 'lucide-react';
import { 
  CollectionsRelationshipsResponse, 
  CollectionFilter, 
  FilterCondition,
  FieldInfo 
} from '@/types/export';
import { exportService } from '@/services/export';
import toast from 'react-hot-toast';

interface CollectionFilterCreatorProps {
  collections: CollectionsRelationshipsResponse | null;
  availableCollectionsForFilter: { key: string; displayName: string }[];
  token: string | null;
  editingFilter?: CollectionFilter | null;
  onSave: (filter: CollectionFilter) => void;
  onCancel: () => void;
}

const CollectionFilterCreator: React.FC<CollectionFilterCreatorProps> = ({
  collections,
  availableCollectionsForFilter,
  token,
  editingFilter,
  onSave,
  onCancel
}) => {
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [logic, setLogic] = useState<'and' | 'or'>('and');
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [availableFields, setAvailableFields] = useState<FieldInfo[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Initialize form with editing filter data
  useEffect(() => {
    if (editingFilter) {
      setSelectedCollection(editingFilter.collection);
      setLogic(editingFilter.logic);
      setConditions(editingFilter.conditions);
    } else {
      // Reset form for new filter
      setSelectedCollection('');
      setLogic('and');
      setConditions([]);
    }
  }, [editingFilter]);

  // Reset selected collection if it's no longer available
  useEffect(() => {
    if (selectedCollection && !availableCollectionsForFilter.find(c => c.key === selectedCollection)) {
      setSelectedCollection('');
      setConditions([]);
    }
  }, [selectedCollection, availableCollectionsForFilter]);
  // Load available fields when collection changes
  useEffect(() => {
    const loadFields = async () => {
      if (!token || !selectedCollection) {
        setAvailableFields([]);
        return;
      }

      try {
        setLoadingFields(true);
        const data = await exportService.getFieldSuggestions(token, selectedCollection);
        setAvailableFields(data.available_fields || []);
      } catch (error) {
        console.error('Error loading fields for filter:', error);
        toast.error('Gagal memuat field untuk filter');
        setAvailableFields([]);
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [token, selectedCollection]);

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCollection = e.target.value;
    setSelectedCollection(newCollection);
    // Reset conditions when collection changes
    setConditions([]);
  };

  const handleAddCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      field: '',
      operator: 'eq',
      value: '',
      options: ''
    };
    setConditions([...conditions, newCondition]);
  };

  const handleUpdateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map(condition => 
      condition.id === conditionId 
        ? { ...condition, ...updates }
        : condition
    ));
  };

  const handleRemoveCondition = (conditionId: string) => {
    setConditions(conditions.filter(condition => condition.id !== conditionId));
  };

  const handleSave = () => {
    // Validation
    if (!selectedCollection) {
      toast.error('Pilih collection terlebih dahulu');
      return;
    }

    if (conditions.length === 0) {
      toast.error('Tambahkan minimal satu kondisi filter');
      return;
    }

    // Validate all conditions
    const invalidConditions = conditions.filter(condition => 
      !condition.field || !condition.operator || condition.value === ''
    );

    if (invalidConditions.length > 0) {
      toast.error('Lengkapi semua kondisi filter');
      return;
    }

    const filter: CollectionFilter = {
      id: editingFilter?.id || `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      collection: selectedCollection,
      conditions,
      logic
    };

    onSave(filter);
  };

  const getOperatorOptions = () => [
    { value: 'eq', label: 'Equals (=)' },
    { value: 'ne', label: 'Not Equals (≠)' },
    { value: 'gt', label: 'Greater Than (>)' },
    { value: 'gte', label: 'Greater Than or Equal (≥)' },
    { value: 'lt', label: 'Less Than (<)' },
    { value: 'lte', label: 'Less Than or Equal (≤)' },
    { value: 'in', label: 'In (contains)' },
    { value: 'nin', label: 'Not In (not contains)' },
    { value: 'regex', label: 'Regex Pattern' },
    { value: 'exists', label: 'Field Exists' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Filter className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editingFilter ? 'Edit Filter' : 'Create Filter'}
              </h3>
              <p className="text-sm text-gray-600">
                Filter data berdasarkan kondisi yang Anda tentukan
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
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Collection Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Database className="w-4 h-4 inline mr-1" />
                Target Collection
              </label>
              {availableCollectionsForFilter.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                  <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No collections available for filtering</p>
                  <p className="text-xs text-gray-400">Please select a main collection and add joins first</p>
                </div>
              ) : (
              <select
                value={selectedCollection}
                onChange={handleCollectionChange}
                className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm appearance-none pr-8 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select collection to filter...</option>
                {availableCollectionsForFilter.map((collection) => (
                  <option key={collection.key} value={collection.key}>
                    {collection.displayName}
                  </option>
                ))}
              </select>
              )}
            </div>

            {/* Logic Selection */}
            {conditions.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition Logic
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="logic"
                      value="and"
                      checked={logic === 'and'}
                      onChange={(e) => setLogic(e.target.value as 'and' | 'or')}
                      className="mr-2"
                    />
                    <span className="text-sm">AND (all conditions must match)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      disabled
                      type="radio"
                      name="logic"
                      value="or"
                      checked={logic === 'or'}
                      onChange={(e) => setLogic(e.target.value as 'and' | 'or')}
                      className="mr-2"
                    />
                    <span className="text-sm">OR (any condition can match)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Conditions */}
            {availableCollectionsForFilter.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter Conditions
                  </label>
                  <button
                    onClick={handleAddCondition}
                    disabled={!selectedCollection}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Condition
                  </button>
                </div>

                {conditions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No conditions added yet</p>
                    <p className="text-xs text-gray-400">Select a collection and add conditions to filter data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conditions.map((condition, index) => (
                      <div key={condition.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Condition {index + 1}
                          </span>
                          <button
                            onClick={() => handleRemoveCondition(condition.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {/* Field Selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Field
                            </label>
                            <select
                              value={condition.field}
                              onChange={(e) => handleUpdateCondition(condition.id, { field: e.target.value })}
                              disabled={loadingFields}
                              className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm appearance-none pr-8 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">Select field...</option>
                              {availableFields.map((field) => (
                                <option key={field.field} value={field.field}>
                                  {field.alias} ({field.field})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Operator Selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Operator
                            </label>
                            <select
                              value={condition.operator}
                              onChange={(e) => handleUpdateCondition(condition.id, { operator: e.target.value as any })}
                              className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm appearance-none pr-8 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              {getOperatorOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Value Input */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Value
                            </label>
                            <input
                              type="text"
                              value={condition.value}
                              onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
                              placeholder="Enter value..."
                              disabled={condition.operator === 'exists'}
                              className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </div>

                          {/* Options Input */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Options
                            </label>
                            <input
                              type="text"
                              value={condition.options || ''}
                              onChange={(e) => handleUpdateCondition(condition.id, { options: e.target.value })}
                              placeholder="Optional..."
                              className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Condition Preview */}
                        {condition.field && condition.operator && condition.value && (
                          <div className="mt-3 p-2 bg-white rounded border text-xs text-gray-600">
                            <strong>Preview:</strong> {condition.field} {condition.operator} "{condition.value}"
                            {condition.options && ` (options: ${condition.options})`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedCollection || conditions.length === 0 || availableCollectionsForFilter.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingFilter ? 'Update Filter' : 'Create Filter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionFilterCreator;