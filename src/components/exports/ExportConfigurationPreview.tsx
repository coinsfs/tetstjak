import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Database, Settings, X } from 'lucide-react';
import { ExportConfig, SelectedField, JoinConfig } from '@/types/export';

interface ExportConfigurationPreviewProps {
  exportConfig: ExportConfig;
  onFieldAdd: (field: SelectedField) => void;
  onFieldRemove: (fieldId: string) => void;
  onJoinAdd: (join: JoinConfig) => void;
  onJoinRemove: (joinId: string) => void;
}

const ExportConfigurationPreview: React.FC<ExportConfigurationPreviewProps> = ({
  exportConfig,
  onFieldAdd,
  onFieldRemove,
  onJoinAdd,
  onJoinRemove
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'field',
    drop: (item: { field: string; alias: string; category: string; collection: string }) => {
      const selectedField: SelectedField = {
        id: `${item.collection}.${item.field}`,
        field: item.field,
        alias: item.alias,
        collection: item.collection,
        category: item.category
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
        {exportConfig.mainCollection && (
          <p className="text-sm text-gray-600 mt-1">
            Main Collection: <span className="font-medium">{exportConfig.mainCollection}</span>
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {!exportConfig.mainCollection ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Collection Selected</p>
              <p className="text-sm">Please select a main collection to start configuring your export</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
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
                {exportConfig.selectedFields.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Drag fields here to include them in your export</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exportConfig.selectedFields.map((field) => (
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

            {/* Joins Configuration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Joins & Lookups</h4>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  + Add Join
                </button>
              </div>
              <div className="space-y-2">
                {exportConfig.joins.length === 0 ? (
                  <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
                    <Settings className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No joins configured</p>
                    <p className="text-xs text-gray-400">Add joins to include related data</p>
                  </div>
                ) : (
                  exportConfig.joins.map((join) => (
                    <div
                      key={join.id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {join.targetCollection}
                          </div>
                          <div className="text-xs text-gray-500">
                            {join.localField} → {join.foreignField}
                          </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportConfigurationPreview;