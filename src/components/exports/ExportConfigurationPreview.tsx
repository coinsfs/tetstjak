import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Database, X } from 'lucide-react';
import { 
  ExportConfiguration, 
  SelectedField, 
  DragItem,
  CollectionsRelationshipsResponse
} from '@/types/export';

interface ExportConfigurationPreviewProps {
  exportConfig: ExportConfiguration;
  collections: CollectionsRelationshipsResponse | null;
  availableFieldContexts: { key: string; displayName: string }[];
  activeFieldContextCollection: string;
  setActiveFieldContextCollection: (collection: string) => void;
  onFieldAdd: (field: SelectedField) => void;
  onFieldRemove: (fieldId: string) => void;
}

const ExportConfigurationPreview: React.FC<ExportConfigurationPreviewProps> = ({
  exportConfig,
  collections,
  availableFieldContexts,
  activeFieldContextCollection,
  setActiveFieldContextCollection,
  onFieldAdd,
  onFieldRemove
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'field', 
    drop: (item: DragItem) => {
      const selectedField: SelectedField = {
        id: `${item.collection}.${item.field.field}`,
        field: item.field.field,
        alias: item.field.alias,
        collection: item.collection,
        category: item.field.category
      };
      onFieldAdd(selectedField);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Export Configuration</h3>
        </div>
        {exportConfig.main_collection && (
          <p className="text-sm text-gray-600 mt-1">
            Main Collection: <span className="font-medium">{exportConfig.main_collection}</span>
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {!exportConfig.main_collection ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Collection Selected</p>
              <p className="text-sm">Please select a main collection to start configuring your export</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Field Context Selection */}
            {availableFieldContexts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Available Collections</h4>
                <div className="flex flex-wrap gap-2">
                  {availableFieldContexts.map((context) => (
                    <button
                      key={context.key}
                availableCollectionsForFilter={availableFieldContexts}
                      onClick={() => setActiveFieldContextCollection(context.key)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        activeFieldContextCollection === context.key
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Database className="w-4 h-4 inline mr-1" />
                      {context.displayName}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select a collection to view its available fields for export
                </p>
              </div>
            )}

            {/* Selected Fields */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Selected Fields</h4>
              <div
                ref={drop}
                className={`min-h-32 p-4 border-2 border-dashed rounded-lg transition-colors ${
                  isOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                {exportConfig.selected_fields.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Drag fields here to include them in your export</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exportConfig.selected_fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {field.alias}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({field.collection}.{field.field})
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {field.category.replace('_', ' ')}
                          </div>
                        </div>
                        <button
                          onClick={() => onFieldRemove(field.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportConfigurationPreview;