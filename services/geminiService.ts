import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, OHLCData, TechnicalIndicators, TradeSignal, MarketContext, StockSymbol, NewsItem, CompanyProfile, InvestmentStrategy } from "../types";

// Helper to safely get env var from multiple possible sources (Vite, Process, or Window Shim)
const getApiKey = () => {
  // 1. Try global window shim (from import.js)
  // @ts-ignore
  if (typeof window !== 'undefined' && window.process && window.process.env && window.process.env.API_KEY) {
     // @ts-ignore
     const key = window.process.env.API_KEY;
     if (key && key !== "YOUR_API_KEY_HERE") return key;
  }

  // 2. Try Vite standard (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // ignore
  }

  // 3. Try Node.js standard
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {
     // ignore
  }
  
  return undefined;
};

const initGemini = () => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    console.error("CRITICAL ERROR: API_KEY is missing or default.");
    console.error("Please open 'import.js' and paste your Google Gemini API Key.");
    throw new Error("API Key not configured. Check import.js");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean JSON string (remove markdown code blocks)
const cleanJsonString = (text: string): string => {
  if (!text) return "";
  let clean = text.trim();
  // Remove ```json and ``` wrapping
  clean = clean.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  return clean;
};

// Resolve a user query (e.g., "Apple", "2330") to a Stock Symbol
export const lookupStockSymbol = async (query: string): Promise<StockSymbol | null> => {
  try {
    const ai = initGemini();
    const prompt = `
      Identify the major stock market symbol for the query: "${query}". 
      Prefer US listings if available, otherwise major global listings.
      
      Return a STRICT JSON object (no markdown) with:
      - symbol (e.g., "AAPL" or "TSM")
      - name (Company Name, keep it short)
      - sector (General sector, e.g., "Technology", translate sector to Traditional Chinese)
      
      If the query is invalid or not a public company, return null.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              name: { type: Type.STRING },
              sector: { type: Type.STRING }
            },
            required: ['symbol', 'name', 'sector']
          }
        }
    });

    const text = response.text;
    if (!text) {
      console.warn("Gemini returned empty text for symbol lookup.");
      return null;
    }

    try {
      const cleanText = cleanJsonString(text);
      return JSON.parse(cleanText) as StockSymbol;
    } catch (parseError) {
      console.error("JSON Parse Error in Lookup:", parseError, "Raw Text:", text);
      return null;
    }

  } catch (error) {
    console.error("Symbol Lookup Error:", error);
    return null;
  }
};

// Analyze Technicals (JSON mode)
export const analyzeStock = async (
  symbol: string,
  data: OHLCData[],
  indicators: TechnicalIndicators
): Promise<AIAnalysisResult> => {
  try {
    const ai = initGemini();
    const recentData = data.slice(-5); 
    
    const prompt = `
      You are an expert technical analyst. Analyze the following stock data for ${symbol}.
      
      Current Indicators:
      - RSI (14): ${indicators.rsi.toFixed(2)}
      - MACD Line: ${indicators.macd.macdLine.toFixed(4)}
      - Signal Line: ${indicators.macd.signalLine.toFixed(4)}
      - MACD Histogram: ${indicators.macd.histogram.toFixed(4)}

      Recent Price Action (Last 5 days):
      ${JSON.stringify(recentData, null, 2)}

      Determine a trading signal (BUY, SELL, or HOLD) based on standard technical analysis rules.
      Provide a concise reasoning and a confidence score (0-100).
      
      IMPORTANT: The "reasoning" MUST be written in Traditional Chinese (繁體中文).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            signal: {
              type: Type.STRING,
              enum: [TradeSignal.BUY, TradeSignal.SELL, TradeSignal.HOLD]
            },
            reasoning: {
              type: Type.STRING
            },
            confidence: {
              type: Type.NUMBER
            }
          },
          required: ['signal', 'reasoning', 'confidence']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const cleanText = cleanJsonString(text);
    const result = JSON.parse(cleanText) as AIAnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      signal: TradeSignal.HOLD,
      reasoning: "API 分析失敗，請檢查 import.js 設定。",
      confidence: 0
    };
  }
};

// Fetch Real-time Context using Google Search Grounding
export const fetchMarketContext = async (symbol: string): Promise<MarketContext> => {
  try {
    const ai = initGemini();
    
    const prompt = `
      Find the current real-time price for ${symbol} and the most important news headline from today.
      If the market is closed, get the last closing price.
      
      Format your answer exactly like this:
      PRICE: [Insert Price Here]
      NEWS: [Insert One Sentence News Summary Here in Traditional Chinese (繁體中文)]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    
    const sourceUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(c => c.web?.uri)
      .filter((u): u is string => !!u)
      .slice(0, 3) || []; 

    const priceMatch = text.match(/PRICE:\s*([\d,.]+)/);
    const newsMatch = text.match(/NEWS:\s*(.+)/);

    return {
      realTimePrice: priceMatch ? priceMatch[1].trim() : undefined,
      newsSummary: newsMatch ? newsMatch[1].trim() : text,
      sourceUrls
    };

  } catch (error) {
    console.error("Gemini Search Error:", error);
    return {
      newsSummary: "無法取得即時資訊 (請檢查 API Key)",
      sourceUrls: []
    };
  }
};

export const getRealTimePriceNumber = async (symbol: string): Promise<number | null> => {
  try {
     const ai = initGemini();
     const prompt = `Find the current stock price of ${symbol}. Return ONLY the number (e.g., 142.50). Do not include currency symbols or text.`;
     
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text?.trim() || "";
    const cleanText = text.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleanText);
    return isNaN(price) ? null : price;

  } catch (error) {
    console.warn("Failed to fetch numeric price", error);
    return null;
  }
}

// Fetch Detailed News List
export const fetchStockNews = async (symbol: string): Promise<NewsItem[]> => {
  try {
    const ai = initGemini();
    const prompt = `
      Find 6 latest news articles for ${symbol} stock.
      Format the output as a valid JSON array of objects. 
      Each object should have keys: "title", "summary", "source", "time" (e.g. '2 hours ago').
      
      IMPORTANT: "title" and "summary" MUST be translated to Traditional Chinese (繁體中文).
      Do not include markdown code blocks. Just the JSON string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    
    // Robust Regex to find JSON array [ ... ]
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("No JSON array found in response", text);
      return [];
    }

    const items = JSON.parse(jsonMatch[0]) as NewsItem[];
    
    // Attach grounding URLs if available (approximate mapping)
    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(c => c.web?.uri)
      .filter((u): u is string => !!u) || [];

    // Distribute URLs to items just so they have something clickable
    return items.map((item, index) => ({
      ...item,
      url: urls[index % urls.length] || '#'
    }));

  } catch (error) {
    console.error("News Fetch Error:", error);
    return [];
  }
};

// Fetch Company Profile
export const fetchCompanyProfile = async (symbol: string): Promise<CompanyProfile | null> => {
  try {
    const ai = initGemini();
    const prompt = `
      Get company details for ${symbol}.
      Format the output as a valid JSON object with keys:
      "description" (short bio), "ceo", "founded" (year), "headquarters", "employees", 
      "marketCap", "peRatio", "dividendYield", "website".
      If data is unavailable, use "N/A".
      
      IMPORTANT: "description" MUST be translated to Traditional Chinese (繁體中文).
      Do not include markdown code blocks. Just the JSON string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    
    // Robust Regex to find JSON object { ... }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    return JSON.parse(jsonMatch[0]) as CompanyProfile;

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return null;
  }
};

// Fetch Investment Strategy
export const fetchInvestmentStrategy = async (symbol: string, currentPrice: number, data: OHLCData[]): Promise<InvestmentStrategy | null> => {
  try {
    const ai = initGemini();
    const recentData = data.slice(-20); 
    
    const prompt = `
      Act as an AGGRESSIVE Hedge Fund Manager.
      Analyze ${symbol} for a High-Risk/High-Reward investment plan.
      Current Price: ${currentPrice}.
      Recent Data: ${JSON.stringify(recentData)}.
      
      Calculate a Risk/Reward Ratio (e.g., 1:3).
      Estimate Win Rate % based on trend strength.
      Identify 3 Price Scenarios: Bearish (Support break), Base (Realistic), Bullish (Moonshot).
      Identify 3-4 Catalyst events (e.g. Earnings, Sector rotation, Macro).

      Return a JSON object (no markdown) with this EXACT structure:
      {
        "action": "BUY" | "SELL" | "WAIT",
        "actionTitle": "Aggressive Title (Traditional Chinese)",
        "longTermTrend": "BULLISH" | "BEARISH" | "NEUTRAL",
        "entryZone": "Price range (e.g. $140 - $145)",
        "takeProfit": "Primary Target (e.g. $180)",
        "stopLoss": "Stop Price (e.g. $120)",
        "riskRewardRatio": "String (e.g. 1 : 3.5)",
        "winRate": Number (0-100),
        "catalysts": ["String 1", "String 2", "String 3"],
        "scenarios": {
           "bearish": "Price string (e.g. $110)",
           "base": "Price string (e.g. $175)",
           "bullish": "Price string (e.g. $210)"
        },
        "timeHorizon": "String (e.g. 3-6個月)",
        "riskLevel": "String (e.g. 極高風險)",
        "rationale": "Detailed analysis in Traditional Chinese (approx 100 words)"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
         tools: [{ googleSearch: {} }] 
      }
    });

    const text = response.text || "";
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    return JSON.parse(jsonMatch[0]) as InvestmentStrategy;

  } catch (error) {
    console.error("Strategy Fetch Error:", error);
    return null;
  }
};