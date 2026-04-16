import React from 'react';
import { Leaf, TreeDeciduous, FileText, Wind, Zap, Share2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardStats } from '../types';

interface EcoTrackerProps {
  stats: DashboardStats;
}

const EcoTracker: React.FC<EcoTrackerProps> = ({ stats }) => {
  // Logic: 1 study hour saves roughly 10 sheets of paper (mock metric)
  const totalSheets = Math.floor((stats?.studyHours || 0) * 10);
  const co2Avoided = ((totalSheets * 0.005)).toFixed(2); // 5g per sheet
  const treesSaved = ((totalSheets / 500)).toFixed(2); // 500 sheets = 0.1 tree

  const data = [
    { month: 'Jan', paperSaved: 120 },
    { month: 'Feb', paperSaved: 250 },
    { month: 'Mar', paperSaved: 180 },
    { month: 'Apr', paperSaved: 320 },
    { month: 'Current', paperSaved: totalSheets },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      <header className="bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border-4 border-white/10">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-20 -translate-y-20 rotate-12">
           <Leaf size={400} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-400/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-green-300">
            <Zap size={12} fill="currentColor" /> Live Mission Tracking
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
            Your <span className="text-green-400">Eco Impact</span>
          </h1>
          <p className="text-green-100 text-lg opacity-80 max-w-xl font-medium leading-relaxed">
            By choosing digital education on EduFree.AI, you are actively preserving our ecosystem. 
            Every study session moves the needle for a greener planet.
          </p>
        </div>
      </header>
|
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Stats Cards */}
        <div className="space-y-6">
          {[
            { label: 'Paper Sheets Saved', value: totalSheets.toLocaleString(), icon: FileText, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', sub: 'Sheets of paper preserved' },
            { label: 'CO2 Emission Avoided', value: `${co2Avoided} kg`, icon: Wind, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', sub: 'Carbon footprint reduced' },
            { label: 'Equivalent Trees', value: treesSaved, icon: TreeDeciduous, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', sub: 'Full trees untouched' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
                <stat.icon size={120} />
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-inner`}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">{stat.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Visualization Chart */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border dark:border-slate-700 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="font-black text-2xl text-slate-800 dark:text-white">Savings Velocity</h3>
                   <p className="text-sm text-slate-500 font-medium">Monthly trajectory of paper preservation</p>
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-500 border dark:border-slate-800">
                    2026 OVERVIEW
                </div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorPaper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', background: '#0f172a', color: '#fff' }}
                    itemStyle={{ color: '#10b981', fontWeight: 800 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="paperSaved" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorPaper)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="space-y-2 relative z-10">
          <h3 className="text-2xl font-black">Join the Movement</h3>
          <p className="text-orange-100 opacity-90 max-w-xl font-medium">
            Every 500 sheets of paper saved is roughly equivalent to 0.1 tree. 
            You've already saved a portion of a forest! Share your impact with friends.
          </p>
        </div>
        <button className="whitespace-nowrap bg-white text-orange-600 px-10 py-4 rounded-2xl font-black hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 relative z-10 shadow-lg">
          <Share2 size={24} /> SHARE IMPACT
        </button>
      </div>
    </div>
  );
};

export default EcoTracker;