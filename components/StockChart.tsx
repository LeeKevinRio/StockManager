import React, { useEffect, useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { OHLCData } from '../types';

interface StockChartProps {
  data: OHLCData[];
  symbol: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-xl text-sm">
        <p className="font-bold text-gray-300 mb-1">{label}</p>
        <p className="text-gray-400">開盤: <span className="text-white">{data.open}</span></p>
        <p className="text-gray-400">最高: <span className="text-white">{data.high}</span></p>
        <p className="text-gray-400">最低: <span className="text-white">{data.low}</span></p>
        <p className="text-gray-400">收盤: <span className={`font-mono ${data.close > data.open ? 'text-green-400' : 'text-red-400'}`}>{data.close}</span></p>
        <p className="text-gray-500 mt-1">量: {(data.volume / 1000).toFixed(1)}k</p>
      </div>
    );
  }
  return null;
};

const StockChart: React.FC<StockChartProps> = ({ data, symbol }) => {
  const minPrice = Math.min(...data.map(d => d.low)) * 0.98;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.02;

  return (
    <div className="h-full w-full bg-gray-900 rounded-lg p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">{symbol} - 股價走勢</h2>
        <div className="flex gap-2">
           <span className="flex items-center text-xs text-gray-400"><div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div> 收盤價</span>
           <span className="flex items-center text-xs text-gray-400"><div className="w-3 h-3 bg-gray-700 rounded-full mr-1"></div> 成交量</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af" 
              tick={{fontSize: 12}} 
              tickFormatter={(val) => val.slice(5)} // Show MM-DD
              minTickGap={30}
            />
            <YAxis 
              yAxisId="left" 
              domain={[minPrice, maxPrice]} 
              stroke="#9ca3af" 
              orientation="right"
              tick={{fontSize: 12}}
              tickFormatter={(val) => val.toFixed(0)}
            />
            {/* Volume Axis */}
            <YAxis 
              yAxisId="right" 
              orientation="left" 
              tick={false} 
              axisLine={false}
              domain={[0, 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Volume Bars */}
            <Bar yAxisId="right" dataKey="volume" barSize={20} fill="#374151" opacity={0.5} />
            
            {/* Price Line */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6 }}
            />
            
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="high" 
              stroke="transparent" 
              dot={false} 
            />
             <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="low" 
              stroke="transparent" 
              dot={false} 
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
