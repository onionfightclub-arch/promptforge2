
import React from 'react';

interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-4 sm:mt-6 px-4 sm:px-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
        <h5 className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-history text-[7px] sm:text-[9px]"></i>
          Session Trace
        </h5>
        <button 
          onClick={onClear}
          className="text-[8px] sm:text-[10px] font-black text-gray-600 hover:text-red-500 transition-colors uppercase"
        >
          Reset
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
        {history.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(item)}
            className="px-3 py-1.5 bg-[#111] border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/10 rounded-lg text-[9px] sm:text-[10px] font-bold text-gray-500 hover:text-purple-300 transition-all active:scale-95 whitespace-nowrap"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchHistory;
