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

// Backend payload types
export interface BackendFilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex' | 'exists';
  value: string;
  options?: string;
}

export interface BackendComputedField {
  name: string;
  alias: string;
  template: string;
  fields: string[];
}

export interface BackendFormattingOptions {
  exclude_ids: boolean;
  use_aliases: boolean;
  flatten_nested: boolean;
  include_empty_fields: boolean;
  computed_fields: BackendComputedField[];
}

export interface BackendJoinConfiguration {
  collection: string;
  local_field: string;
  foreign_field: string;
  alias?: string;
  join_type: 'lookup' | 'left' | 'inner';
  fields: string[];
  exclude_fields: string[];
  filters: BackendFilterCondition[];
  joins: string[];
  preserve_null_and_empty_arrays: boolean;
  limit: number;
  sort: Record<string, number>;
}

export interface BackendExportConfig {
  main_collection: string;
  fields: string[];
  exclude_fields: string[];
  filters: BackendFilterCondition[];
  joins: BackendJoinConfiguration[];
  group_by: string[];
  having: BackendFilterCondition[];
  sort: Record<string, number>;
  skip: number;
  limit: number;
  allow_disk_use: boolean;
  max_time_ms: number;
}

export interface BackendExportPayload {
  config: BackendExportConfig;
  format: 'excel' | 'csv' | 'json';
  filename: string;
  async_export: boolean;
  explain: boolean;
  dry_run: boolean;
  formatting: BackendFormattingOptions;
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