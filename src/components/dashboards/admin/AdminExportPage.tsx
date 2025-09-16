import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '@/contexts/AuthContext';
import { exportService } from '@/services/export';
import { 
  CollectionsRelationshipsResponse, 
  ExportConfiguration, 
  SelectedField,
  JoinConfiguration,
  CollectionFilter,
  FieldInfo
} from '@/types/export';
import { Database, Download, Settings, Play, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AvailableCollectionsAndFields from '@/components/exports/AvailableCollectionsAndFields';
import ExportConfigurationPreview from '@/components/exports/ExportConfigurationPreview';

const AdminExportPage: React.FC = () => {
  const { token } = useAuth();
  const [collections, setCollections] = useState<CollectionsRelationshipsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFieldContextCollection, setActiveFieldContextCollection] = useState<string>('');
  const [availableFieldContexts, setAvailableFieldContexts] = useState<{ key: string; displayName: string }[]>([]);
  const [allFieldsForActiveContext, setAllFieldsForActiveContext] = useState<FieldInfo[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfiguration>({
    main_collection: '',
    selected_fields: [],
    joins: [],
    filters: [],
    format: 'excel',
    filename: '',
    options: {
      exclude_ids: true,
      include_timestamps: false,
      flatten_nested: true
    }
  });

  // Manage available field contexts based on main collection and joins
  useEffect(() => {
    if (!collections) return;

    const contexts: { key: string; displayName: string }[] = [];
    
    // Add main collection if exists
    if (exportConfig.main_collection) {
      const mainCollectionInfo = collections.relationships[exportConfig.main_collection];
      contexts.push({
        key: exportConfig.main_collection,
        displayName: `${mainCollectionInfo?.display_name || exportConfig.main_collection} (Main)`
      });
    }

    // Add joined collections
    exportConfig.joins.forEach(join => {
      const targetCollectionInfo = collections.relationships[join.target_collection];
      const existingContext = contexts.find(c => c.key === join.target_collection);
      
      if (!existingContext) {
        contexts.push({
          key: join.target_collection,
          displayName: `${targetCollectionInfo?.display_name || join.target_collection} (Joined)`
        });
      }
    });

    setAvailableFieldContexts(contexts);

    // Only update active context if current selection is invalid
    const isCurrentContextValid = contexts.find(c => c.key === activeFieldContextCollection);
    
    if (!isCurrentContextValid) {
      if (exportConfig.main_collection) {
        setActiveFieldContextCollection(exportConfig.main_collection);
      } else if (contexts.length > 0) {
        setActiveFieldContextCollection(contexts[0].key);
      } else {
        setActiveFieldContextCollection('');
      }
    }
  }, [collections, exportConfig.main_collection, exportConfig.joins]);

  // Load collections on mount
  useEffect(() => {
    const loadCollections = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        // Try to get collections from database first
        const collectionsData = await exportService.getCollectionsRelationships(token);
        setCollections(collectionsData);
      } catch (error) {
        console.warn('Failed to load collections from API, using mock data as fallback:', error);
        
        // Use comprehensive mock data as fallback when API fails
        const mockCollections = {
          subjects: {
            display_name: "Subjects",
            possible_joins: [
              {
                collection: "teaching_assignments",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join subjects to teaching_assignments via _id"
              }
            ],
            total_joinable: 1
          },
          notifications: {
            display_name: "Notifications",
            possible_joins: [],
            total_joinable: 0
          },
          exam_sessions: {
            display_name: "Exam Sessions",
            possible_joins: [
              {
                collection: "users",
                suggested_local_field: "student_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join exam_sessions to users via student_id"
              },
              {
                collection: "exams",
                suggested_local_field: "exam_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join exam_sessions to exams via exam_id"
              }
            ],
            total_joinable: 2
          },
          exams: {
            display_name: "Exams",
            possible_joins: [
              {
                collection: "teaching_assignments",
                suggested_local_field: "teaching_assignment_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join exams to teaching_assignments via teaching_assignment_id"
              },
              {
                collection: "academic_periods",
                suggested_local_field: "academic_period_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join exams to academic_periods via academic_period_id"
              },
              {
                collection: "exam_sessions",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join exams to exam_sessions via _id"
              }
            ],
            total_joinable: 3
          },
          expertise_programs: {
            display_name: "Expertise Programs",
            possible_joins: [
              {
                collection: "classes",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join expertise_programs to classes via _id"
              },
              {
                collection: "departments",
                suggested_local_field: "department_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join expertise_programs to departments via department_id"
              }
            ],
            total_joinable: 2
          },
          users: {
            display_name: "Users",
            possible_joins: [
              {
                collection: "profiles",
                suggested_local_field: "profile_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join users to profiles via profile_id"
              },
              {
                collection: "exam_sessions",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join users to exam_sessions via _id"
              },
              {
                collection: "teaching_assignments",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join users to teaching_assignments via _id"
              }
            ],
            total_joinable: 3
          },
          academic_periods: {
            display_name: "Academic Periods",
            possible_joins: [
              {
                collection: "classes",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join academic_periods to classes via _id"
              },
              {
                collection: "teaching_assignments",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join academic_periods to teaching_assignments via _id"
              },
              {
                collection: "exams",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join academic_periods to exams via _id"
              }
            ],
            total_joinable: 3
          },
          teaching_assignments: {
            display_name: "Teaching Assignments",
            possible_joins: [
              {
                collection: "users",
                suggested_local_field: "teacher_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join teaching_assignments to users via teacher_id"
              },
              {
                collection: "subjects",
                suggested_local_field: "subject_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join teaching_assignments to subjects via subject_id"
              },
              {
                collection: "classes",
                suggested_local_field: "class_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join teaching_assignments to classes via class_id"
              },
              {
                collection: "academic_periods",
                suggested_local_field: "academic_period_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join teaching_assignments to academic_periods via academic_period_id"
              },
              {
                collection: "exams",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join teaching_assignments to exams via _id"
              }
            ],
            total_joinable: 5
          },
          classes: {
            display_name: "Classes",
            possible_joins: [
              {
                collection: "expertise_programs",
                suggested_local_field: "expertise_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join classes to expertise_programs via expertise_id"
              },
              {
                collection: "academic_periods",
                suggested_local_field: "academic_period_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join classes to academic_periods via academic_period_id"
              },
              {
                collection: "profiles",
                suggested_local_field: "_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join classes to profiles via _id"
              },
              {
                collection: "users",
                suggested_local_field: "homeroom_teacher_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join classes to users via homeroom_teacher_id"
              }
            ],
            total_joinable: 4
          },
          departments: {
            display_name: "Departments",
            possible_joins: [],
            total_joinable: 0
          },
          system_logs: {
            display_name: "System Logs",
            possible_joins: [],
            total_joinable: 0
          },
          profiles: {
            display_name: "Profiles",
            possible_joins: [
              {
                collection: "users",
                suggested_local_field: "user_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join profiles to users via user_id"
              },
              {
                collection: "classes",
                suggested_local_field: "class_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join profiles to classes via class_id"
              }
            ],
            total_joinable: 2
          },
          profiles: {
            display_name: "Profiles",
            possible_joins: [
              {
                collection: "users",
                suggested_local_field: "user_id",
                suggested_foreign_field: "_id",
                relationship_type: "direct",
                description: "Join profiles to users via user_id"
              }
            ],
            total_joinable: 1
          }
        };
        
        setCollections({ 
          relationships: mockCollections, 
          total_collections: Object.keys(mockCollections).length 
        });
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [token]);

  // Load fields for active context collection
  useEffect(() => {
    const loadFieldsForActiveContext = async () => {
      console.log('🔍 AdminExportPage - loadFieldsForActiveContext called');
      console.log('🔍 activeFieldContextCollection:', activeFieldContextCollection);
      console.log('🔍 token exists:', !!token);
      
      if (!token || !activeFieldContextCollection) {
        console.log('🔍 Clearing allFieldsForActiveContext - no token or collection');
        setAllFieldsForActiveContext([]);
        return;
      }

      try {
        setLoadingFields(true);
        // Reset fields to show loading state
        setAllFieldsForActiveContext([]);
        
        console.log('🔍 Calling exportService.getFieldSuggestions for:', activeFieldContextCollection);
        const data = await exportService.getFieldSuggestions(token, activeFieldContextCollection);
        console.log('🔍 Received field suggestions data:', data);
        console.log('🔍 Available fields count:', data.available_fields?.length || 0);
        setAllFieldsForActiveContext(data.available_fields || []);
      } catch (error) {
        console.error('🔍 Error loading field suggestions:', error);
        toast.error('Gagal memuat field suggestions');
        setAllFieldsForActiveContext([]);
      } finally {
        console.log('🔍 Setting loadingFields to false');
        setLoadingFields(false);
      }
    };

    loadFieldsForActiveContext();
  }, [token, activeFieldContextCollection]);

  // Calculate available fields (exclude already selected fields)
  const fieldsToDisplayInAvailablePanel = React.useMemo(() => {
    console.log('🔍 AdminExportPage - Calculating fieldsToDisplayInAvailablePanel');
    console.log('🔍 allFieldsForActiveContext:', allFieldsForActiveContext);
    console.log('🔍 exportConfig.selected_fields:', exportConfig.selected_fields);
    
    const selectedFieldIds = new Set(exportConfig.selected_fields.map(f => f.id));
    const availableFields = allFieldsForActiveContext.filter(field => {
      const fieldId = `${activeFieldContextCollection}.${field.field}`;
      const isSelected = selectedFieldIds.has(fieldId);
      console.log(`🔍 Field ${fieldId}: isSelected=${isSelected}`);
      return !isSelected;
    });
    
    console.log('🔍 Final availableFields count:', availableFields.length);
    return availableFields;
  }, [allFieldsForActiveContext, exportConfig.selected_fields, activeFieldContextCollection]);
  const handleMainCollectionChange = (collection: string) => {
    setExportConfig(prev => ({
      ...prev,
      main_collection: collection,
      selected_fields: [], // Reset selected fields when changing main collection
      joins: [], // Reset joins
      filters: [] // Reset filters
    }));
    setAllFieldsForActiveContext([]); // Reset fields when changing main collection
    setActiveFieldContextCollection(collection);
  };

  const handleFieldSelect = (field: SelectedField) => {
    setExportConfig(prev => ({
      ...prev,
      selected_fields: [...prev.selected_fields, field]
    }));
  };

  const handleFieldRemove = (fieldId: string) => {
    setExportConfig(prev => ({
      ...prev,
      selected_fields: prev.selected_fields.filter(f => f.id !== fieldId)
    }));
  };

  const handleJoinAdd = (join: JoinConfiguration) => {
    setExportConfig(prev => ({
      ...prev,
      joins: [...prev.joins, join]
    }));
  };

  const handleJoinRemove = (joinId: string) => {
    setExportConfig(prev => ({
      ...prev,
      joins: prev.joins.filter(j => j.id !== joinId)
    }));
  };

  const handleFilterAdd = (filter: CollectionFilter) => {
    setExportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, filter]
    }));
  };

  const handleFilterRemove = (filterId: string) => {
    setExportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId)
    }));
  };

  const handleFilterUpdate = (filterId: string, updatedFilter: CollectionFilter) => {
    setExportConfig(prev => ({
      ...prev,
      filters: prev.filters.map(f => f.id === filterId ? updatedFilter : f)
    }));
  };

  const handleValidateConfiguration = async () => {
    if (!token) return;

    try {
      const result = await exportService.validateConfiguration(token, exportConfig);
      if (result.valid) {
        toast.success('Konfigurasi valid!');
      } else {
        toast.error(`Konfigurasi tidak valid: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Gagal memvalidasi konfigurasi');
    }
  };

  const handleExecuteExport = async () => {
    if (!token) return;

    try {
      console.log('Executing export with config:', exportConfig);
      const result = await exportService.executeExport(token, exportConfig);
      toast.success(`Export dimulai! Task ID: ${result.task_id}`);
      
      if (result.download_url) {
        // If immediate download is available
        window.open(result.download_url, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal memulai export');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
          <span className="text-sm font-medium text-gray-700">Memuat koleksi...</span>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Data Export</h1>
                <p className="text-sm text-gray-500">Ekspor data dengan konfigurasi yang fleksibel</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleValidateConfiguration}
                disabled={!exportConfig.main_collection || exportConfig.selected_fields.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Validate
              </button>
              
              <button
                onClick={handleExecuteExport}
                disabled={!exportConfig.main_collection || exportConfig.selected_fields.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Available Collections and Fields */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="flex-shrink-0 bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900">Available Collections & Fields</h2>
              <p className="text-xs text-gray-500 mt-1">Pilih koleksi utama dan drag field ke panel kanan</p>
            </div>
            
            <div className="flex-1 overflow-auto">
              <AvailableCollectionsAndFields
                collections={collections}
                selectedMainCollection={exportConfig.main_collection}
                onMainCollectionChange={handleMainCollectionChange}
                collectionToDisplayFieldsFor={activeFieldContextCollection}
                availableFields={fieldsToDisplayInAvailablePanel}
                loadingFields={loadingFields}
              />
            </div>
          </div>

          {/* Right Panel - Export Configuration */}
          <div className="w-1/2 flex flex-col">
            <div className="flex-shrink-0 bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900">Export Configuration</h2>
              <p className="text-xs text-gray-500 mt-1">Konfigurasi field, join, dan filter untuk export</p>
            </div>
            
            <div className="flex-1 overflow-auto">
              <ExportConfigurationPreview
                exportConfig={exportConfig}
                collections={collections}
                availableFieldContexts={availableFieldContexts}
                activeFieldContextCollection={activeFieldContextCollection}
                setActiveFieldContextCollection={setActiveFieldContextCollection}
                onFieldAdd={handleFieldSelect}
                onFieldRemove={handleFieldRemove}
                onJoinAdd={handleJoinAdd}
                onJoinRemove={handleJoinRemove}
                onFilterAdd={handleFilterAdd}
                onFilterRemove={handleFilterRemove}
                onFilterUpdate={handleFilterUpdate}
                token={token}
              />
            </div>
          </div>
        </div>

        {/* Footer - Export Settings */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Format Selection */}
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Format:</label>
                <select
                  value={exportConfig.format}
                  onChange={(e) => setExportConfig(prev => ({ 
                    ...prev, 
                    format: e.target.value as 'excel' | 'csv' | 'json' 
                  }))}
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>

              {/* Filename */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filename:</label>
                <input
                  type="text"
                  value={exportConfig.filename}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, filename: e.target.value }))}
                  placeholder="export_data"
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-32"
                />
              </div>

              {/* Options */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.options.exclude_ids}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      options: { ...prev.options, exclude_ids: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Exclude IDs</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.options.include_timestamps}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      options: { ...prev.options, include_timestamps: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Timestamps</span>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="text-sm text-gray-500">
              {exportConfig.selected_fields.length} fields selected
              {exportConfig.joins.length > 0 && `, ${exportConfig.joins.length} joins`}
              {exportConfig.filters.length > 0 && `, ${exportConfig.filters.length} filters`}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default AdminExportPage;
