import React, { memo } from 'react';
import { Eye, Edit, Trash2, BookOpen, Calendar, FileText } from 'lucide-react';
import { Subject } from '@/types/subject';

interface SubjectTableProps {
  subjects: Subject[];
  onViewSubject: (subject: Subject) => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
}

const SubjectTable: React.FC<SubjectTableProps> = memo(({
  subjects,
  onViewSubject,
  onEditSubject,
  onDeleteSubject
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data mata pelajaran</h3>
          <p className="text-gray-500">
            Belum ada mata pelajaran yang terdaftar atau sesuai dengan pencarian yang dilakukan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">
                Mata Pelajaran
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                Kode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                Tanggal Dibuat
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjects.map((subject) => (
              <tr key={subject._id} className="hover:bg-gray-50 transition-colors">
                {/* Subject Info */}
                <td className="px-6 py-4 w-[300px]">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1 break-words leading-tight">
                        {subject.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {subject._id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Code */}
                <td className="px-6 py-4 w-[150px]">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {subject.code}
                  </span>
                </td>

                {/* Description */}
                <td className="px-6 py-4 w-[300px]">
                  <div className="text-sm text-gray-900 break-words leading-tight">
                    {subject.description || '-'}
                  </div>
                </td>

                {/* Created Date */}
                <td className="px-6 py-4 w-[150px]">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(subject.created_at)}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 w-[150px]">
                  <div className="flex items-center justify-center space-x-1">
                    {/* View Detail Button */}
                    <button
                      onClick={() => onViewSubject(subject)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditSubject(subject)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit Mata Pelajaran"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteSubject(subject)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus Mata Pelajaran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

SubjectTable.displayName = 'SubjectTable';

export default SubjectTable;