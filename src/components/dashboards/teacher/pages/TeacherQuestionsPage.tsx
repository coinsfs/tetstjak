import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { questionBankService, Question } from '@/services/questionBank';
import QuestionDisplay from '@/components/QuestionDisplay';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { Table, BookOpen, Plus, Filter, RotateCcw, HelpCircle, Search } from 'lucide-react';

// Asumsi: Anda memiliki komponen modal ini. Aktifkan jika diperlukan.
// import TeacherQuestionFormModal from './modals/TeacherQuestionFormModal';
// import TeacherQuestionDeleteModal from './modals/TeacherQuestionDeleteModal';
// import TeacherQuestionDetailModal from './modals/TeacherQuestionDetailModal';
// import { TeachingClass } from '@/services/teacher'; // Jika diperlukan untuk modal atau filter

const TeacherQuestionsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  // Filter dasar, sesuaikan dengan filter yang sebenarnya Anda miliki
  const [filters, setFilters] = useState<any>({ page: 1, limit: 10, search: '' }); 
  const totalPages = Math.ceil(totalItems / (filters.limit || 10));

  // State untuk mode tampilan: 'table' (default) atau 'exam'
  const [currentView, setCurrentView] = useState<'table' | 'exam'>('table');

  // State untuk modal (asumsi Anda memiliki modal ini)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Asumsi: teachingClasses diperlukan untuk modal atau filter
  // const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);

  useEffect(() => {
    fetchQuestions();
  }, [filters, token]); // Re-fetch saat filter atau token berubah

  // Fungsi untuk mengambil data soal dari API
  const fetchQuestions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Catatan: questionBankService.getMyQuestions() saat ini mengambil semua soal.
      // Untuk implementasi API yang sebenarnya dengan paginasi dan filter,
      // Anda mungkin perlu memodifikasi panggilan layanan ini.
      const allQuestions = await questionBankService.getMyQuestions(token); 
      
      // Filter berdasarkan pencarian (jika ada)
      const filteredBySearch = allQuestions.filter(q => 
        q.question_text.toLowerCase().includes(filters.search.toLowerCase()) ||
        q.tags.some((tag: string) => tag.toLowerCase().includes(filters.search.toLowerCase()))
      );

      // Implementasi paginasi sisi klien untuk demo ini
      const startIndex = (filters.page - 1) * filters.limit;
      const endIndex = startIndex + filters.limit;
      const paginatedQuestions = filteredBySearch.slice(startIndex, endIndex);

      setQuestions(paginatedQuestions);
      setTotalItems(filteredBySearch.length);
      setCurrentPage(filters.page);

    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Gagal memuat daftar soal');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk perubahan filter
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset ke halaman pertama saat filter berubah
    }));
  };

  // Handler untuk mereset filter
  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 10, search: '' });
  };

  // Handler untuk perubahan halaman paginasi
  const handlePageChange = (page: number) => {
    setFilters((prev: any) => ({ ...prev, page }));
  };

  // Handler untuk membuka modal pembuatan soal
  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setShowCreateModal(true);
  };

  // Handler untuk membuka modal edit soal
  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowEditModal(true);
  };

  // Handler untuk membuka modal hapus soal
  const handleDeleteQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  };

  // Handler untuk membuka modal detail soal
  const handleViewQuestionDetail = (question: Question) => {
    setSelectedQuestion(question);
    setShowDetailModal(true);
  };

  // Handler saat modal berhasil menyimpan/menghapus data
  const handleModalSuccess = () => {
    fetchQuestions(); // Ambil ulang data soal
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setSelectedQuestion(null);
  };

  // Handler untuk beralih tampilan (Tabel/Ujian)
  const handleViewChange = (view: 'table' | 'exam') => {
    setCurrentView(view);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman Bank Soal */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
              <p className="text-gray-600">Kelola soal-soal Anda</p>
            </div>
          </div>
          <button
            onClick={handleCreateQuestion}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Area Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Soal</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input Pencarian */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari soal berdasarkan teks atau tag..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
            />
          </div>
          {/* Tombol Reset Filter */}
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors justify-center sm:justify-start"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      {/* Kontrol Pemilih Tampilan (Tabel / Ujian) */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex justify-end mb-4">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => handleViewChange('table')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'table' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Table className="w-4 h-4" />
                <span>Tabel</span>
              </div>
            </button>
            <button
              onClick={() => handleViewChange('exam')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'exam' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Ujian</span>
              </div>
            </button>
          </div>
        </div>

        {/* Render Konten Berdasarkan Tampilan yang Dipilih */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-600 border-t-transparent"></div>
              <span className="text-gray-600">Memuat soal...</span>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Soal
            </h3>
            <p className="text-gray-600 mb-4">
              Anda belum membuat soal apapun. Mulai dengan membuat soal pertama Anda.
            </p>
            <button
              onClick={handleCreateQuestion}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Soal Pertama</span>
            </button>
          </div>
        ) : (
          <>
            {currentView === 'table' ? (
              // Placeholder untuk komponen tabel soal yang sudah ada
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <p className="p-6 text-center text-gray-500">
                  [Placeholder: Komponen Tabel Soal Anda yang Sudah Ada]
                  <br/>
                  Silakan ganti ini dengan komponen tabel soal Anda yang sebenarnya.
                  Pastikan untuk meneruskan props `questions`, `onEdit`, `onDelete`, `onView` ke komponen tabel Anda.
                </p>
                {/* Contoh: <YourExistingQuestionTableComponent questions={questions} onEdit={handleEditQuestion} onDelete={handleDeleteQuestion} onView={handleViewQuestionDetail} /> */}
              </div>
            ) : (
              // Tampilan Ujian menggunakan QuestionDisplay
              <div className="bg-white rounded-xl shadow-sm">
                <QuestionDisplay
                  questions={questions}
                  mode="view" // Mode 'view' menampilkan detail soal dan opsi jawaban
                  showActions={true} // Tampilkan tombol aksi (edit, delete, view)
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                  onView={handleViewQuestionDetail}
                  className="space-y-4 p-6" // Memberikan jarak antar kartu soal dan padding internal
                />
              </div>
            )}

            {/* Komponen Paginasi */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={filters.limit || 10}
                  itemName="soal"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Area Modal (Aktifkan dan sesuaikan jika Anda memiliki modal ini) */}
      {/* {showCreateModal && (
        <TeacherQuestionFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
          teachingClasses={teachingClasses} // Teruskan jika diperlukan
          currentUserId={user?._id || ''}
        />
      )}
      {showEditModal && selectedQuestion && (
        <TeacherQuestionFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleModalSuccess}
          teachingClasses={teachingClasses} // Teruskan jika diperlukan
          currentUserId={user?._id || ''}
          question={selectedQuestion}
        />
      )}
      {showDeleteModal && selectedQuestion && (
        <TeacherQuestionDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleModalSuccess}
          question={selectedQuestion}
        />
      )}
      {showDetailModal && selectedQuestion && (
        <TeacherQuestionDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          question={selectedQuestion}
          teachingClasses={teachingClasses} // Teruskan jika diperlukan
        />
      )} */}
    </div>
  );
};

export default TeacherQuestionsPage;
