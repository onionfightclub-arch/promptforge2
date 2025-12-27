
import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import ResultView from './components/ResultView';
import FavoritesList from './components/FavoritesList';
import OverlayContent from './components/OverlayContent';
import ChatWidget from './components/ChatWidget';
import SearchHistory from './components/SearchHistory';
import DeploymentDashboard from './components/DeploymentDashboard';
import { discoverJsonPrompts } from './services/geminiService';
import { AppState, SearchResult, SavedResult } from './types';

const STORAGE_KEYS = {
  FAVORITES: 'json_prompter_favs_v8_violet',
  HISTORY: 'json_prompter_hist_v8_violet'
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const favsRaw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      const histRaw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const favorites = favsRaw ? JSON.parse(favsRaw) : [];
      const searchHistory = histRaw ? JSON.parse(histRaw) : [];
      return {
        isSearching: false,
        query: '',
        results: null,
        error: null,
        favorites: Array.isArray(favorites) ? favorites : [],
        searchHistory: Array.isArray(searchHistory) ? searchHistory : [],
        useCount: 0,
        isSubscribed: false,
      };
    } catch (e) {
      return {
        isSearching: false,
        query: '',
        results: null,
        error: null,
        favorites: [],
        searchHistory: [],
        useCount: 0,
        isSubscribed: false,
      };
    }
  });

  const [hasApiKey, setHasApiKey] = useState(false);
  const [activeModal, setActiveModal] = useState<'docs' | 'api' | 'privacy' | 'terms' | 'deploy' | 'dashboard' | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio?.hasSelectedApiKey) {
        try {
          const selected = await aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } catch (e) {
          setHasApiKey(false);
        }
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.searchHistory));
  }, [state.favorites, state.searchHistory]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setState(prev => ({ ...prev, isSearching: true, query, error: null, results: null }));
    try {
      const results = await discoverJsonPrompts(query);
      setState(prev => ({ 
        ...prev, 
        results, 
        isSearching: false,
        searchHistory: [query, ...prev.searchHistory.filter(h => h !== query)].slice(0, 10)
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isSearching: false, 
        error: err.message || 'The neural link was severed. Please try again.' 
      }));
    }
  };

  const handleToggleSave = (result: SearchResult) => {
    const isAlreadySaved = state.favorites.some(f => f.title === result.title);
    if (isAlreadySaved) {
      setState(prev => ({ ...prev, favorites: prev.favorites.filter(f => f.title !== result.title) }));
    } else {
      const newFav: SavedResult = {
        ...result,
        id: Math.random().toString(36).substring(7),
        savedAt: Date.now()
      };
      setState(prev => ({ ...prev, favorites: [newFav, ...prev.favorites] }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#050505] text-white selection:bg-purple-900">
      {/* Precision Deployment Header */}
      <div className="w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 py-3 px-4 sm:px-8 flex justify-between items-center z-[100] sticky top-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
            <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Preview: Active</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500/30 border border-orange-500 shadow-[0_0_8px_#f97316]"></div>
            <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase">Production: Ready</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          <button 
            onClick={() => setActiveModal('dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-500/20 rounded-lg text-[9px] font-black text-purple-400 hover:bg-purple-600/20 transition-all uppercase tracking-widest"
          >
            <i className="fas fa-chart-line"></i>
            Deployment Center
          </button>
          <div className="flex items-center gap-3 text-[9px] font-black text-gray-600 uppercase tracking-widest">
            <span className="hidden sm:inline">Engine: V8.2</span>
            <span className="text-purple-500 font-bold">Cyber Violet</span>
          </div>
        </div>
      </div>

      <header className={`w-full transition-all duration-700 px-4 sm:px-6 ${state.results ? 'pt-6 pb-2' : 'pt-16 sm:pt-24 pb-10'}`}>
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
          <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-purple-500 text-glow-purple select-none transition-all duration-500">
            JSON<span className="text-white">.</span>prompter
          </h1>
          <p className="text-[9px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] sm:tracking-[0.5em] opacity-80">
            Advanced Data Logic Scraper
          </p>
          
          <div className="pt-4 sm:pt-8">
            <SearchBar onSearch={handleSearch} isLoading={state.isSearching} />
            <SearchHistory 
              history={state.searchHistory} 
              onSelect={handleSearch} 
              onClear={() => setState(prev => ({ ...prev, searchHistory: [] }))} 
            />
          </div>

          {!state.results && !state.isSearching && (
             <div className="pt-8 sm:pt-16 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 animate-in fade-in zoom-in-95 duration-700">
               {['Payment API', 'User Auth', 'Product List', 'Analytics'].map(q => (
                 <button 
                   key={q} 
                   onClick={() => handleSearch(q)}
                   className="p-4 sm:p-6 glass rounded-2xl sm:rounded-[2.5rem] text-left hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group active:scale-95"
                 >
                   <i className="fas fa-microchip text-gray-700 group-hover:text-purple-400 mb-2 sm:mb-4 block text-base sm:text-lg"></i>
                   <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white block truncate">{q}</span>
                 </button>
               ))}
             </div>
          )}
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 flex-grow pb-24">
        {state.isSearching && (
          <div className="max-w-xl mx-auto mt-16 sm:mt-24 text-center space-y-6 sm:space-y-8 animate-pulse">
            <div className="w-14 h-14 sm:w-20 sm:h-20 border-2 border-white/5 border-t-purple-500 rounded-full animate-spin mx-auto shadow-[0_0_30px_rgba(168,85,247,0.2)]"></div>
            <div className="space-y-2">
               <h3 className="text-lg sm:text-2xl font-black text-purple-300 uppercase tracking-widest">Scanning Grid...</h3>
               <p className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-widest font-bold">Grounding Data via Gemini Flash</p>
            </div>
          </div>
        )}

        {state.error && (
          <div className="max-w-xl mx-auto mt-10 glass border-red-900/50 p-6 sm:p-12 rounded-3xl sm:rounded-[3rem] text-center space-y-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-widest mb-1 text-sm sm:text-base">System Fault</h4>
              <p className="text-gray-500 text-[10px] sm:text-xs font-mono">{state.error}</p>
            </div>
            <button onClick={() => handleSearch(state.query)} className="w-full sm:w-auto px-8 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-xl">
              Retry Link
            </button>
          </div>
        )}

        {!state.isSearching && state.results && (
          <ResultView 
            result={state.results} 
            isSaved={state.favorites.some(f => f.title === state.results?.title)}
            onSave={handleToggleSave}
            onRemove={(id) => setState(prev => ({ ...prev, favorites: prev.favorites.filter(f => f.id !== id) }))}
          />
        )}

        {!state.results && !state.isSearching && state.favorites.length > 0 && (
          <FavoritesList 
            favorites={state.favorites} 
            onRemove={(id) => setState(prev => ({ ...prev, favorites: prev.favorites.filter(f => f.id !== id) }))}
            onSelect={(fav) => setState(prev => ({ ...prev, results: fav, query: fav.title }))}
          />
        )}
      </main>

      <footer className="w-full border-t border-white/5 bg-[#050505] py-10 sm:py-16 px-6 sm:px-8 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-10">
          <div className="text-purple-900 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-center">JSON.PROMPTER // VIOLET WORKBENCH</div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-gray-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
            <button onClick={() => setActiveModal('docs')} className="hover:text-purple-400 transition-colors">Docs</button>
            <button onClick={() => setActiveModal('api')} className="hover:text-purple-400 transition-colors">API</button>
            <button onClick={() => setActiveModal('dashboard')} className="text-orange-500 hover:text-white transition-colors underline underline-offset-4 decoration-orange-500/30">Deployment Status</button>
          </div>
        </div>
      </footer>

      {activeModal === 'dashboard' ? (
        <DeploymentDashboard onClose={() => setActiveModal(null)} />
      ) : activeModal && (
        <OverlayContent type={activeModal as any} onClose={() => setActiveModal(null)} />
      )}
      
      <ChatWidget currentContext={state.results} />
    </div>
  );
};

export default App;
