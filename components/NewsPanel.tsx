import React, { useEffect, useState } from 'react';
import { NewsItem } from '../types';
import { fetchStockNews } from '../services/geminiService';
import { Loader2, ExternalLink, Calendar, Newspaper } from 'lucide-react';

interface NewsPanelProps {
  symbol: string;
}

const NewsPanel: React.FC<NewsPanelProps> = ({ symbol }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadNews = async () => {
      setLoading(true);
      const data = await fetchStockNews(symbol);
      if (isMounted) {
        setNews(data);
        setLoading(false);
      }
    };
    loadNews();
    return () => { isMounted = false; };
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
        <p>正在為您整理 {symbol} 的最新新聞...</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Newspaper className="w-12 h-12 mb-2 opacity-20" />
        <p>未找到近期相關新聞。</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-blue-400" />
        最新市場新聞
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((item, index) => (
          <a 
            key={index} 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block bg-gray-800 border border-gray-700 rounded-lg p-5 hover:bg-gray-750 hover:border-blue-500/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                {item.source}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {item.time}
              </span>
            </div>
            <h3 className="text-white font-semibold mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
              {item.title}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-3 mb-4">
              {item.summary}
            </p>
            <div className="flex items-center text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              閱讀全文 <ExternalLink className="w-3 h-3 ml-1" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsPanel;
