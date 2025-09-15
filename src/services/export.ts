import { BaseService } from './base';
import { 
  CollectionsRelationshipsResponse, 
  FieldSuggestionsResponse,
  ExportConfiguration 
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
    return this.post('/admin/exports/validate', config, token);
  }

  /**
   * Execute export
   */
  async executeExport(token: string, config: ExportConfiguration): Promise<{
    task_id: string;
    status: string;
    download_url?: string;
  }> {
    return this.post('/admin/exports/execute', config, token);
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
}

export const exportService = new ExportService();