import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
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
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  options,
  placeholder = "Type to search...",
  loading = false,
  onSelect,
  onSearchTermChange,
  className = "",
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce the input value for search
  const debouncedInputValue = useDebounce(inputValue, 500);
  
  // Effect to sync inputValue with selected value
  useEffect(() => {
    console.log('🔄 Syncing inputValue with value prop:', { value, options: options.length });
    
    if (value && options.length > 0) {
      const selectedOption = options.find(option => option.value === value);
      if (selectedOption && !isSearching) {
        console.log('✅ Found selected option, setting inputValue to:', selectedOption.label);
        setInputValue(selectedOption.label);
        return;
      }
    }
    
    // If no value is selected and not searching, clear input
    if (!value && !isSearching) {
      console.log('🧹 No value selected and not searching, clearing inputValue');
      setInputValue('');
    }
  }, [value, options, isSearching]);

  // Effect to handle debounced search
  useEffect(() => {
    console.log('🔍 Debounced search effect:', { debouncedInputValue, isSearching, isOpen });
    
    if (isSearching && isOpen && debouncedInputValue.trim()) {
      console.log('🚀 Triggering search for:', debouncedInputValue);
      onSearchTermChange(debouncedInputValue.trim());
    }
  }, [debouncedInputValue, onSearchTermChange, isSearching, isOpen]);

  // Effect to handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        console.log('👆 Click outside detected');
        setIsOpen(false);
        setHighlightedIndex(-1);
        setIsSearching(false);
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
    console.log('✏️ Input changed to:', newValue);
    
    setInputValue(newValue);
    setHighlightedIndex(-1);
    setIsSearching(true);
    
    // Clear the selected value when user starts typing
    if (value && newValue !== inputValue) {
      console.log('🗑️ Clearing selected value because user is typing');
      onSelect('');
    }
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    console.log('🎯 Input focused');
    setIsOpen(true);
    
    // If there's a selected value, start searching mode when user focuses
    if (value) {
      setIsSearching(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    console.log('😴 Input blurred');
    // Delay to allow for option clicks
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      setIsSearching(false);
    }, 150);
  };

  // Handle option selection
  const handleOptionSelect = (option: Option) => {
    console.log('✅ Option selected:', option);
    
    setInputValue(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setIsSearching(false);
    
    onSelect(option.value);
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🗑️ Clearing selection');
    
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    setIsSearching(false);
    
    onSelect('');
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        setIsSearching(true);
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
        setHighlightedIndex(-1);
        setIsSearching(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full px-3 py-2 pr-8 text-sm text-gray-900 bg-white border border-gray-300 rounded-l-md shadow-sm border-r-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        
        {/* Loading indicator and clear button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {loading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin mr-1" />
          )}
          {value && !disabled && (
            <button
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
              tabIndex={-1}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {inputValue ? `No results found for "${inputValue}"` : 'Start typing to search...'}
            </div>
          ) : (
            options.map((option, index) => (
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