import React, { useState } from 'react';
import { Database, Plus, X } from 'lucide-react';
import { 
  CollectionsRelationshipsResponse, 
  JoinConfiguration
} from '@/types/export';
import JoinCreatorModal from './JoinCreatorModal';

interface JoinsPanelProps {
  joins: JoinConfiguration[];
  onJoinAdd: (join: JoinConfiguration) => void;
  onJoinRemove: (joinId: string) => void;
  collections: CollectionsRelationshipsResponse | null;
  token: string | null;
  existingJoins: JoinConfiguration[];
  mainCollection: string;
}

const JoinsPanel: React.FC<JoinsPanelProps> = ({
  joins,
  onJoinAdd,
  onJoinRemove,
  collections,
  token,
  existingJoins,
  mainCollection
}) => {
  const [showJoinCreator, setShowJoinCreator] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          Joins & Lookups
        </h4>
        <button 
          onClick={() => setShowJoinCreator(true)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Join
        </button>
      </div>
      
      <div className="space-y-2">
        {joins.length === 0 ? (
          <div className="p-3 border border-gray-200 rounded-lg text-center text-gray-500">
            <Database className="w-5 h-5 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">No joins configured</p>
            <p className="text-xs text-gray-400">Add joins to include related data</p>
          </div>
        ) : (
          joins.map((join) => (
            <div
              key={join.id}
              className="p-3 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {join.source_collection} → {join.target_collection}
                  </div>
                  <div className="text-xs text-gray-500">
                    {join.local_field} → {join.foreign_field}
                  </div>
                  {join.description && (
                    <div className="text-xs text-gray-400 mt-1">
                      {join.description}
                    </div>
                  )}
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

      {/* Join Creator Modal */}
      <JoinCreatorModal
        collections={collections}
        token={token}
        isOpen={showJoinCreator}
        existingJoins={existingJoins}
        mainCollection={mainCollection}
        onSave={(join) => {
          onJoinAdd(join);
          setShowJoinCreator(false);
        }}
        onCancel={() => setShowJoinCreator(false)}
      />
    </div>
  );
};

export default JoinsPanel;