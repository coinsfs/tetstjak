import { BaseService } from './base';
import { 
  CollectionsRelationshipsResponse, 
  FieldSuggestionsResponse,
  ExportConfiguration,
  BackendExportPayload,
  BackendExportConfig,
  BackendJoinConfiguration,
  BackendFilterCondition,
  BackendFormattingOptions
} from '@/types/export';

class ExportService extends BaseService {
  /**
   * Get all collections and their relationships
   */
  async getCollectionsRelationships(token: string): Promise<CollectionsRelationshipsResponse> {
    return this.get<CollectionsRelationshipsResponse>('/admin/exports/collections/relationships', token);
  }

  /**
   * Get field suggestions for a specific collection
   */
  async getFieldSuggestions(token: string, collection: string): Promise<FieldSuggestionsResponse> {
    return this.get<FieldSuggestionsResponse>(`/admin/exports/fields/suggestions/${collection}`, token);
  }

  /**
   * Validate export configuration
   */
  async validateConfiguration(token: string, config: ExportConfiguration): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    const backendPayload = this.transformExportConfigToBackendPayload(config);
    return this.post('/admin/exports/validate', backendPayload, token);
  }

  /**
   * Execute export
   */
  async executeExport(token: string, config: ExportConfiguration): Promise<{
    task_id: string;
    status: string;
    download_url?: string;
  }> {
    const backendPayload = this.transformExportConfigToBackendPayload(config);
    return this.post('/admin/exports/execute', backendPayload, token);
  }

  /**
   * Get export task status
   */
  async getExportStatus(token: string, taskId: string): Promise<{
    task_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    download_url?: string;
    error?: string;
  }> {
    return this.get(`/admin/exports/status/${taskId}`, token);
  }

  /**
   * Transform frontend ExportConfiguration to backend payload format
   */
  transformExportConfigToBackendPayload(config: ExportConfiguration): BackendExportPayload {
    // Create maps for fields and filters by collection
    const collectionFieldsMap = new Map<string, string[]>();
    const collectionFiltersMap = new Map<string, BackendFilterCondition[]>();

    // Group selected fields by collection
    config.selected_fields.forEach(field => {
      if (!collectionFieldsMap.has(field.collection)) {
        collectionFieldsMap.set(field.collection, []);
      }
      collectionFieldsMap.get(field.collection)!.push(field.field);
    });

    // Get main collection fields and filters
    const mainCollectionFields = [...(collectionFieldsMap.get(config.main_collection) || [])];
    const mainCollectionFilters = collectionFiltersMap.get(config.main_collection) || [];

    // Group filters by collection
    config.filters.forEach(filter => {
      const backendConditions: BackendFilterCondition[] = filter.conditions.map(condition => ({
        field: condition.field,
        operator: condition.operator,
        value: String(condition.value),
        options: condition.options
      }));

      if (!collectionFiltersMap.has(filter.collection)) {
        collectionFiltersMap.set(filter.collection, []);
      }
      collectionFiltersMap.get(filter.collection)!.push(...backendConditions);
    }
    )
    // Build nested joins recursively
    const backendJoins = this.buildNestedJoins(
      config.main_collection,
      config.joins,
      collectionFieldsMap,
      collectionFiltersMap,
      mainCollectionFields // Pass main collection fields so direct joins can add their aliases
    );

    // Build backend config
    const backendConfig: BackendExportConfig = {
      main_collection: config.main_collection,
      fields: mainCollectionFields, // Use the modified fields array that includes join aliases
      exclude_fields: [],
      filters: mainCollectionFilters,
      joins: backendJoins,
      group_by: [],
      having: [],
      sort: {},
      skip: 0,
      limit: 0,
      allow_disk_use: true,
      max_time_ms: 0
    };

    // Build formatting options
    const formatting: BackendFormattingOptions = {
      exclude_ids: config.options.exclude_ids,
      use_aliases: true, // Default to true for better readability
      flatten_nested: config.options.flatten_nested,
      include_empty_fields: config.options.include_timestamps, // Map include_timestamps to include_empty_fields
      computed_fields: []
    };

    // Build final payload
    const backendPayload: BackendExportPayload = {
      config: backendConfig,
      format: config.format,
      filename: config.filename || `export_${Date.now()}`,
      async_export: false,
      explain: false,
      dry_run: false,
      formatting
    };

    return backendPayload;
  }

  /**
   * Recursively build nested joins structure
   */
  private buildNestedJoins(
    sourceCollection: string,
    allJoins: JoinConfiguration[],
    collectionFieldsMap: Map<string, string[]>,
    collectionFiltersMap: Map<string, BackendFilterCondition[]>,
    parentFieldsArray: string[]
  ): BackendJoinConfiguration[] {
    // Find all joins that start from the current source collection
    const joinsFromSource = allJoins.filter(join => join.source_collection === sourceCollection);

    return joinsFromSource.map(join => {
      // Get fields and filters for this target collection
      const targetFields = collectionFieldsMap.get(join.target_collection) || [];
      const targetFilters = collectionFiltersMap.get(join.target_collection) || [];

      // Create a copy of target fields that can be modified by nested joins
      const mutableTargetFields = [...targetFields];

      // Create the backend join configuration
      const backendJoin: BackendJoinConfiguration = {
        collection: join.target_collection,
        local_field: join.local_field,
        foreign_field: join.foreign_field,
        alias: join.target_collection,
        join_type: this.mapRelationshipTypeToJoinType(join.relationship_type),
        fields: mutableTargetFields,
        exclude_fields: [],
        filters: targetFilters,
        joins: [], // Will be filled by recursive call
        preserve_null_and_empty_arrays: true,
        limit: 0,
        sort: {}
      };

      // Recursively build nested joins for this target collection
      backendJoin.joins = this.buildNestedJoins(
        join.target_collection,
        allJoins,
        collectionFieldsMap,
        collectionFiltersMap,
        mutableTargetFields // Pass the mutable fields array so nested joins can add their aliases
      );

      // After nested joins are built, add this join's alias to the parent's fields array
      if (!parentFieldsArray.includes(backendJoin.alias)) {
        parentFieldsArray.push(backendJoin.alias);
      }

      return backendJoin;
    });
  }

  /**
   * Map frontend relationship type to backend join type
   */
  private mapRelationshipTypeToJoinType(relationshipType: string): 'lookup' | 'left' | 'inner' {
    switch (relationshipType.toLowerCase()) {
      case 'direct':
      case 'lookup':
        return 'lookup';
      case 'left':
        return 'left';
      case 'inner':
        return 'inner';
      default:
        return 'lookup'; // Default to lookup
    }
  }
}

export const exportService = new ExportService();