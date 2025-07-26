import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { importService } from '@/services/import';
import { useImportPolling } from '@/hooks/useImportPolling';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'users' | 'teachers' | 'students';
  title: string;
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  title
}) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const storageKey = `import_task_${type}`;
  
  const { isPolling, taskStatus, startPolling, stopPolling } = useImportPolling({
    storageKey,
    onSuccess: (result) => {
      setImportErrors([]);
      onSuccess();
    },
    onError: (errors) => {
      setImportErrors(errors);
    }
  });

  const handleDownloadTemplate = async () => {
    if (!token) return;

    setDownloadingTemplate(true);
    try {
      const blob = await importService.downloadTemplate(token, type);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template_import_${type}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template berhasil diunduh');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengunduh template';
      toast.error(errorMessage);
      console.error('Error downloading template:', error);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error('File harus berformat Excel (.xlsx atau .xls)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB');
        return;
      }

      setSelectedFile(file);
      setImportErrors([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    try {
      const response = await importService.uploadFile(token, selectedFile, type);
      
      toast.success('File berhasil diunggah. Proses import dimulai...');
      startPolling(response.task_id);
      
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengunggah file';
      toast.error(errorMessage);
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (isPolling) {
      const confirmClose = window.confirm(
        'Proses import sedang berjalan. Apakah Anda yakin ingin menutup modal ini? Proses akan tetap berjalan di background.'
      );
      if (!confirmClose) return;
    }
    
    setSelectedFile(null);
    setImportErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const getStatusIcon = () => {
    if (!taskStatus) return null;
    
    switch (taskStatus.status) {
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!taskStatus) return '';
    
    switch (taskStatus.status) {
      case 'PENDING':
        return 'Menunggu proses...';
      case 'PROCESSING':
        return 'Sedang memproses data...';
      case 'SUCCESS':
        return `Berhasil! ${taskStatus.result?.success_count || 0} data diimpor`;
      case 'FAILED':
        return 'Import gagal';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import Data {title}</h2>
              <p className="text-sm text-gray-500">Impor data dari file Excel</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Download Template */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">1. Download Template</h3>
            <p className="text-sm text-gray-600">
              Download template Excel terlebih dahulu untuk mengetahui format data yang diperlukan.
            </p>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloadingTemplate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">2. Upload File Excel</h3>
            <p className="text-sm text-gray-600">
              Pilih file Excel yang sudah diisi sesuai dengan template.
            </p>
            
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
              />
              
              {selectedFile && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{selectedFile.name}</span>
                  <span className="text-xs text-blue-600">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
              
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || isPolling}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Import</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Import Status */}
          {isPolling && taskStatus && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Status Import</h3>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                {getStatusIcon()}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{getStatusText()}</p>
                  {taskStatus.status === 'PROCESSING' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mohon tunggu, proses ini mungkin memakan waktu beberapa menit...
                    </p>
                  )}
                </div>
                {(taskStatus.status === 'PENDING' || taskStatus.status === 'PROCESSING') && (
                  <button
                    onClick={stopPolling}
                    className="text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    Batalkan
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Import Errors */}
          {importErrors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-red-900">Error Import</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      Beberapa data gagal diimpor:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {importErrors.map((error, index) => (
                        <p key={index} className="text-sm text-red-700">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-2">Petunjuk Import:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• File harus berformat Excel (.xlsx atau .xls)</li>
                  <li>• Ukuran file maksimal 10MB</li>
                  <li>• Pastikan data sesuai dengan format template</li>
                  <li>• Kolom yang wajib diisi tidak boleh kosong</li>
                  <li>• Proses import akan berjalan di background</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {isPolling ? 'Tutup' : 'Batal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;