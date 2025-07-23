import React from 'react';
import { X, BookOpen, Calendar, FileText } from 'lucide-react';
import { Subject } from '@/types/subject';

interface SubjectDetailModalProps {
  subject: Subject;
  isOpen: boolean;
  onClose: () => void;
}

const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  subject,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detail Mata Pelajaran</h2>
              <p className="text-sm text-gray-500">Informasi lengkap mata pelajaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informasi Dasar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nama Mata Pelajaran</p>
                  <p className="font-medium text-gray-900">{subject.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Kode Mata Pelajaran</p>
                  <p className="font-medium text-gray-900">{subject.code}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="w-4 h-4 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Deskripsi</p>
                <p className="font-medium text-gray-900 whitespace-pre-wrap">
                  {subject.description || 'Tidak ada deskripsi'}
                </p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informasi Sistem
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tanggal Dibuat</p>
                  <p className="font-medium text-gray-900">{formatDate(subject.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Terakhir Diperbarui</p>
                  <p className="font-medium text-gray-900">{formatDate(subject.updated_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">ID Sistem</p>
                <p className="font-medium text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {subject._id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailModal;