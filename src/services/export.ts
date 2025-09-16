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
    // Separate filters by collection
    const mainCollectionFilters: BackendFilterCondition[] = [];
    const joinFiltersMap: Record<string, BackendFilterCondition[]> = {};

    config.filters.forEach(filter => {
      const backendConditions: BackendFilterCondition[] = filter.conditions.map(condition => ({
        field: condition.field,
        operator: condition.operator,
        value: String(condition.value),
        options: condition.options
      }));

      if (filter.collection === config.main_collection) {
        // Add to main collection filters
        mainCollectionFilters.push(...backendConditions);
      } else {
        // Add to join filters
        if (!joinFiltersMap[filter.collection]) {
          joinFiltersMap[filter.collection] = [];
        }
        joinFiltersMap[filter.collection].push(...backendConditions);
      }
    });

    // Transform joins
    const backendJoins: BackendJoinConfiguration[] = config.joins.map(join => {
      // Get fields for this specific join collection
      const joinFields = config.selected_fields
        .filter(field => field.collection === join.target_collection)
        .map(field => field.field);

      return {
        collection: join.target_collection,
        local_field: join.local_field,
        foreign_field: join.foreign_field,
        alias: join.target_collection, // Use collection name as alias
        fields: joinFields,
        exclude_fields: [],
        filters: joinFiltersMap[join.target_collection] || [],
        joins: [], // Nested joins not supported in current UI
        preserve_null_and_empty_arrays: true,
        limit: 0
      };
    });

    // Extract main collection fields
    const mainCollectionFields = config.selected_fields
      .filter(field => field.collection === config.main_collection)
      .map(field => field.field);

    // Build backend config
    const backendConfig: BackendExportConfig = {
      main_collection: config.main_collection,
      fields: mainCollectionFields,
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