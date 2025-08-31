import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { BasicTeacher } from '@/types/user';
import { useTeacherCache } from '@/contexts/TeacherCacheContext';

interface VirtualSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const VirtualSelect: React.FC<VirtualSelectProps> = memo(({
  value,
  onChange,
  placeholder = "-- Pilih Guru --",
  className = "",
  disabled = false
}) => {
  const { searchTeachers: searchTeachersFromCache, getTeacherById } = useTeacherCache();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ 
    top: 0, 
    left: 0, 
    width: 0, 
    maxHeight: 320, // Default max height
    openUpward: false // Whether to open above the trigger
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Selected teacher from current value - get from cache
  const selectedTeacher = useMemo(() => {
    if (!value) return undefined;
    return getTeacherById(value);
  }, [value, getTeacherById]);

  // Get filtered teachers directly from cache without storing in state
  const filteredTeachers = useMemo(() => {
    if (!isOpen) return []; // Don't load data when closed
    
    try {
      const results = searchTeachersFromCache(searchTerm);
      setError(null);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teachers';
      setError(errorMessage);
      console.error('Error loading teachers:', err);
      return [];
    }
  }, [isOpen, searchTerm, searchTeachersFromCache]);

  // Close dropdown when clicking outside and cleanup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both the trigger and the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Additional check for portal dropdown (since it's rendered in document.body)
        const dropdownElement = document.querySelector('[data-dropdown-portal]');
        if (!dropdownElement || !dropdownElement.contains(target)) {
          setIsOpen(false);
          // Clear search term and reset state when closing
          setSearchTerm('');
          setError(null);
        }
      }
    };

    const handleScroll = () => {
      if (isOpen && dropdownRef.current) {
        calculateDropdownPosition();
      }
    };

    // Smart positioning calculation
    const calculateDropdownPosition = () => {
      if (!dropdownRef.current) return;
      
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Dropdown dimensions
      const dropdownHeight = 320; // Max height including search and options
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Determine if we should open upward or downward
      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      // Calculate available height
      const availableHeight = shouldOpenUpward ? 
        Math.min(spaceAbove - 10, dropdownHeight) : // 10px margin from top
        Math.min(spaceBelow - 10, dropdownHeight);   // 10px margin from bottom
      
      // Ensure minimum height
      const finalHeight = Math.max(availableHeight, 200); // Minimum 200px
      
      // Calculate position
      const top = shouldOpenUpward ? 
        rect.top + window.scrollY - finalHeight :
        rect.bottom + window.scrollY;
      
      // Ensure dropdown doesn't go outside viewport horizontally
      let left = rect.left + window.scrollX;
      if (left + rect.width > viewportWidth) {
        left = viewportWidth - rect.width - 10; // 10px margin from right
      }
      if (left < 10) {
        left = 10; // 10px margin from left
      }
      
      setDropdownPosition({
        top,
        left,
        width: rect.width,
        maxHeight: finalHeight,
        openUpward: shouldOpenUpward
      });
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', calculateDropdownPosition);
    }

    // Cleanup function
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', calculateDropdownPosition);
    };
  }, [isOpen]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Reset all state when component unmounts
      setIsOpen(false);
      setSearchTerm('');
      setError(null);
      setLoading(false);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen && dropdownRef.current) {
        // Calculate position when opening
        setTimeout(() => calculateDropdownPosition(), 0);
      }
      
      // Reset state when closing
      if (isOpen) {
        setSearchTerm('');
        setError(null);
      }
      
      setIsOpen(!isOpen);
    }
  };

  // Smart positioning calculation
  const calculateDropdownPosition = () => {
    if (!dropdownRef.current) return;
    
    const rect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Dropdown dimensions
    const dropdownHeight = 320; // Max height including search and options
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Determine if we should open upward or downward
    const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    // Calculate available height
    const availableHeight = shouldOpenUpward ? 
      Math.min(spaceAbove - 10, dropdownHeight) : // 10px margin from top
      Math.min(spaceBelow - 10, dropdownHeight);   // 10px margin from bottom
    
    // Ensure minimum height
    const finalHeight = Math.max(availableHeight, 200); // Minimum 200px
    
    // Calculate position
    const top = shouldOpenUpward ? 
      rect.top + window.scrollY - finalHeight :
      rect.bottom + window.scrollY;
    
    // Ensure dropdown doesn't go outside viewport horizontally
    let left = rect.left + window.scrollX;
    if (left + rect.width > viewportWidth) {
      left = viewportWidth - rect.width - 10; // 10px margin from right
    }
    if (left < 10) {
      left = 10; // 10px margin from left
    }
    
    setDropdownPosition({
      top,
      left,
      width: rect.width,
      maxHeight: finalHeight,
      openUpward: shouldOpenUpward
    });
  };

  const handleSelect = (teacherId: string) => {
    onChange(teacherId);
    // Cleanup state when selecting
    setIsOpen(false);
    setSearchTerm('');
    setError(null);
  };

  const handleClear = () => {
    onChange('');
    // Cleanup state when clearing
    setIsOpen(false);
    setSearchTerm('');
    setError(null);
  };

  // Filter teachers based on search term
  // Removed this since we're getting filtered data directly from cache

  // Render dropdown using portal
  const renderDropdown = () => {
    if (!isOpen || disabled) return null;

    return createPortal(
      <div 
        data-dropdown-portal="true"
        className={`fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-xl ${
          dropdownPosition.openUpward ? 'rounded-b-md rounded-t-lg' : 'rounded-t-md rounded-b-lg'
        }`}
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          maxHeight: `${dropdownPosition.maxHeight}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Search Input */}
        <div className="p-2 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Clear Selection Option */}
        <div className="border-b border-gray-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClear();
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
          >
            {placeholder}
          </button>
        </div>

        {/* Options List */}
        <div 
          className="overflow-auto"
          style={{
            maxHeight: `${Math.max(dropdownPosition.maxHeight - 120, 120)}px` // Subtract search and clear sections height
          }}
        >
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Memuat guru...</span>
            </div>
          )}

          {error && (
            <div className="px-3 py-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && filteredTeachers.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
              {searchTerm ? 'Tidak ada guru ditemukan' : 'Tidak ada data guru'}
            </div>
          )}

          {!loading && !error && filteredTeachers.map((teacher) => {
            const isSelected = teacher._id === value;
            
            return (
              <button
                key={teacher._id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(teacher._id);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center justify-between ${
                  isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                }`}
              >
                <div className="truncate">
                  <div className="font-medium">{teacher.full_name}</div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left bg-white transition-colors ${
          disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : value 
              ? 'border-green-300 bg-green-50 text-green-900' 
              : 'border-gray-300 text-gray-500 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="truncate">
            {selectedTeacher?.full_name || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
      </button>

      {/* Render dropdown via portal */}
      {renderDropdown()}
    </div>
  );
});

VirtualSelect.displayName = 'VirtualSelect';

export default VirtualSelect;