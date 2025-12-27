
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSearch(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative group px-2 sm:px-0" role="search">
      <div className="relative flex items-center shadow-2xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#111]">
        <div className="absolute left-4 sm:left-8 text-gray-600">
          <i className="fas fa-search text-sm sm:text-lg" aria-hidden="true"></i>
        </div>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Discovery query..."
          className="w-full bg-transparent py-4 sm:py-6 pl-10 sm:pl-18 pr-24 sm:pr-44 text-white placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-500/5 transition-all text-sm sm:text-lg font-medium"
        />

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`absolute right-1 sm:right-2 top-1 sm:top-2 bottom-1 sm:bottom-2 px-5 sm:px-12 rounded-xl sm:rounded-[2rem] font-black text-[10px] sm:text-[12px] uppercase tracking-widest transition-all ${
            isLoading || !input.trim()
              ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-500/20 active:scale-95'
          }`}
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            'Scrape'
          )}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
