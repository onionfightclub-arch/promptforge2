
import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenAI } from '@google/genai';

interface StockDataPoint {
  date: string;
  price: number;
}

interface MarketData {
  currentPrice: number;
  changePercent: number;
  history: StockDataPoint[];
  sourceUrl?: string;
}

interface StockCardProps {
  symbol: string;
}

const StockCard: React.FC<StockCardProps> = ({ symbol: initialSymbol }) => {
  const [activeSymbol, setActiveSymbol] = useState(initialSymbol);
  const [inputSymbol, setInputSymbol] = useState(initialSymbol);
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const refreshInterval = useRef<number | null>(null);

  /**
   * Fetches real-time market data using Gemini Search Grounding.
   */
  const fetchMarketData = async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
      setData(null);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Fetch the current stock price and the last 7 days of daily closing prices for the symbol "${activeSymbol}". 
                  Format the output strictly as a JSON object with keys: 
                  "currentPrice" (number), "changePercent" (number), and "history" (array of {date: string, price: number}). 
                  Keep dates very short, like 'Mon', 'Tue', etc.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      const sourceUrl = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri;

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Logic Sync Failure: The model returned a malformed response format.");
      }
      
      const parsed: MarketData = JSON.parse(jsonMatch[0]);
      
      if (!parsed.history || parsed.history.length === 0 || typeof parsed.currentPrice !== 'number') {
        throw new Error("Data Incomplete: The market feed returned an empty dataset for this asset.");
      }

      setData({ ...parsed, sourceUrl });
    } catch (err: any) {
      console.error("Market Data Retrieval Error:", err);
      const errorMessage = err.message || "Establishing Signal failed.";
      let hint = "Check your connection or verify the asset ticker symbol is correct.";
      
      if (errorMessage.includes("malformed")) {
        hint = "The search engine could not structure the price data correctly. Retrying might solve this.";
      } else if (errorMessage.includes("empty")) {
        hint = "No recent historical price data was found for this symbol on the web.";
      }

      if (isInitial) {
        setError({ message: errorMessage, hint });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData(true);

    if (refreshInterval.current) {
      window.clearInterval(refreshInterval.current);
    }

    refreshInterval.current = window.setInterval(() => {
      fetchMarketData(false);
    }, 15000);

    return () => {
      if (refreshInterval.current) {
        window.clearInterval(refreshInterval.current);
      }
    };
  }, [activeSymbol]);

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSymbol.trim() && inputSymbol.toUpperCase() !== activeSymbol.toUpperCase()) {
      setActiveSymbol(inputSymbol.toUpperCase());
    }
  };

  const copyQuote = () => {
    if (!data) return;
    const quote = `${activeSymbol}: $${data.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
    navigator.clipboard.writeText(quote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUp = data ? data.changePercent >= 0 : true;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden group">
      
      {/* Background Decorative Element */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000 ${isUp ? 'bg-green-500/5' : 'bg-red-500/5'}`}></div>

      {/* Background Refresher Pulse Line */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className="h-full bg-blue-500 w-1/3 animate-[refresh-slide_1.5s_infinite_linear] shadow-[0_0_10px_#3b82f6]"></div>
        </div>
      )}

      {/* Symbol Switcher Input */}
      <div className="relative z-10 mb-8">
        <form onSubmit={handleSymbolSubmit} className="flex items-center gap-2 max-w-[200px]">
          <div className="relative flex-grow">
            <i className="fas fa-search-dollar absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600"></i>
            <input 
              type="text" 
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-blue-500/30 transition-all placeholder-gray-700"
              placeholder="SYMBOL..."
            />
          </div>
          <button 
            type="submit"
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:border-blue-500/30 transition-all active:scale-90"
          >
            <i className="fas fa-arrow-right text-[10px]"></i>
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="h-[280px] flex flex-col items-center justify-center space-y-6 relative">
          <div className="relative">
            {/* Radar Animation */}
            <div className="absolute inset-[-20px] rounded-full border border-blue-500/10 animate-ping opacity-20"></div>
            <div className="absolute inset-[-40px] rounded-full border border-blue-500/5 animate-ping opacity-10 delay-300"></div>
            
            <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center bg-blue-500/5 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent animate-[radar-spin_2s_infinite_linear] origin-center"></div>
               <i className="fas fa-satellite-dish text-blue-500 text-xl relative z-10"></i>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Establishing Signal</p>
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Tracing {activeSymbol} Market Flux</p>
          </div>
        </div>
      ) : error || !data ? (
        <div className="h-[280px] flex flex-col items-center justify-center text-center space-y-4 px-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-white uppercase tracking-widest">Feed Fault</p>
            <p className="text-[10px] text-gray-500 leading-relaxed font-mono">{(error as any)?.message || "Signal Interrupted"}</p>
            {(error as any)?.hint && (
              <p className="text-[9px] text-red-500/60 font-bold uppercase tracking-tight mt-2 max-w-[220px]">{(error as any).hint}</p>
            )}
          </div>
          <button 
            onClick={() => fetchMarketData(true)}
            className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase text-white transition-all active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          {/* Real-time Status */}
          <div className="absolute top-8 right-8 flex items-center gap-3">
            {isRefreshing ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-lg shadow-blue-500/10 animate-in fade-in zoom-in-90">
                <i className="fas fa-sync-alt fa-spin text-[8px] text-blue-400"></i>
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Updating</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Live Link</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Asset Class</h4>
              <h3 className="text-4xl font-black text-white tracking-tighter">{activeSymbol}</h3>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center gap-2 group/price relative">
                <div className="text-3xl font-mono font-black text-white">${data.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <button 
                  onClick={copyQuote}
                  title="Copy Price Quote"
                  className={`text-[10px] transition-all ${copied ? 'text-green-400' : 'text-gray-700 hover:text-white opacity-0 group-hover/price:opacity-100'}`}
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                </button>
              </div>
              <div className={`text-xs font-black flex items-center justify-end gap-1.5 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                <i className={`fas fa-caret-${isUp ? 'up' : 'down'}`}></i>
                {Math.abs(data.changePercent).toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="h-[140px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.history}>
                <defs>
                  <linearGradient id={`chartGradient-${activeSymbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1a1a1a" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#444', fontSize: 9, fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0d0d0d', 
                    border: '1px solid #222', 
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                  labelStyle={{ color: '#555', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                  cursor={{ stroke: '#333', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isUp ? "#10b981" : "#ef4444"} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill={`url(#chartGradient-${activeSymbol})`} 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-6 border-t border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <i className="fas fa-shield-halved text-[9px] text-gray-700"></i>
                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Grounding Verified</span>
              </div>
              {data.sourceUrl && (
                <a 
                  href={data.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded text-[9px] font-black text-blue-500 transition-colors uppercase tracking-widest"
                >
                  Source
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Refresh Loop Active</span>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes refresh-slide {
          from { transform: translateX(-100%); }
          to { transform: translateX(300%); }
        }
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StockCard;
