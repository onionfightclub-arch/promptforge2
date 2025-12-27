
import React, { useState } from 'react';
import { SavedResult } from '../types';

interface FavoritesListProps {
  favorites: SavedResult[];
  onRemove: (id: string) => void;
  onSelect: (result: SavedResult) => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onRemove, onSelect }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (favorites.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-16 sm:mt-24 mb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="flex items-center justify-between mb-8 sm:mb-12 border-b border-white/5 pb-4 sm:pb-6">
        <h2 className="text-xl sm:text-3xl font-black text-white flex items-center gap-3 sm:gap-5 tracking-tighter">
          <i className="fas fa-bookmark text-purple-500"></i>
          Saved Architecture
          <span className="text-[9px] sm:text-[10px] font-black text-gray-500 bg-white/5 px-2 sm:px-3 py-1 rounded-full ml-1 sm:ml-2 uppercase">
            {favorites.length} Modules
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {favorites.map((fav) => (
          <div 
            key={fav.id}
            className="group relative glass rounded-[1.5rem] sm:rounded-[2.5rem] p-7 sm:p-10 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all cursor-pointer shadow-2xl"
            onClick={() => onSelect(fav)}
          >
            <div className="absolute top-7 sm:top-10 right-7 sm:right-10 flex gap-2">
              <button
                onClick={(e) => handleCopy(e, fav.jsonPrompt, fav.id)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all flex items-center justify-center ${copiedId === fav.id ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                title="Copy Prompt"
              >
                <i className={`fas ${copiedId === fav.id ? 'fa-check' : 'fa-copy'} text-sm`}></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(fav.id);
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg sm:rounded-xl transition-all flex items-center justify-center"
              >
                <i className="fas fa-trash-alt text-sm"></i>
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <h3 className="font-black text-white text-xl sm:text-2xl group-hover:text-purple-400 transition-colors line-clamp-1 pr-20 sm:pr-24 tracking-tight">
                {fav.title}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mt-2">
                SYNTHESIZED {new Date(fav.savedAt).toLocaleDateString()}
              </p>
            </div>

            <p className="text-gray-400 text-xs sm:text-sm line-clamp-3 mb-8 sm:mb-10 leading-relaxed font-medium">
              {fav.description}
            </p>

            <div className={`flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors ${copiedId === fav.id ? 'text-green-400' : 'text-purple-500/60 group-hover:text-purple-400'}`}>
              <i className="fas fa-terminal"></i>
              <span>{copiedId === fav.id ? 'Ready' : 'Logic Available'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesList;
