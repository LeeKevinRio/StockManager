export interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSymbol {
  symbol: string;
  name: string;
  sector: string;
  alertPrice?: number; // 使用者設定的價位通知
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
}

export enum TradeSignal {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD'
}

export interface AIAnalysisResult {
  signal: TradeSignal;
  reasoning: string;
  confidence: number;
}

export interface MarketContext {
  realTimePrice?: string;
  newsSummary: string;
  sourceUrls: string[];
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  time: string;
  url?: string;
}

export interface CompanyProfile {
  description: string;
  ceo: string;
  founded: string;
  headquarters: string;
  employees: string;
  marketCap: string;
  peRatio: string;
  dividendYield: string;
  website: string;
}

export interface InvestmentStrategy {
  action: 'BUY' | 'SELL' | 'WAIT';
  actionTitle: string; 
  longTermTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  entryZone: string; 
  takeProfit: string;
  stopLoss: string;
  timeHorizon: string;
  riskLevel: string;
  rationale: string;
  
  // New High-Level Metrics
  riskRewardRatio: string; // e.g. "1 : 4.5"
  winRate: number; // e.g. 65 (percent)
  catalysts: string[]; // List of driving factors
  scenarios: {
    bearish: string; // Worst case price
    base: string;    // Realistic target
    bullish: string; // Moonshot target
  };
}
