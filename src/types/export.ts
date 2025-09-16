// Export related types
export interface CollectionRelationship {
  collection: string;
  suggested_local_field: string;
  suggested_foreign_field: string;
  relationship_type: string;
  description: string;
}

export interface CollectionInfo {
  display_name: string;
  possible_joins: CollectionRelationship[];
  total_joinable: number;
}

export interface CollectionsRelationshipsResponse {
  relationships: Record<string, CollectionInfo>;
  total_collections: number;
}

export interface FieldInfo {
  field: string;
  alias: string;
  category: string;
}

export interface SmartSuggestions {
  recommended: string[];
  optional: string[];
  advanced: string[];
}

export interface FieldSuggestionsResponse {
  collection: string;
  available_fields: FieldInfo[];
  smart_suggestions: SmartSuggestions;
  total_fields: number;
}

// Internal export configuration types
export interface SelectedField {
  id: string;
  field: string;
  alias: string;
  category: string;
  collection: string;
}

export interface JoinConfiguration {
  id: string;
  source_collection: string;
  target_collection: string;
  local_field: string;
  foreign_field: string;
  relationship_type: string;
  description: string;
  selected_fields: SelectedField[];
  nested_joins?: JoinConfiguration[];
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex' | 'exists';
  value: any;
  options?: string;
}

export interface CollectionFilter {
  id: string;
  collection: string;
  conditions: FilterCondition[];
  logic: 'and' | 'or';
}

export interface ExportConfiguration {
  main_collection: string;
  selected_fields: SelectedField[];
  joins: JoinConfiguration[];
  filters: CollectionFilter[];
  format: 'excel' | 'csv' | 'json';
  filename?: string;
  options: {
    exclude_ids: boolean;
    include_timestamps: boolean;
    flatten_nested: boolean;
  };
}

// Drag and drop types
export interface DragItem {
  type: string;
  field: FieldInfo;
  collection: string;
}

export const ItemTypes = {
  FIELD: 'field',
  COLLECTION: 'collection'
} as const;