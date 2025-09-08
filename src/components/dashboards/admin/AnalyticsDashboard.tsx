import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { ArrowLeft, BarChart3, Users, BookOpen, GraduationCap, Filter, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import ScoreTrendAnalytics from '@/components/analytics/ScoreTrendAnalytics';

const AnalyticsDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'class' | 'subject' | 'grade' | 'teacher'>('overview');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    setDateRange(prev => ({
      ...prev,
      [type]: e.target.value
    }));
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeacher(e.target.value);
  };

  const clearAllFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedGrade('');
    setSelectedTeacher('');
  };

  const getDefaultFilters = () => {
    const filters: any = {
      group_by: activeTab === 'overview' ? 'class' : activeTab
    };

    // Only add parameters if they have values
    if (dateRange.start) {
      filters.start_date = new Date(dateRange.start).toISOString();
    }
    if (dateRange.end) {
      filters.end_date = new Date(dateRange.end).toISOString();
    }
    if (selectedClass) {
      filters.class_id = selectedClass;
    }
    if (selectedSubject) {
      filters.subject_id = selectedSubject;
    }
    if (selectedGrade) {
      filters.grade_level = parseInt(selectedGrade);
    }
    if (selectedTeacher) {
      filters.teacher_id = selectedTeacher;
    }

    return filters;
  };

  const getChartTitle = () => {
    switch (activeTab) {
      case 'class': return 'Tren Nilai Berdasarkan Kelas';
      case 'subject': return 'Tren Nilai Berdasarkan Mata Pelajaran';
      case 'grade': return 'Tren Nilai Berdasarkan Jenjang';
      case 'teacher': return 'Tren Nilai Berdasarkan Guru';
      default: return 'Tren Nilai Keseluruhan';
    }
  };

  const hasActiveFilters = () => {
    return dateRange.start || dateRange.end || selectedClass || selectedSubject || selectedGrade || selectedTeacher;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (dateRange.start) count++;
    if (dateRange.end) count++;
    if (selectedClass) count++;
    if (selectedSubject) count++;
    if (selectedGrade) count++;
    if (selectedTeacher) count++;
    return count;
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Keseluruhan',
      icon: BarChart3,
      description: 'Analisis tren nilai secara keseluruhan'
    },
    {
      id: 'class',
      label: 'Kelas',
      icon: Users,
      description: 'Perbandingan antar kelas'
    },
    {
      id: 'subject',
      label: 'Mata Pelajaran',
      icon: BookOpen,
      description: 'Perbandingan antar mata pelajaran'
    },
    {
      id: 'grade',
      label: 'Jenjang',
      icon: GraduationCap,
      description: 'Perbandingan antar tingkat kelas'
    },
    {
      id: 'teacher',
      label: 'Guru',
      icon: Users,
      description: 'Perbandingan kinerja guru'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/admin')}
                className="group p-3 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Dashboard Analitik
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Analisis mendalam tren nilai ujian di seluruh sistem pendidikan
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Diperbarui: {new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group relative min-w-0 flex-1 overflow-hidden py-6 px-6 text-center font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`p-2 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{tab.label}</div>
                        <div className="text-xs text-gray-400 mt-1 hidden sm:block">
                          {tab.description}
                        </div>
                      </div>
                    </div>
                    
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Filter className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Filter Analitik</h3>
                  <p className="text-sm text-gray-600">Sesuaikan data berdasarkan kriteria yang diinginkan</p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                {hasActiveFilters() && (
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getActiveFilterCount()} filter aktif
                    </span>
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                    >
                      Hapus Semua
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {/* Date Range Filters */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Tanggal Mulai
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateChange(e, 'start')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Tanggal Akhir
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateChange(e, 'end')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                  />
                </div>
              </div>
              
              {/* Class Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Kelas
                </label>
                <select
                  value={selectedClass}
                  onChange={handleClassChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                >
                  <option value="">Semua Kelas</option>
                  <option value="class1">Kelas 10 IPA 1</option>
                  <option value="class2">Kelas 11 IPA 2</option>
                  <option value="class3">Kelas 12 IPS 1</option>
                </select>
              </div>
              
              {/* Subject Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Mata Pelajaran
                </label>
                <select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                >
                  <option value="">Semua Mata Pelajaran</option>
                  <option value="math">Matematika</option>
                  <option value="science">IPA</option>
                  <option value="english">Bahasa Inggris</option>
                  <option value="indonesian">Bahasa Indonesia</option>
                  <option value="history">Sejarah</option>
                  <option value="geography">Geografi</option>
                </select>
              </div>
              
              {/* Grade Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Jenjang
                </label>
                <select
                  value={selectedGrade}
                  onChange={handleGradeChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                >
                  <option value="">Semua Jenjang</option>
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>
            </div>
            
            {/* Teacher Filter - Only show when teacher tab is active */}
            {activeTab === 'teacher' && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Guru
                  </label>
                  <select
                    value={selectedTeacher}
                    onChange={handleTeacherChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Guru</option>
                    <option value="teacher1">Budi Santoso</option>
                    <option value="teacher2">Siti Rahayu</option>
                    <option value="teacher3">Ahmad Fauzi</option>
                    <option value="teacher4">Dewi Sartika</option>
                    <option value="teacher5">Rudi Hartono</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Chart Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{getChartTitle()}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Visualisasi perkembangan nilai ujian dari waktu ke waktu
                  </p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Data real-time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Content */}
          <div className="p-8">
            <ScoreTrendAnalytics 
              title=""
              defaultFilters={getDefaultFilters()}
              showFilters={false}
              height={500}
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Analisis Komprehensif</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Data analitik yang mendalam untuk pengambilan keputusan yang tepat
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tren Real-time</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Pantau perkembangan nilai siswa secara real-time dan akurat
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Multi-Dimensi</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Analisis berdasarkan kelas, mata pelajaran, jenjang, dan guru
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tips Penggunaan Dashboard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Filter Data:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Gunakan rentang tanggal untuk analisis periode tertentu</li>
                    <li>• Kombinasikan filter untuk analisis yang lebih spesifik</li>
                    <li>• Filter kosong akan menampilkan semua data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Interpretasi Grafik:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Garis naik menunjukkan peningkatan performa</li>
                    <li>• Bandingkan tren antar kategori untuk insight</li>
                    <li>• Hover pada titik data untuk detail lengkap</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;