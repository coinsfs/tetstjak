import React from 'react';
import { useRouter } from '@/hooks/useRouter';
import { Database, ArrowRight, Settings, Download } from 'lucide-react';

const ExportLandingPage: React.FC = () => {
  const { navigate } = useRouter();

  const handleGoToConfiguration = () => {
    navigate('/manage/exports/configure');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
              <Database className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Data Export Center
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Ekspor data sistem dengan konfigurasi yang fleksibel dan powerful. 
            Buat laporan custom dengan join antar tabel, filter data, dan berbagai format output.
          </p>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Konfigurasi Fleksibel
              </h3>
              <p className="text-sm text-gray-600">
                Pilih field, buat join antar tabel, dan terapkan filter sesuai kebutuhan
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Multi-Table Joins
              </h3>
              <p className="text-sm text-gray-600">
                Gabungkan data dari berbagai tabel dengan join bertingkat
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Multiple Formats
              </h3>
              <p className="text-sm text-gray-600">
                Export ke Excel, CSV, atau JSON sesuai kebutuhan analisis
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGoToConfiguration}
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Settings className="w-5 h-5 mr-3" />
              Go to Export Configuration
              <ArrowRight className="w-5 h-5 ml-3" />
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              💡 Tips untuk Export Data yang Efektif
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 text-left max-w-md mx-auto">
              <li>• Pilih hanya field yang diperlukan untuk performa optimal</li>
              <li>• Gunakan filter untuk membatasi jumlah data yang diekspor</li>
              <li>• Join tabel terkait untuk mendapatkan data yang lengkap</li>
              <li>• Pilih format Excel untuk analisis lebih lanjut</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportLandingPage;