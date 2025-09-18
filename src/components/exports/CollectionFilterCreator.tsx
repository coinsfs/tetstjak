import React, { useState, useEffect } from 'react';
import { X, Plus, Database, Filter, Trash2 } from 'lucide-react';
import AsyncSelect from 'react-select/async';
import useDebounce from '@/hooks/useDebounce';
import SearchableDropdown from './SearchableDropdown';
import { 
  CollectionsRelationshipsResponse, 
  CollectionFilter, 
  FilterCondition,
  FieldInfo 
} from '@/types/export';
import { exportService } from '@/services/export';
import { userService } from '@/services/user';
import { studentExamService } from '@/services/studentExam';
import { useAuth } from '@/contexts/AuthContext';
import { convertWIBToUTC, convertUTCToWIB, getCurrentWIBDateTime } from '@/utils/timezone';
import toast from 'react-hot-toast';

interface CollectionFilterCreatorProps {
  collections: CollectionsRelationshipsResponse | null;
  availableCollectionsForFilter: { key: string; displayName: string }[];
  token: string | null;
  editingFilter?: CollectionFilter | null;
  onSave: (filter: CollectionFilter) => void;
  onCancel: () => void;
}

interface LookupOption {
  value: string;
  label: string;
}

const CollectionFilterCreator: React.FC<CollectionFilterCreatorProps> = ({
  collections,
  availableCollectionsForFilter,
  token,
  editingFilter,
  onSave,
  onCancel
}) => {
  const { token: authToken } = useAuth();
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [logic, setLogic] = useState<'and' | 'or'>('and');
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [availableFields, setAvailableFields] = useState<FieldInfo[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  
  // Lookup data states
  const [basicStudents, setBasicStudents] = useState<LookupOption[]>([]);
  const [basicTeachers, setBasicTeachers] = useState<LookupOption[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<LookupOption[]>([]);
  const [loadingLookupData, setLoadingLookupData] = useState(false);
  
  // Search states for debounced lookup
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState<string>('');
  const debouncedStudentSearchTerm = useDebounce(studentSearchTerm, 500);
  const debouncedTeacherSearchTerm = useDebounce(teacherSearchTerm, 500);

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

  // Load academic periods (no search needed)
  useEffect(() => {
    const fetchAcademicPeriods = async () => {
      if (!authToken) return;
      
      try {
        setLoadingLookupData(true);
        const periods = await studentExamService.getAcademicPeriods(authToken);
        
        setAcademicPeriods(periods.map(p => ({ 
          value: p._id, 
          label: `${p.year} - ${p.semester}` 
        })));
      } catch (error) {
        console.error('Error fetching academic periods:', error);
        toast.error('Gagal memuat periode akademik');
      } finally {
        setLoadingLookupData(false);
      }
    };

    fetchAcademicPeriods();
  }, [authToken]);

  // Load students with debounced search
  useEffect(() => {
    const fetchStudents = async () => {
      if (!authToken) return;
      
      try {
        const students = await userService.getBasicStudents(authToken, debouncedStudentSearchTerm);
        setBasicStudents(students.map(s => ({ 
          value: s._id, 
          label: `${s.full_name}${s.class_name ? ` (${s.class_name})` : ''}` 
        })));
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Gagal memuat data siswa');
      }
    };

    fetchStudents();
  }, [authToken, debouncedStudentSearchTerm]);

  // Load teachers with debounced search
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!authToken) return;
      
      try {
        const teachers = await userService.getBasicTeachers(authToken, debouncedTeacherSearchTerm);
        setBasicTeachers(teachers.map(t => ({ 
          value: t._id, 
          label: t.full_name 
        })));
      } catch (error) {
        console.error('Error fetching teachers:', error);
        toast.error('Gagal memuat data guru');
      }
    };

    fetchTeachers();
  }, [authToken, debouncedTeacherSearchTerm]);

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
      valueType: 'text',
      options: ''
    };
    setConditions([...conditions, newCondition]);
  };

  const handleUpdateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    // If valueType is changing, reset the value
    if (updates.valueType && updates.valueType !== conditions.find(c => c.id === conditionId)?.valueType) {
      updates.value = '';
    }
    
    // Convert datetime values from WIB to UTC
    if (updates.value && updates.valueType === 'datetime') {
      try {
        updates.value = convertWIBToUTC(updates.value);
      } catch (error) {
        console.error('Error converting datetime:', error);
      }
    }
    
    setConditions(conditions.map(condition => 
      condition.id === conditionId 
        ? { ...condition, ...updates }
        : condition
    ));
  };

  const handleRemoveCondition = (conditionId: string) => {
    setConditions(conditions.filter(condition => condition.id !== conditionId));
  };

  const getOperatorOptions = (valueType?: string) => {
    const baseOperators = [
      { value: 'eq', label: 'Equals (=)' },
      { value: 'ne', label: 'Not Equals (≠)' },
      { value: 'exists', label: 'Field Exists' }
    ];
    
    const numericOperators = [
      { value: 'gt', label: 'Greater Than (>)' },
      { value: 'gte', label: 'Greater Than or Equal (≥)' },
      { value: 'lt', label: 'Less Than (<)' },
      { value: 'lte', label: 'Less Than or Equal (≤)' }
    ];
    
    const textOperators = [
      { value: 'in', label: 'In (contains)' },
      { value: 'nin', label: 'Not In (not contains)' },
      { value: 'regex', label: 'Regex Pattern' }
    ];
    
    switch (valueType) {
      case 'number':
      case 'datetime':
        return [...baseOperators, ...numericOperators];
      case 'text':
        return [...baseOperators, ...textOperators];
      case 'boolean':
      case 'student':
      case 'teacher':
      case 'academic_period':
        return baseOperators;
      default:
        return [...baseOperators, ...numericOperators, ...textOperators];
    }
  };

  const renderValueInput = (condition: FilterCondition) => {
    const valueType = condition.valueType || 'text';
    
    // Don't show value input for 'exists' operator
    if (condition.operator === 'exists') {
      return null;
    }
    
    // Helper function to load student options
    const loadStudentOptions = async (inputValue: string) => {
      if (!authToken) return [];
      try {
        const students = await userService.getBasicStudents(authToken, inputValue);
        return students.map(s => ({
          value: s._id,
          label: `${s.full_name}${s.class_name ? ` (${s.class_name})` : ''}`
        }));
      } catch (error) {
        console.error('Error fetching students:', error);
        return [];
      }
    };
    
    // Helper function to load teacher options
    const loadTeacherOptions = async (inputValue: string) => {
      if (!authToken) return [];
      try {
        const teachers = await userService.getBasicTeachers(authToken, inputValue);
        return teachers.map(t => ({
          value: t._id,
          label: t.full_name
        }));
      } catch (error) {
        console.error('Error fetching teachers:', error);
        return [];
      }
    };
    
    switch (valueType) {
      case 'number':
        return (
          <input
            type="number"
            value={condition.value}
            onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
            placeholder="Enter number..."
            className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-l-md shadow-sm border-r-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
        );
        
      case 'boolean':
        return (
          <select
            value={condition.value}
            onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
            className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-l-md shadow-sm border-r-0 appearance-none pr-8 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          >
            <option value="">Select boolean...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
        
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={condition.value ? convertUTCToWIB(condition.value) : ''}
            onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value, valueType: 'datetime' })}
            className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-l-md shadow-sm border-r-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
        );
        
      case 'student':
        return (
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadStudentOptions}
            value={condition.value ? { value: condition.value, label: basicStudents.find(s => s.value === condition.value)?.label || condition.value } : null}
            onChange={(selectedOption) => handleUpdateCondition(condition.id, { value: selectedOption ? selectedOption.value : '' })}
            isClearable
            placeholder="Search students..."
            className="text-sm"
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: '38px',
                borderRadius: '0.375rem',
                borderColor: '#d1d5db',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: '#d1d5db'
                }
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999
              })
            }}
          />
        );
        
      case 'teacher':
        return (
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadTeacherOptions}
            value={condition.value ? { value: condition.value, label: basicTeachers.find(t => t.value === condition.value)?.label || condition.value } : null}
            onChange={(selectedOption) => handleUpdateCondition(condition.id, { value: selectedOption ? selectedOption.value : '' })}
            isClearable
            placeholder="Search teachers..."
            className="text-sm"
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: '38px',
                borderRadius: '0.375rem',
                borderColor: '#d1d5db',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: '#d1d5db'
                }
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999
              })
            }}
          />
        );
        
      case 'academic_period':
        return (
          <SearchableDropdown
            value={condition.value}
            onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
            disabled={loadingLookupData}
            className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm appearance-none pr-8 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select academic period...</option>
            {academicPeriods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        );
        
      case 'text':
      default:
        return (
          <input
            type="text"
            value={condition.value}
            onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
            placeholder="Enter value..."
            className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-l-md shadow-sm border-r-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
        );
    }
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

  const getValueTypeOptions = () => [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'datetime', label: 'Date/Time' },
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'academic_period', label: 'Academic Period' }
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

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                              {getOperatorOptions(condition.valueType).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Combined Value Input and Type Selection */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Value
                            </label>
                            <div className="flex rounded-md shadow-sm">
                              {renderValueInput(condition)}
                              <select
                                value={condition.valueType || 'text'}
                                onChange={(e) => handleUpdateCondition(condition.id, { valueType: e.target.value as any })}
                                className="px-3 py-2 text-xs text-gray-700 bg-gray-100 border border-gray-300 rounded-r-md border-l-0 appearance-none cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 min-w-[100px]"
                              >
                                {getValueTypeOptions().map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
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
                            <strong>Preview:</strong> {condition.field} {condition.operator} "{condition.value}" ({condition.valueType || 'text'})
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