import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Please login to access this page</div>;
  }

  const hasRequiredRole = Array.isArray(requiredRole) 
    ? requiredRole.some(role => user.roles.includes(role))
    : user.roles.includes(requiredRole);

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

            Anda tidak memiliki izin untuk mengakses halaman ini. Role yang diperlukan: {Array.isArray(requiredRole) ? requiredRole.join(' atau ') : requiredRole}
};

export default ProtectedRoute;