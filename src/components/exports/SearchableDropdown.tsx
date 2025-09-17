import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';

interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  value: string;
  options: Option[];
  placeholder?: string;
  loading?: boolean;
  onSelect: (value: string) => void;
  onSearchTermChange: (searchTerm: string) => void;
  className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  options,
  placeholder = "Search and select...",
  loading = false,
  onSelect,
  onSearchTermChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce the search term
  const debouncedSearchTerm = useDebounce(inputValue, 500);
  
  // Find the selected option to display its label
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  // Effect to handle debounced search term changes
  useEffect(() => {
    onSearchTermChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchTermChange]);

  // Effect to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHighlightedIndex(-1);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: Option) => {
    onSelect(option.value);
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setInputValue('');
      setHighlightedIndex(-1);
    } else {
      setIsOpen(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleOptionSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setInputValue('');
        setHighlightedIndex(-1);
        break;
    }
  };

  // Filter options based on input value (client-side filtering for better UX)
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Main Input/Display Area */}
      <div
        className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-l-md shadow-sm border-r-0 cursor-pointer hover:border-gray-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all duration-200"
        onClick={handleDropdownToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {isOpen ? (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full border-none outline-none bg-transparent text-sm"
                autoComplete="off"
              />
            ) : (
              <span className={`block truncate ${!displayValue ? 'text-gray-500' : ''}`}>
                {displayValue || placeholder}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {loading && (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            )}
            {value && !isOpen && (
              <button
                onClick={handleClear}
                className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <Search className="w-4 h-4 mr-2" />
              {inputValue ? `No results found for "${inputValue}"` : 'Start typing to search...'}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${
                  index === highlightedIndex ? 'bg-gray-100' : ''
                } ${
                  option.value === value ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-900'
                }`}
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="truncate">{option.label}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;