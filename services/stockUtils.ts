import { OHLCData, TechnicalIndicators } from '../types';

// Helper to get a fallback price if API fails
export const getFallbackPrice = (symbol: string): number => {
  switch(symbol) {
    case 'TSLA': return 350.0;
    case 'NVDA': return 135.0; 
    case 'AAPL': return 230.0;
    case 'GOOGL': return 180.0;
    case 'MSFT': return 420.0;
    case 'AMZN': return 210.0;
    case 'AMD': return 160.0;
    case 'NFLX': return 850.0;
    default: return 100.0;
  }
};

// Mock Data Generator that anchors to a specific "Current Price"
export const generateMockData = (symbol: string, days: number = 100, targetCurrentPrice?: number): OHLCData[] => {
  const data: OHLCData[] = [];
  
  // Use provided target or fallback
  const finalPrice = targetCurrentPrice || getFallbackPrice(symbol);
  
  // We generate data backwards from the final price to ensure the chart ends exactly at the current price
  let price = finalPrice;
  const now = new Date();
  
  // Seed random for consistency in demo
  let seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Generate temporal data first
  const tempList: { open: number, close: number, high: number, low: number, volume: number, date: string }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    // Volatility logic
    const volatility = price * 0.02;
    // We want the previous day's close. 
    // If today is `price`, yesterday was `price / (1 + change)` roughly.
    // Let's just do a random walk backwards.
    const changePercent = (random() - 0.5) * 0.03; // +/- 1.5%
    const prevClose = price / (1 + changePercent);
    
    // For the current candle (i):
    // Open is roughly prevClose (gap possible)
    const open = prevClose + (random() - 0.5) * volatility * 0.2;
    const close = price;
    
    const high = Math.max(open, close) + random() * volatility * 0.6;
    const low = Math.min(open, close) - random() * volatility * 0.6;
    const volume = Math.floor(random() * 1000000) + 500000;

    tempList.push({
      date: date.toISOString().split('T')[0],
      open, high, low, close, volume
    });

    // Set price for next iteration (which is the previous day in time)
    price = prevClose;
  }

  // Reverse so oldest is first
  const reversed = tempList.reverse();
  
  // Return formatted
  return reversed.map(d => ({
    date: d.date,
    open: parseFloat(d.open.toFixed(2)),
    high: parseFloat(d.high.toFixed(2)),
    low: parseFloat(d.low.toFixed(2)),
    close: parseFloat(d.close.toFixed(2)),
    volume: d.volume
  }));
};

// Simple RSI Calculation
export const calculateRSI = (data: OHLCData[], period: number = 14): number => {
  if (data.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  // Calculate initial average
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Simple MACD Calculation (12, 26, 9)
export const calculateMACD = (data: OHLCData[]): TechnicalIndicators['macd'] => {
  const closePrices = data.map(d => d.close);
  
  const ema = (period: number, prices: number[]) => {
    const k = 2 / (period + 1);
    let emaVal = prices[0];
    const emaArray = [emaVal];
    for (let i = 1; i < prices.length; i++) {
      emaVal = prices[i] * k + emaVal * (1 - k);
      emaArray.push(emaVal);
    }
    return emaArray;
  };

  const ema12 = ema(12, closePrices);
  const ema26 = ema(26, closePrices);

  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  
  const signalLine = macdLine * 0.9;

  return {
    macdLine,
    signalLine,
    histogram: macdLine - signalLine
  };
};

export const getLatestIndicators = (data: OHLCData[]): TechnicalIndicators => {
  return {
    rsi: calculateRSI(data),
    macd: calculateMACD(data)
  };
};
