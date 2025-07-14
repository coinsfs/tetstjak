import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, GraduationCap, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.trim() !== '' && password.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-slate-600 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-slate-700 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-500 rounded-full blur-3xl"></div>
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <BookOpen className="absolute top-1/4 left-1/4 w-6 h-6 text-slate-300/30 animate-float" />
        <GraduationCap className="absolute top-1/3 right-1/4 w-8 h-8 text-slate-400/30 animate-float delay-1000" />
        <Shield className="absolute bottom-1/3 left-1/5 w-5 h-5 text-slate-300/30 animate-float delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="bg-slate-700 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Selamat Datang
          </h1>
          <p className="text-slate-600 text-lg">
            Masuk ke sistem manajemen sekolah
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NIS/NKTAM Input */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                NIS / NKTAM
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
                  focusedField === 'username' ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-300 ${
                    focusedField === 'username' 
                      ? 'border-slate-600 bg-white shadow-md' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  placeholder="Masukkan NIS atau NKTAM"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
                  focusedField === 'password' ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-12 pr-14 py-4 bg-slate-50 border-2 rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-300 ${
                    focusedField === 'password' 
                      ? 'border-slate-600 bg-white shadow-md' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full bg-slate-700 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-semibold focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
            >
              <div className="flex items-center justify-center">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-center space-x-4 text-slate-500 text-sm">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>Aman</span>
              </div>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <GraduationCap className="w-4 h-4" />
                <span>Terpercaya</span>
              </div>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4" />
                <span>Modern</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            © 2025 School Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;