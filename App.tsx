import React, { useState, useEffect, useMemo } from 'react';
import StockList from './components/StockList';
import StockChart from './components/StockChart';
import AnalysisPanel from './components/AnalysisPanel';
import NewsPanel from './components/NewsPanel';
import CompanyInfoPanel from './components/CompanyInfoPanel';
import StrategyPanel from './components/StrategyPanel';
import { StockSymbol, OHLCData } from './types';
import { generateMockData, getLatestIndicators, getFallbackPrice } from './services/stockUtils';
import { getRealTimePriceNumber, lookupStockSymbol } from './services/geminiService';
import { Loader2, LayoutDashboard, Newspaper, Info, TrendingUp, Search, BellRing, X } from 'lucide-react';

type TabType = 'chart' | 'news' | 'info' | 'strategy';

const App: React.FC = () => {
  // 1. Initialize from localStorage
  const [stocks, setStocks] = useState<StockSymbol[]>(() => {
    try {
      const saved = localStorage.getItem('myWatchlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
     try {
       const savedList = localStorage.getItem('myWatchlist');
       const parsedList = savedList ? JSON.parse(savedList) : [];
       return parsedList.length > 0 ? parsedList[0].symbol : '';
     } catch {
       return '';
     }
  });

  const [marketData, setMarketData] = useState<OHLCData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chart');
  
  // Notification State
  const [activeAlert, setActiveAlert] = useState<{symbol: string, price: number, triggerPrice: number} | null>(null);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('myWatchlist', JSON.stringify(stocks));
  }, [stocks]);

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveTab('chart');
  };

  const handleRemoveStock = (symbol: string) => {
    const newStocks = stocks.filter(s => s.symbol !== symbol);
    setStocks(newStocks);
    
    if (selectedSymbol === symbol) {
      if (newStocks.length > 0) {
        setSelectedSymbol(newStocks[0].symbol);
      } else {
        setSelectedSymbol('');
      }
    }
  };

  const handleUpdateAlert = (symbol: string, price: number | undefined) => {
    setStocks(prev => prev.map(s => s.symbol === symbol ? { ...s, alertPrice: price } : s));
  };

  const handleSearch = async (query: string) => {
    const existing = stocks.find(s => s.symbol.toLowerCase() === query.toLowerCase() || s.name.toLowerCase().includes(query.toLowerCase()));
    if (existing) {
      handleSelectSymbol(existing.symbol);
      return;
    }

    setIsSearching(true);
    const result = await lookupStockSymbol(query);
    setIsSearching(false);

    if (result) {
      setStocks(prev => {
        if (prev.some(s => s.symbol === result.symbol)) return prev;
        return [result, ...prev];
      });
      handleSelectSymbol(result.symbol);
    } else {
      alert(`找不到 "${query}" 對應的股票代號，請重試。`);
    }
  };

  // Fetch real price and check alerts
  useEffect(() => {
    if (!selectedSymbol) {
      setMarketData([]);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsSyncing(true);
      
      const initialPrice = getFallbackPrice(selectedSymbol);
      const initialData = generateMockData(selectedSymbol, 100, initialPrice);
      if (isMounted) setMarketData(initialData);

      try {
        const realPrice = await getRealTimePriceNumber(selectedSymbol);
        
        if (isMounted && realPrice && realPrice > 0) {
          const accurateData = generateMockData(selectedSymbol, 100, realPrice);
          setMarketData(accurateData);

          // Check Alert Logic
          const currentStock = stocks.find(s => s.symbol === selectedSymbol);
          if (currentStock && currentStock.alertPrice) {
            // Simple logic: if price is within 1% range or crossed?
            // For now, let's just alert if it's very close or crossed.
            // In a real app, we'd store "last price" and check direction.
            // Here we just notify if it exists.
            
            // Let's assume the alert is a "Price Target". 
            // If we are seeing this price update now, show notification.
            // To avoid spamming, we could check a flag, but for demo:
            if (Math.abs(realPrice - currentStock.alertPrice) / realPrice < 0.05) { // Within 5%
               setActiveAlert({
                 symbol: selectedSymbol,
                 price: currentStock.alertPrice,
                 triggerPrice: realPrice
               });
            }
          }
        }
      } catch (e) {
        console.warn("Using fallback price due to fetch error");
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [selectedSymbol, stocks]); // Depend on stocks to pick up alert changes

  const indicators = useMemo(() => {
    return getLatestIndicators(marketData);
  }, [marketData]);

  const currentPrice = marketData.length > 0 ? marketData[marketData.length - 1].close : 0;

  return (
    <div className="flex h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Toast Notification */}
      {activeAlert && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-right fade-in duration-300">
           <div className="bg-gray-800 border-l-4 border-yellow-500 text-white p-4 rounded shadow-2xl flex items-start gap-3 max-w-sm">
              <div className="bg-yellow-500/20 p-2 rounded-full">
                 <BellRing className="w-6 h-6 text-yellow-500 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{activeAlert.symbol} 價位提醒!</h4>
                <p className="text-sm text-gray-300">
                  目前價格 <span className="text-white font-mono font-bold">${activeAlert.triggerPrice}</span> 已接近您設定的目標價 <span className="text-yellow-400 font-mono font-bold">${activeAlert.price}</span>
                </p>
              </div>
              <button onClick={() => setActiveAlert(null)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}

      {/* Sidebar */}
      <StockList 
        stocks={stocks} 
        selectedSymbol={selectedSymbol} 
        onSelect={handleSelectSymbol}
        onSearch={handleSearch}
        onRemove={handleRemoveStock}
        onUpdateAlert={handleUpdateAlert}
        isSearching={isSearching}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-950">
        
        {/* Empty State */}
        {!selectedSymbol && (
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="bg-gray-900 p-8 rounded-full mb-6 animate-pulse">
                <Search className="w-16 h-16 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">開始您的投資分析</h2>
              <p className="max-w-md text-center text-gray-400">
                您的自選清單目前為空。請在左側搜尋欄輸入股票代碼或公司名稱（例如：AAPL, 台積電, NVDA）來新增追蹤。
              </p>
           </div>
        )}

        {/* Dashboard Content */}
        {selectedSymbol && (
          <>
            {/* Header with Tabs */}
            <div className="h-14 border-b border-gray-800 flex items-center px-6 bg-gray-900 justify-between shrink-0">
              <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-white tracking-tight">{selectedSymbol}</h2>
                 {isSyncing && (
                    <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" /> 即時同步中
                    </div>
                 )}
              </div>

              <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'chart' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> 走勢圖
                </button>
                <button
                  onClick={() => setActiveTab('strategy')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'strategy' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> 投資建議
                </button>
                <button
                  onClick={() => setActiveTab('news')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'news' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Newspaper className="w-4 h-4" /> 相關新聞
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'info' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Info className="w-4 h-4" /> 公司資料
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
              
              {/* Chart View */}
              {activeTab === 'chart' && (
                <div className="flex flex-col md:flex-row h-full">
                  <div className="flex-1 p-4 md:p-6 flex flex-col min-h-[50vh]">
                    <StockChart data={marketData} symbol={selectedSymbol} />
                    <div className="mt-4 grid grid-cols-4 gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
                      <div>
                          <span className="text-gray-500 text-xs">開盤 (Open)</span>
                          <p className="text-white font-mono">{marketData[marketData.length-1]?.open.toFixed(2)}</p>
                      </div>
                      <div>
                          <span className="text-gray-500 text-xs">最高 (High)</span>
                          <p className="text-white font-mono">{marketData[marketData.length-1]?.high.toFixed(2)}</p>
                      </div>
                      <div>
                          <span className="text-gray-500 text-xs">最低 (Low)</span>
                          <p className="text-white font-mono">{marketData[marketData.length-1]?.low.toFixed(2)}</p>
                      </div>
                      <div>
                          <span className="text-gray-500 text-xs">成交量 (Vol)</span>
                          <p className="text-white font-mono">{(marketData[marketData.length-1]?.volume / 1000).toFixed(1)}k</p>
                      </div>
                    </div>
                  </div>
                  <AnalysisPanel 
                    symbol={selectedSymbol}
                    indicators={indicators}
                    currentPrice={currentPrice}
                    data={marketData}
                  />
                </div>
              )}
              
              {/* Strategy View */}
              {activeTab === 'strategy' && (
                <StrategyPanel symbol={selectedSymbol} currentPrice={currentPrice} data={marketData} />
              )}

              {/* News View */}
              {activeTab === 'news' && (
                 <NewsPanel symbol={selectedSymbol} />
              )}

              {/* Info View */}
              {activeTab === 'info' && (
                 <CompanyInfoPanel symbol={selectedSymbol} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
