import React, { useState } from 'react';
import { StockSymbol } from '../types';
import { validateConnection } from '../services/geminiService';
import { TrendingUp, Activity, BarChart2, Search, Loader2, Trash2, PlusCircle, Bell, BellRing, Check, X, ShieldCheck, ShieldAlert } from 'lucide-react';

interface StockListProps {
  stocks: StockSymbol[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  onSearch: (query: string) => void;
  onRemove: (symbol: string) => void;
  onUpdateAlert: (symbol: string, price: number | undefined) => void;
  isSearching: boolean;
}

const StockList: React.FC<StockListProps> = ({ stocks, selectedSymbol, onSelect, onSearch, onRemove, onUpdateAlert, isSearching }) => {
  const [query, setQuery] = useState('');
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [tempAlertPrice, setTempAlertPrice] = useState('');
  
  // Connection Test State
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery('');
    }
  };

  const startEditingAlert = (e: React.MouseEvent, symbol: string, currentPrice?: number) => {
    e.stopPropagation();
    setEditingAlertId(symbol);
    setTempAlertPrice(currentPrice?.toString() || '');
  };

  const saveAlert = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    const price = parseFloat(tempAlertPrice);
    if (!isNaN(price) && price > 0) {
      onUpdateAlert(symbol, price);
    } else {
      onUpdateAlert(symbol, undefined); // Clear alert if invalid or empty
    }
    setEditingAlertId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAlertId(null);
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestMessage('連線測試中...');
    
    try {
      const result = await validateConnection();
      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message);
      } else {
        setTestStatus('error');
        setTestMessage(result.message);
      }
    } catch (e) {
      setTestStatus('error');
      setTestMessage('發生未預期的錯誤');
    }
    
    // Reset after 5 seconds if success
    if (testStatus === 'success') {
        setTimeout(() => setTestStatus('idle'), 5000);
    }
  };

  return (
    <div className="w-full md:w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-blue-500 w-6 h-6" />
          <h1 className="text-lg font-bold text-gray-100">自選股清單</h1>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="relative">
           <input 
             type="text" 
             placeholder="新增股票 (如: NVDA)..." 
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             className="w-full bg-gray-800 text-sm text-white rounded-md pl-9 pr-4 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500"
             disabled={isSearching}
           />
           <div className="absolute left-3 top-2.5 text-gray-400">
             {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
           </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        {stocks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 p-4 text-center">
            <PlusCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">您的清單是空的</p>
            <p className="text-xs text-gray-600 mt-1">請上方搜尋並加入股票</p>
          </div>
        )}

        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className={`w-full text-left border-b border-gray-800 transition-colors hover:bg-gray-800 flex items-center justify-between group relative
              ${selectedSymbol === stock.symbol ? 'bg-gray-800 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
            `}
          >
            <button 
              onClick={() => onSelect(stock.symbol)}
              className="flex-1 p-4 flex flex-col gap-1 text-left min-w-0"
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{stock.symbol}</span>
                {selectedSymbol === stock.symbol && <Activity className="w-4 h-4 text-blue-400" />}
              </div>
              <span className="text-sm text-gray-400 truncate">{stock.name}</span>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">
                    {stock.sector}
                 </span>
                 {stock.alertPrice && editingAlertId !== stock.symbol && (
                   <span className="text-xs text-yellow-500 flex items-center gap-0.5 bg-yellow-900/20 px-1.5 py-0.5 rounded border border-yellow-800/50">
                     <BellRing className="w-3 h-3" /> ${stock.alertPrice}
                   </span>
                 )}
              </div>
            </button>
            
            {/* Action Buttons */}
            <div className="flex items-center px-2 gap-1">
                {editingAlertId === stock.symbol ? (
                    <div className="flex items-center bg-gray-900 rounded p-1 border border-blue-500 absolute right-2 top-2 z-10 shadow-xl">
                        <input 
                          type="number" 
                          value={tempAlertPrice}
                          onChange={(e) => setTempAlertPrice(e.target.value)}
                          placeholder="價位"
                          className="w-20 bg-transparent text-white text-sm outline-none px-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button onClick={(e) => saveAlert(e, stock.symbol)} className="p-1 hover:text-green-400 text-gray-400"><Check className="w-4 h-4"/></button>
                        <button onClick={cancelEdit} className="p-1 hover:text-red-400 text-gray-400"><X className="w-4 h-4"/></button>
                    </div>
                ) : (
                    <>
                        <button
                          onClick={(e) => startEditingAlert(e, stock.symbol, stock.alertPrice)}
                          className={`p-2 transition-colors ${stock.alertPrice ? 'text-yellow-500 opacity-100' : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}
                          title="設定價位通知"
                        >
                          {stock.alertPrice ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(stock.symbol);
                          }}
                          className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer / API Status Check */}
      <div className="p-4 border-t border-gray-800 text-xs">
        <button 
          onClick={handleTestConnection}
          disabled={testStatus === 'loading'}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded transition-colors ${
            testStatus === 'error' ? 'bg-red-900/30 text-red-400 border border-red-800' :
            testStatus === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' :
            'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {testStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
           testStatus === 'success' ? <ShieldCheck className="w-3 h-3" /> :
           testStatus === 'error' ? <ShieldAlert className="w-3 h-3" /> :
           <BarChart2 className="w-3 h-3" />}
           
          <span>
            {testStatus === 'loading' ? '連線測試中...' : 
             testStatus === 'success' ? 'API 連線正常' :
             testStatus === 'error' ? '連線失敗' :
             '測試 API 連線'}
          </span>
        </button>
        {testMessage && testStatus === 'error' && (
          <p className="mt-2 text-red-400 text-center leading-tight">{testMessage}</p>
        )}
      </div>
    </div>
  );
};

export default StockList;