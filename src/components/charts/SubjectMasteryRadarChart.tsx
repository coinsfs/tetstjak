import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Award, Target, TrendingUp } from 'lucide-react';
import { SubjectMasteryResponse, SingleEntitySubjectMasteryResponse, MultipleEntitySubjectMasteryResponse } from '@/types/subjectMastery';

interface SubjectMasteryRadarChartProps {
  data: SubjectMasteryResponse;
  height?: number;
}

const SubjectMasteryRadarChart: React.FC<SubjectMasteryRadarChartProps> = ({ 
  data,
  height = 400 
}) => {
  // Check if data is single entity or multiple entities
  const isSingleEntity = 'entity_id' in data;
  
  // Prepare chart data
  const prepareChartData = () => {
    if (isSingleEntity) {
      const singleData = data as SingleEntitySubjectMasteryResponse;
      return Object.entries(singleData.mastery_data.subject_scores).map(([subject, score]) => ({
        subject: subject.length > 15 ? subject.substring(0, 15) + '...' : subject,
        fullSubject: subject,
        [singleData.entity_name]: score
      }));
    } else {
      const multipleData = data as MultipleEntitySubjectMasteryResponse;
      
      // Get all unique subjects
      const allSubjects = new Set<string>();
      multipleData.entities.forEach(entity => {
        Object.keys(entity.mastery_data.subject_scores).forEach(subject => {
          allSubjects.add(subject);
        });
      });
      
      // Create chart data with all subjects
      return Array.from(allSubjects).map(subject => {
        const dataPoint: any = {
          subject: subject.length > 15 ? subject.substring(0, 15) + '...' : subject,
          fullSubject: subject
        };
        
        multipleData.entities.forEach(entity => {
          dataPoint[entity.entity_name] = entity.mastery_data.subject_scores[subject] || 0;
        });
        
        return dataPoint;
      });
    }
  };

  // Generate colors for multiple entities
  const generateColors = () => {
    const colors = [
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple (repeat if needed)
    ];
    
    if (isSingleEntity) {
      return [colors[0]];
    } else {
      const multipleData = data as MultipleEntitySubjectMasteryResponse;
      return multipleData.entities.map((_, index) => colors[index % colors.length]);
    }
  };

  // Get performance level color
  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  // Get performance level text
  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return 'Sangat Baik';
    if (score >= 60) return 'Baik';
    return 'Perlu Perbaikan';
  };

  const chartData = prepareChartData();
  const colors = generateColors();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fullSubject = payload[0]?.payload?.fullSubject || label;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-2">{fullSubject}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{entry.name}:</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900">{Number(entry.value).toFixed(1)}</span>
                <div className={`text-xs ${
                  entry.value >= 80 ? 'text-green-600' :
                  entry.value >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {getPerformanceLevel(entry.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render summary statistics
  const renderSummaryStats = () => {
    if (isSingleEntity) {
      const singleData = data as SingleEntitySubjectMasteryResponse;
      const bestSubject = Object.entries(singleData.mastery_data.subject_scores)
        .reduce((a, b) => a[1] > b[1] ? a : b);
      const weakestSubject = Object.entries(singleData.mastery_data.subject_scores)
        .reduce((a, b) => a[1] < b[1] ? a : b);

      return (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded">
                <Target className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Rata-rata</p>
                <p className="text-sm font-bold text-blue-700">
                  {singleData.mastery_data.overall_average.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded">
                <Award className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Terbaik</p>
                <p className="text-xs font-bold text-green-700 truncate" title={bestSubject[0]}>
                  {bestSubject[0].length > 8 ? bestSubject[0].substring(0, 8) + '...' : bestSubject[0]}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-orange-100 rounded">
                <TrendingUp className="w-3 h-3 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Perlu Fokus</p>
                <p className="text-xs font-bold text-orange-700 truncate" title={weakestSubject[0]}>
                  {weakestSubject[0].length > 8 ? weakestSubject[0].substring(0, 8) + '...' : weakestSubject[0]}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const multipleData = data as MultipleEntitySubjectMasteryResponse;
      
      return (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded">
                <Target className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Rata-rata Sekolah</p>
                <p className="text-sm font-bold text-blue-700">
                  {multipleData.comparison_metadata.school_average.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded">
                <Award className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Mapel Terbaik</p>
                <p className="text-xs font-bold text-green-700 truncate" title={multipleData.comparison_metadata.best_subject}>
                  {multipleData.comparison_metadata.best_subject.length > 8 
                    ? multipleData.comparison_metadata.best_subject.substring(0, 8) + '...' 
                    : multipleData.comparison_metadata.best_subject}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-orange-100 rounded">
                <TrendingUp className="w-3 h-3 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Perlu Fokus</p>
                <p className="text-xs font-bold text-orange-700 truncate" title={multipleData.comparison_metadata.weakest_subject}>
                  {multipleData.comparison_metadata.weakest_subject.length > 8 
                    ? multipleData.comparison_metadata.weakest_subject.substring(0, 8) + '...' 
                    : multipleData.comparison_metadata.weakest_subject}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <Target className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">Belum Ada Data</p>
          <p className="text-xs text-gray-400">Data akan muncul setelah ujian</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Statistics */}
      {renderSummaryStats()}

      {/* Radar Chart */}
      <div className="bg-white rounded border border-gray-200 p-3">
        <div style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                className="text-xs"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 8, fill: '#9CA3AF' }}
                tickCount={6}
              />
              <Tooltip content={<CustomTooltip />} />
              {isSingleEntity ? (
                <Radar
                  name={(data as SingleEntitySubjectMasteryResponse).entity_name}
                  dataKey={(data as SingleEntitySubjectMasteryResponse).entity_name}
                  stroke={colors[0]}
                  fill={colors[0]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={{ fill: colors[0], strokeWidth: 1, r: 3 }}
                />
              ) : (
                (data as MultipleEntitySubjectMasteryResponse).entities.map((entity, index) => (
                  <Radar
                    key={entity.entity_id}
                    name={entity.entity_name}
                    dataKey={entity.entity_name}
                    stroke={colors[index]}
                    fill={colors[index]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    dot={{ fill: colors[index], strokeWidth: 1, r: 3 }}
                  />
                ))
              )}
              <Legend 
                iconSize={8} 
                wrapperStyle={{ fontSize: '11px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Details */}
      {isSingleEntity && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-900 mb-2">Detail Mata Pelajaran</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries((data as SingleEntitySubjectMasteryResponse).mastery_data.subject_scores).map(([subject, score]) => (
              <div key={subject} className="bg-white rounded p-2 border border-gray-200">
                <h5 className="text-xs font-medium text-gray-900 mb-1 truncate" title={subject}>
                  {subject}
                </h5>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">{score.toFixed(1)}</span>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPerformanceColor(score) }}
                  />
                </div>
                <div className={`text-xs ${
                  score >= 80 ? 'text-green-600' :
                  score >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {getPerformanceLevel(score)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectMasteryRadarChart;