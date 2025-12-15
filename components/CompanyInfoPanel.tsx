import React, { useEffect, useState } from 'react';
import { CompanyProfile } from '../types';
import { fetchCompanyProfile } from '../services/geminiService';
import { Loader2, Building2, Users, Globe, Briefcase, MapPin, DollarSign, TrendingUp, Percent } from 'lucide-react';

interface CompanyInfoPanelProps {
  symbol: string;
}

const CompanyInfoPanel: React.FC<CompanyInfoPanelProps> = ({ symbol }) => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      const data = await fetchCompanyProfile(symbol);
      if (isMounted) {
        setProfile(data);
        setLoading(false);
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
        <p>正在查詢 {symbol} 的公司資料...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>暫無公司資訊。</p>
      </div>
    );
  }

  const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center gap-4">
      <div className="p-3 bg-gray-900 rounded-full text-blue-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
        <p className="text-white font-medium">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full overflow-y-auto max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{symbol}</h2>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
           <MapPin className="w-4 h-4" /> {profile.headquarters}
           <span className="mx-2">•</span>
           <Globe className="w-4 h-4" /> <a href={profile.website} target="_blank" rel="noreferrer" className="hover:text-blue-400">{profile.website}</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<DollarSign className="w-5 h-5"/>} label="市值 (Market Cap)" value={profile.marketCap} />
        <StatCard icon={<TrendingUp className="w-5 h-5"/>} label="本益比 (P/E)" value={profile.peRatio} />
        <StatCard icon={<Percent className="w-5 h-5"/>} label="殖利率 (Yield)" value={profile.dividendYield} />
        <StatCard icon={<Users className="w-5 h-5"/>} label="員工數" value={profile.employees} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" /> 公司簡介
            </h3>
            <p className="text-gray-300 leading-relaxed text-sm lg:text-base">
              {profile.description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700">
             <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">領導層</h3>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-blue-200 font-bold">
                 {profile.ceo.charAt(0)}
               </div>
               <div>
                 <p className="text-white font-medium">{profile.ceo}</p>
                 <p className="text-xs text-gray-500">執行長 (CEO)</p>
               </div>
             </div>
          </div>
          
           <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700">
             <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">歷史沿革</h3>
             <div className="flex items-center gap-3">
               <Briefcase className="w-5 h-5 text-green-400" />
               <div>
                 <p className="text-white font-medium">{profile.founded}</p>
                 <p className="text-xs text-gray-500">成立年份</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPanel;
