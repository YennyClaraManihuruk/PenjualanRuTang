import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, Package, DollarSign, Activity, Sparkles } from 'lucide-react';
import { getStrategicInsight } from '../services/geminiService';

// Data dalam Jutaan Rupiah untuk grafik
const salesData = [
  { name: 'Jan', actual: 60000, budget: 36000 },
  { name: 'Feb', actual: 45000, budget: 21000 },
  { name: 'Mar', actual: 30000, budget: 147000 },
  { name: 'Apr', actual: 41700, budget: 58000 },
  { name: 'Mei', actual: 28350, budget: 72000 },
  { name: 'Jun', actual: 35850, budget: 57000 },
  { name: 'Jul', actual: 52350, budget: 64500 },
];

const inventoryHealth = [
  { category: 'TV', fast: 85, slow: 15, stock: 120, status: 'Sehat' },
  { category: 'Kulkas', fast: 40, slow: 60, stock: 45, status: 'Berlebih' },
  { category: 'Audio', fast: 90, slow: 10, stock: 12, status: 'Stok Rendah' },
  { category: 'Laptop', fast: 70, slow: 30, stock: 200, status: 'Sehat' },
];

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

const KPICard: React.FC<{ title: string; value: string; trend: string; trendUp: boolean; icon: any; color: string }> = ({ title, value, trend, trendUp, icon: Icon, color }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className={`flex items-center text-sm font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trendUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {trend}
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  const generateInsight = async () => {
    setLoadingAi(true);
    const context = {
      kpi: {
        pendapatan: "Rp 63,7 Miliar",
        dso: "42 Hari",
        perputaranStok: "4.5x",
        piutangJatuhTempo: "Rp 1,2 Miliar"
      },
      kesehatanInventaris: inventoryHealth
    };
    const insight = await getStrategicInsight(context, 'DASHBOARD');
    setAiInsight(insight);
    setLoadingAi(false);
  };

  useEffect(() => {
    // Auto-generate insight on load for "Pro" feel
    generateInsight();
  }, []);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Eksekutif</h2>
          <p className="text-slate-400 mt-1">Tinjauan operasional & keuangan real-time.</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <select className="bg-transparent text-slate-300 text-sm px-3 py-1.5 focus:outline-none">
                <option>Semua Gudang</option>
                <option>HQ Jakarta</option>
                <option>Hub Surabaya</option>
            </select>
            <div className="w-px h-4 bg-slate-600"></div>
            <select className="bg-transparent text-slate-300 text-sm px-3 py-1.5 focus:outline-none">
                <option>Kuartal Ini</option>
                <option>Kuartal Lalu</option>
                <option>YTD (Awal Tahun)</option>
            </select>
        </div>
      </div>

      {/* AI Insight Bar */}
      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 flex items-start space-x-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1">
            <h4 className="text-indigo-300 font-semibold text-sm mb-1">Wawasan Strategis AI</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
                {loadingAi ? "Menganalisis data keuangan..." : aiInsight}
            </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Pendapatan (YTD)" value="Rp 63,7 M" trend="+12.5% vs Anggaran" trendUp={true} icon={DollarSign} color="indigo" />
        <KPICard title="DSO (Hari Penjualan)" value="42 Hari" trend="+3 Hari vs Bulan Lalu" trendUp={false} icon={Activity} color="rose" />
        <KPICard title="Perputaran Inventaris" value="8.2x" trend="+0.4x vs Target" trendUp={true} icon={Package} color="emerald" />
        <KPICard title="Piutang Jatuh Tempo (>90hr)" value="Rp 1,28 M" trend="-5% vs Bulan Lalu" trendUp={true} icon={AlertTriangle} color="amber" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Variance */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-semibold text-lg">Variansi Penjualan: Aktual vs Anggaran</h3>
            <span className="text-xs font-medium text-slate-400 px-2 py-1 bg-slate-700/50 rounded">Dalam Jutaan (Rp)</span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    cursor={{fill: '#334155', opacity: 0.2}}
                    formatter={(value) => formatRupiah(value as number * 1000000)}
                />
                <Bar dataKey="actual" fill="#6366f1" radius={[4, 4, 0, 0]} name="Aktual" />
                <Bar dataKey="budget" fill="#334155" radius={[4, 4, 0, 0]} name="Anggaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Health Matrix */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Matriks Kesehatan Inventaris</h3>
          <div className="space-y-4">
            {inventoryHealth.map((item, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium text-sm">{item.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.status === 'Sehat' ? 'bg-emerald-500/10 text-emerald-400' :
                    item.status === 'Berlebih' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex h-3 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="bg-indigo-500 h-full" 
                        style={{ width: `${item.fast}%` }}
                        title="Fast Moving"
                    ></div>
                    <div 
                        className="bg-slate-500 h-full" 
                        style={{ width: `${item.slow}%` }}
                        title="Slow Moving"
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                    <span>Fast Moving ({item.fast}%)</span>
                    <span>Slow Moving ({item.slow}%)</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Valuasi</span>
                <span className="text-white font-bold">Rp 27,6 M</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-400">Peringatan Stok</span>
                <span className="text-rose-400 font-medium">3 Barang Kritis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;