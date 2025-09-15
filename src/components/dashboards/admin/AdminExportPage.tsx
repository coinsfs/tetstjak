import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Download, 
  Database, 
  FileText, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  Filter,
  Columns
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FieldSuggestion {
  field: string;
  alias: string;
  category: string;
}

interface FieldSuggestionsResponse {
  collection: string;
  available_fields: FieldSuggestion[];
  smart_suggestions: {
    recommended: string[];
    optional: string[];
    advanced: string[];
  };
  total_fields: number;
}

interface ExportConfig {
  main_collection: string;
  fields: string[];
  filters: any[];
  joins: any[];
  limit: number;
}

interface ExportRequest {
  config: ExportConfig;
  format: 'excel' | 'csv' | 'json';
  filename?: string;
  formatting?: {
    exclude_ids: boolean;
    use_aliases: boolean;
    flatten_nested: boolean;
    include_empty_fields: boolean;
  };
}

const AdminExportPage: React.FC = () => {
  const { token } = useAuth();
  const [selectedCollection, setSelectedCollection] = useState<string>('users');
  const [fieldSuggestions, setFieldSuggestions] = useState<FieldSuggestionsResponse | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'json'>('excel');
  const [filename, setFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Available collections
  const collections = [
    { value: 'users', label: 'Users (Students & Teachers)', description: 'User accounts and basic info' },
    { value: 'profiles', label: 'User Profiles', description: 'Detailed profile information' },
    { value: 'classes', label: 'Classes', description: 'Class information and assignments' },
    { value: 'exams', label: 'Exams', description: 'Exam data and configurations' },
    { value: 'exam_sessions', label: 'Exam Sessions', description: 'Student exam attempts and results' },
    { value: 'subjects', label: 'Subjects', description: 'Subject/course information' },
    { value: 'expertise_programs', label: 'Expertise Programs', description: 'Department/major information' }
  ];

  // Load field suggestions when collection changes
  useEffect(() => {
    if (selectedCollection && token) {
      loadFieldSuggestions();
    }
  }, [selectedCollection, token]);

  const loadFieldSuggestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/admin/exports/fields/suggestions/${selectedCollection}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load field suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      setFieldSuggestions(data);
      
      // Auto-select recommended fields
      setSelectedFields(data.smart_suggestions.recommended || []);
      
    } catch (error) {
      console.error('Error loading field suggestions:', error);
      toast.error('Failed to load field suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const validateExportConfig = async () => {
    if (!token || selectedFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    try {
      setIsValidating(true);
      
      const config: ExportConfig = {
        main_collection: selectedCollection,
        fields: selectedFields,
        filters: [],
        joins: [],
        limit: 1000
      };

      const response = await fetch('/api/v1/admin/exports/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setValidationResult(result);
      
      if (result.valid) {
        toast.success('Configuration is valid!');
      } else {
        toast.error('Configuration has errors');
      }
      
    } catch (error) {
      console.error('Error validating config:', error);
      toast.error('Failed to validate configuration');
    } finally {
      setIsValidating(false);
    }
  };

  const executeExport = async () => {
    if (!token || selectedFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    try {
      setIsLoading(true);
      
      const exportRequest: ExportRequest = {
        config: {
          main_collection: selectedCollection,
          fields: selectedFields,
          filters: [],
          joins: [],
          limit: 1000
        },
        format: exportFormat,
        filename: filename || `${selectedCollection}_export`,
        formatting: {
          exclude_ids: true,
          use_aliases: true,
          flatten_nested: true,
          include_empty_fields: false
        }
      };

      const response = await fetch('/api/v1/admin/exports/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportRequest)
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Export completed! ${result.record_count} records exported.`);
        
        if (result.file_url) {
          // Download file
          const link = document.createElement('a');
          link.href = result.file_url;
          link.download = `${filename || 'export'}.${exportFormat}`;
          link.click();
        }
      } else {
        toast.error('Export failed');
      }
      
    } catch (error) {
      console.error('Error executing export:', error);
      toast.error('Failed to execute export');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const getFieldsByCategory = (category: string) => {
    if (!fieldSuggestions) return [];
    return fieldSuggestions.available_fields.filter(f => f.category === category);
  };

  const categories = fieldSuggestions ? 
    [...new Set(fieldSuggestions.available_fields.map(f => f.category))] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Data Export System</h2>
            <p className="text-gray-600">Export data from multiple collections with advanced filtering and formatting</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Multiple Collections</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">Export from users, profiles, classes, and more</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Columns className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Smart Field Selection</span>
            </div>
            <p className="text-sm text-green-700 mt-1">Indonesian aliases and categorized fields</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Multiple Formats</span>
            </div>
            <p className="text-sm text-purple-700 mt-1">Excel, CSV, and JSON export options</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Collection Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Select Collection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {collections.map((collection) => (
                <button
                  key={collection.value}
                  onClick={() => setSelectedCollection(collection.value)}
                  className={`p-4 text-left border rounded-lg transition-all ${
                    selectedCollection === collection.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{collection.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{collection.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          {fieldSuggestions && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">2. Select Fields</h3>
                <div className="text-sm text-gray-500">
                  {selectedFields.length} of {fieldSuggestions.total_fields} fields selected
                </div>
              </div>
              
              {categories.map((category) => {
                const categoryFields = getFieldsByCategory(category);
                if (categoryFields.length === 0) return null;
                
                return (
                  <div key={category} className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3 capitalize">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryFields.map((field) => (
                        <label
                          key={field.field}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.field)}
                            onChange={() => toggleField(field.field)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {field.alias}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {field.field}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Export Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Export Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filename (optional)
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={`${selectedCollection}_export`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Validation */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation</h3>
            
            <button
              onClick={validateExportConfig}
              disabled={isValidating || selectedFields.length === 0}
              className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Validate Configuration
            </button>
            
            {validationResult && (
              <div className={`p-3 rounded-lg ${
                validationResult.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {validationResult.valid ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {validationResult.valid ? 'Valid Configuration' : 'Invalid Configuration'}
                  </span>
                </div>
                {validationResult.estimated_records && (
                  <p className="text-sm mt-1">
                    Estimated records: {validationResult.estimated_records}
                  </p>
                )}
                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Warnings:</p>
                    <ul className="text-sm list-disc list-inside">
                      {validationResult.warnings.map((warning: string, index: number) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Action */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Execute Export</h3>
            
            <button
              onClick={executeExport}
              disabled={isLoading || selectedFields.length === 0}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Exporting...' : 'Start Export'}
            </button>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>• Export will include Indonesian field names</p>
              <p>• Technical IDs will be hidden</p>
              <p>• Limit: 1000 records per export</p>
            </div>
          </div>

          {/* Quick Stats */}
          {fieldSuggestions && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection:</span>
                  <span className="font-medium">{selectedCollection}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected Fields:</span>
                  <span className="font-medium">{selectedFields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium uppercase">{exportFormat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Records:</span>
                  <span className="font-medium">1,000</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExportPage;