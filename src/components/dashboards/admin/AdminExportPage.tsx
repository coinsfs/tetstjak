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
  CollectionFilter
} from '@/types/export';
import { Database, Download, Settings, Play, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AvailableCollectionsAndFields from '@/components/exports/AvailableCollectionsAndFields';
import ExportConfigurationPreview from '@/components/exports/ExportConfigurationPreview';

const AdminExportPage: React.FC = () => {
  const { token } = useAuth();
  const [collections, setCollections] = useState<CollectionsRelationshipsResponse | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Load collections on mount
  useEffect(() => {
    const loadCollections = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const data = await exportService.getCollectionsRelationships(token);
        setCollections(data);
      } catch (error) {
        console.error('Error loading collections:', error);
        toast.error('Gagal memuat daftar koleksi');
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [token]);

  const handleMainCollectionChange = (collection: string) => {
    setExportConfig(prev => ({
      ...prev,
      main_collection: collection,
      selected_fields: [], // Reset selected fields when changing main collection
      joins: [], // Reset joins
      filters: [] // Reset filters
    }));
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
                token={token}
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
                config={exportConfig}
                collections={collections}
                onFieldRemove={handleFieldRemove}
                onJoinAdd={handleJoinAdd}
                onJoinRemove={handleJoinRemove}
                onFilterAdd={handleFilterAdd}
                onConfigChange={setExportConfig}
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