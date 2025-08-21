import React from 'react';

interface ProctorMonitoringPageProps {
  examId: string;
}

const ProctorMonitoringPage: React.FC<ProctorMonitoringPageProps> = ({ examId }) => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Proctor Monitoring</h1>
      <p className="text-gray-600">Monitoring exam: {examId}</p>
    </div>
  );
};

export default ProctorMonitoringPage;