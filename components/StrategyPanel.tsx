import React, { useEffect, useState } from 'react';
import { InvestmentStrategy, OHLCData } from '../types';
import { fetchInvestmentStrategy } from '../services/geminiService';
import { Loader2, Target, ShieldAlert, Clock, TrendingUp, TrendingDown, AlertTriangle, Zap, Flame, Ban, Scale, Lightbulb, Layers } from 'lucide-react';

interface StrategyPanelProps {
  symbol: string;
  currentPrice: number;
  data: OHLCData[];
}

const StrategyPanel: React.FC<StrategyPanelProps> = ({ symbol, currentPrice, data }) => {
  const [strategy, setStrategy] = useState<InvestmentStrategy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadStrategy = async () => {
      setLoading(true);
      if (data.length > 0) {
        const result = await fetchInvestmentStrategy(symbol, currentPrice, data);
        if (isMounted) {
          setStrategy(result);
          setLoading(false);
        }
      } else {
         setLoading(false);
      }
    };
    loadStrategy();
    return () => { isMounted = false; };
  }, [symbol, currentPrice, data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-500" />
        <p className="text-lg font-medium text-gray-300">正在運算多重情境模型...</p>
        <p className="text-sm text-gray-500 mt-2">分析盈虧比、催化劑與風險係數</p>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertTriangle className="w-12 h-12 mb-2 opacity-30" />
        <p>目前無法生成策略建議，請稍後再試。</p>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    if (action === 'BUY') return 'from-green-900 to-green-950 border-green-600 text-green-100';
    if (action === 'SELL') return 'from-red-900 to-red-950 border-red-600 text-red-100';
    return 'from-yellow-900 to-yellow-950 border-yellow-600 text-yellow-100';
  };
  
  const getActionIcon = (action: string) => {
    if (action === 'BUY') return <Zap className="w-8 h-8 text-green-400 fill-current" />;
    if (action === 'SELL') return <Flame className="w-8 h-8 text-red-500 fill-current" />;
    return <Ban className="w-8 h-8 text-yellow-400" />;
  };

  const getTrendBadge = (trend: string) => {
    if (trend === 'BULLISH') return (
        <div className="flex items-center gap-1 bg-green-900/50 text-green-400 px-3 py-1 rounded-full border border-green-800 shadow-sm text-xs font-bold">
            <TrendingUp className="w-4 h-4" /> 長期看多
        </div>
    );
    if (trend === 'BEARISH') return (
        <div className="flex items-center gap-1 bg-red-900/50 text-red-400 px-3 py-1 rounded-full border border-red-800 shadow-sm text-xs font-bold">
            <TrendingDown className="w-4 h-4" /> 長期看空
        </div>
    );
    return (
        <div className="flex items-center gap-1 bg-gray-700 text-gray-300 px-3 py-1 rounded-full border border-gray-600 shadow-sm text-xs font-bold">
            <TrendingUp className="w-4 h-4 rotate-90" /> 趨勢不明
        </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-y-auto max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-purple-400" />
          <div>
             <h2 className="text-2xl font-bold text-white">AI 避險基金策略報告</h2>
             <p className="text-gray-400 text-sm">高風險情境模擬 / 盈虧比運算</p>
          </div>
        </div>
        {getTrendBadge(strategy.longTermTrend)}
      </div>

      {/* Main Signal Card */}
      <div className={`rounded-xl border-2 overflow-hidden mb-8 shadow-2xl bg-gradient-to-br ${getActionColor(strategy.action)}`}>
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-5">
             <div className="p-4 bg-black/20 rounded-full backdrop-blur-sm shadow-inner">
               {getActionIcon(strategy.action)}
             </div>
             <div>
               <p className="text-sm font-bold opacity-80 mb-1 tracking-widest uppercase">Action Signal</p>
               <h3 className="text-4xl font-black tracking-tighter">{strategy.actionTitle}</h3>
             </div>
           </div>
           
           {/* Win Rate & R/R Box */}
           <div className="flex gap-4">
             <div className="text-right bg-black/20 p-3 rounded-lg backdrop-blur-sm min-w-[100px]">
               <div className="flex items-center justify-end gap-1 mb-1 opacity-70">
                 <Scale className="w-3 h-3" />
                 <span className="text-xs uppercase font-bold">盈虧比</span>
               </div>
               <p className="text-xl font-mono font-bold tracking-tight">{strategy.riskRewardRatio}</p>
             </div>
             <div className="text-right bg-black/20 p-3 rounded-lg backdrop-blur-sm min-w-[100px]">
               <div className="flex items-center justify-end gap-1 mb-1 opacity-70">
                 <Target className="w-3 h-3" />
                 <span className="text-xs uppercase font-bold">預估勝率</span>
               </div>
               <p className="text-xl font-mono font-bold tracking-tight">{strategy.winRate}%</p>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Scenario Analysis (Left Col) */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Scenario Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bearish */}
              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                 <span className="text-gray-500 text-xs font-bold uppercase mb-2">悲觀情境 (Bear)</span>
                 <p className="text-2xl font-mono text-red-400 font-bold">{strategy.scenarios?.bearish || 'N/A'}</p>
                 <span className="text-[10px] text-gray-500 mt-1">跌破支撐</span>
              </div>
              {/* Base */}
              <div className="bg-gray-800 border-2 border-blue-900/50 p-4 rounded-lg flex flex-col items-center justify-center text-center relative shadow-lg">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Target</div>
                 <span className="text-blue-300 text-xs font-bold uppercase mb-2">基本目標 (Base)</span>
                 <p className="text-3xl font-mono text-white font-bold">{strategy.scenarios?.base || strategy.takeProfit}</p>
                 <span className="text-[10px] text-gray-400 mt-1">合理估值</span>
              </div>
              {/* Bullish */}
              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                 <span className="text-yellow-500 text-xs font-bold uppercase mb-2">樂觀情境 (Bull)</span>
                 <p className="text-2xl font-mono text-green-400 font-bold">{strategy.scenarios?.bullish || 'N/A'}</p>
                 <span className="text-[10px] text-gray-500 mt-1">趨勢爆發</span>
              </div>
           </div>

           {/* Analysis Text */}
           <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
               <Clock className="w-5 h-5 text-purple-400" /> 操盤手觀點
             </h3>
             <p className="text-gray-300 leading-relaxed text-lg tracking-wide">
               {strategy.rationale}
             </p>
           </div>
        </div>

        {/* Info Column (Right Col) */}
        <div className="space-y-6">
          
          {/* Catalysts */}
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
             <h4 className="text-gray-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
               <Lightbulb className="w-4 h-4 text-yellow-500" /> 驅動催化劑 (Catalysts)
             </h4>
             <ul className="space-y-3">
               {strategy.catalysts?.map((cat, i) => (
                 <li key={i} className="flex gap-2 text-sm text-gray-300">
                   <span className="text-blue-500 font-bold">•</span>
                   {cat}
                 </li>
               )) || <li className="text-gray-500 text-sm">無特定催化劑</li>}
             </ul>
          </div>

          {/* Trade Setup */}
          <div className="bg-gray-900 p-5 rounded-xl border border-dashed border-gray-700">
             <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">交易設定 (Setup)</h4>
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-400">進場區間</span>
                 <span className="font-mono text-white font-bold">{strategy.entryZone}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-400">停損價格</span>
                 <span className="font-mono text-red-400 font-bold">{strategy.stopLoss}</span>
               </div>
               <div className="w-full h-px bg-gray-800 my-2"></div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-400">風險等級</span>
                 <span className={`text-xs px-2 py-1 rounded font-bold ${strategy.riskLevel.includes('高') ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'}`}>
                   {strategy.riskLevel}
                 </span>
               </div>
             </div>
          </div>

        </div>
      </div>
      
       <div className="mt-4 p-4 rounded-lg bg-red-900/10 border border-red-900/20 text-center">
          <p className="text-[10px] text-red-400/60 leading-tight">
            高風險投資警語：本策略由 AI 模擬基金經理人視角，數據僅供參考。盈虧比與勝率為預估值，並非獲利保證。請嚴格執行風險控制。
          </p>
        </div>
    </div>
  );
};

export default StrategyPanel;
