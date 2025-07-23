import React from 'react';
import { Trophy, User, Eye, Star } from 'lucide-react';

export interface StudentPerformance {
  student_id: string;
  full_name: string;
  class_name: string;
  major_name: string;
  scores: number[];
  average_score: number;
}

interface StudentPerformanceTableProps {
  data: StudentPerformance[];
  onViewProfile?: (studentId: string) => void;
}

const StudentPerformanceTable: React.FC<StudentPerformanceTableProps> = ({ 
  data, 
  onViewProfile 
}) => {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 1:
        return <Trophy className="w-4 h-4 text-gray-400" />;
      case 2:
        return <Trophy className="w-4 h-4 text-amber-600" />;
      default:
        return <Star className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 1:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 2:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

//   const formatScores = (scores: number[]) => {
//     if (!scores || scores.length === 0) return '-';
//     return scores.map(score => score.toFixed(1)).join(', ');
//   };

  const handleViewProfile = (studentId: string) => {
    if (onViewProfile) {
      onViewProfile(studentId);
    } else {
      console.log('View profile for student:', studentId);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Siswa Berprestasi</h3>
              <p className="text-sm text-gray-500 mt-0.5">5 siswa dengan nilai tertinggi</p>
            </div>
            <Trophy className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="p-8 text-center">
          <User className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">Belum ada data prestasi</p>
          <p className="text-xs text-gray-400">Data prestasi siswa akan muncul di sini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Siswa Berprestasi</h3>
            <p className="text-sm text-gray-500 mt-0.5">5 siswa dengan nilai tertinggi</p>
          </div>
          <Trophy className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="intelligent-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="col-narrow text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Peringkat
              </th>
              <th className="col-wide text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Siswa
              </th>
              <th className="col-narrow text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kelas
              </th>
              <th className="col-narrow text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jurusan
              </th>
              <th className="col-medium text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skor
              </th>
              <th className="col-narrow text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rata-rata
              </th>
              <th className="col-actions text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((student, index) => (
              <tr 
                key={student.student_id} 
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Peringkat */}
                <td className="col-narrow">
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${getRankBadgeColor(index)}`}>
                      <span className="text-xs font-bold">#{index + 1}</span>
                    </div>
                    {getRankIcon(index)}
                  </div>
                </td>

                {/* Nama Siswa */}
                <td className="col-wide" title={student.full_name}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {student.student_id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Kelas */}
                <td className="col-narrow">
                  <span className="text-sm text-gray-900">{student.class_name}</span>
                </td>

                {/* Jurusan */}
                <td className="col-narrow">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                    {student.major_name}
                  </span>
                </td>

                {/* Skor */}
                <td className="col-medium" title={student.scores && student.scores.length > 0 ? student.scores.map(score => score.toFixed(1)).join(', ') : '-'}>
                  <div className="text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {student.scores && student.scores.length > 0 ? (
                        student.scores.map((score, scoreIndex) => (
                          <span 
                            key={scoreIndex}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                          >
                            {score.toFixed(1)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Rata-rata */}
                <td className="col-narrow">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {student.average_score.toFixed(1)}
                    </span>
                    <div className="ml-2 w-12 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(student.average_score, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>

                {/* Aksi */}
                <td className="col-actions">
                  <button
                    onClick={() => handleViewProfile(student.student_id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Lihat Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Menampilkan {data.length} siswa terbaik</span>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Lihat Semua Prestasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPerformanceTable;