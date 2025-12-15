import React, { useState } from 'react';
import { TechnicalIndicators, AIAnalysisResult, TradeSignal, MarketContext } from '../types';
import { analyzeStock, fetchMarketContext } from '../services/geminiService';
import { OHLCData } from '../types';
import { BrainCircuit, ArrowRight, Activity, TrendingUp, TrendingDown, Minus, Globe, ExternalLink } from 'lucide-react';

interface AnalysisPanelProps {
  symbol: string;
  indicators: TechnicalIndicators;
  currentPrice: number;
  data: OHLCData[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ symbol, indicators, currentPrice, data }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    // Run both parallel
    const [aiResult, contextResult] = await Promise.all([
      analyzeStock(symbol, data, indicators),
      fetchMarketContext(symbol)
    ]);
    
    setAnalysis(aiResult);
    setMarketContext(contextResult);
    setLoading(false);
  };

  const getSignalColor = (signal: TradeSignal) => {
    switch (signal) {
      case TradeSignal.BUY: return 'text-green-400 border-green-500 bg-green-900/20';
      case TradeSignal.SELL: return 'text-red-400 border-red-500 bg-red-900/20';
      default: return 'text-yellow-400 border-yellow-500 bg-yellow-900/20';
    }
  };

  const getSignalText = (signal: TradeSignal) => {
    switch (signal) {
      case TradeSignal.BUY: return '建議買進';
      case TradeSignal.SELL: return '建議賣出';
      default: return '建議持有';
    }
  };

  const getSignalIcon = (signal: TradeSignal) => {
    switch (signal) {
      case TradeSignal.BUY: return <TrendingUp className="w-8 h-8" />;
      case TradeSignal.SELL: return <TrendingDown className="w-8 h-8" />;
      default: return <Minus className="w-8 h-8" />;
    }
  };

  return (
    <div className="bg-gray-900 border-l border-gray-800 w-full lg:w-96 flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-1">技術分析觀點</h2>
        <p className="text-gray-400 text-sm">即時指標與 AI 解讀</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <span className="text-gray-400 text-xs uppercase block mb-1">最新價格 (圖表)</span>
            <span className="text-2xl font-mono text-white">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
             <span className="text-gray-400 text-xs uppercase block mb-1">RSI (14) 強弱</span>
             <span className={`text-2xl font-mono ${indicators.rsi > 70 ? 'text-red-400' : indicators.rsi < 30 ? 'text-green-400' : 'text-white'}`}>
               {indicators.rsi.toFixed(1)}
             </span>
          </div>
        </div>

        {/* MACD Section */}
        <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-gray-200">MACD 指標 (12, 26, 9)</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">MACD 快線</span>
              <span className="text-blue-300 font-mono">{indicators.macd.macdLine.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Signal 慢線</span>
              <span className="text-orange-300 font-mono">{indicators.macd.signalLine.toFixed(4)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
              <span className="text-gray-400">柱狀圖 (Histogram)</span>
              <span className={`font-mono ${indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {indicators.macd.histogram.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* AI Analysis Button */}
        <div className="pt-4">
          {!analysis && !loading && (
            <button
              onClick={handleAnalyze}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <BrainCircuit className="w-5 h-5" />
              生成即時分析
            </button>
          )}

          {loading && (
             <div className="w-full bg-gray-800 text-gray-400 font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-3 animate-pulse border border-gray-700">
               <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               掃描市場數據中...
             </div>
          )}

          {analysis && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-5 rounded-lg border flex items-center justify-between ${getSignalColor(analysis.signal)}`}>
                <div>
                  <span className="text-xs uppercase opacity-75 font-bold tracking-wider">AI 推薦操作</span>
                  <div className="text-3xl font-black tracking-tight">{getSignalText(analysis.signal)}</div>
                </div>
                {getSignalIcon(analysis.signal)}
              </div>

              {/* Real-time Context Box */}
              {marketContext && (
                <div className="bg-gray-800/80 p-4 rounded-lg border border-blue-900/50 shadow-inner">
                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> 市場即時快訊
                  </h4>
                  {marketContext.realTimePrice && (
                    <div className="mb-2 text-lg font-mono text-white">
                      即時報價: <span className="text-green-400">{marketContext.realTimePrice}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-300 italic mb-2">"{marketContext.newsSummary}"</p>
                  
                  {marketContext.sourceUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                       {marketContext.sourceUrls.map((url, i) => (
                         <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 bg-blue-900/20 px-2 py-1 rounded">
                           來源 {i+1} <ExternalLink className="w-2 h-2" />
                         </a>
                       ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                  技術面解讀
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {analysis.reasoning}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>信心指數</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${analysis.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-white">{analysis.confidence}%</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleAnalyze}
                className="w-full mt-2 text-sm text-gray-500 hover:text-white flex items-center justify-center gap-1 transition-colors"
              >
                重新整理分析 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
