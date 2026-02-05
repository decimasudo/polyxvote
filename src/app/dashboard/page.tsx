"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PixelBackground from '@/components/PixelBackground';
import { 
  Terminal, 
  ExternalLink, 
  ArrowLeft, 
  BarChart2,
  Clock
} from 'lucide-react';

interface AlphaLog {
  id: number;
  market_title: string;
  market_slug: string;
  chill_analysis: string;
  odds: number;
  created_at: string;
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<AlphaLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Countdown
  const [timeLeft, setTimeLeft] = useState("CALCULATING...");

  // Fetch Feed Logic
  const fetchFeed = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('alpha_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => { 
    fetchFeed(); 
    
    // --- LOGIKA HITUNG MUNDUR (Countdown) ---
    const updateCountdown = () => {
      const now = new Date();
      // Target: Jam 00:00 UTC Besok (Sesuai jadwal Cron)
      const target = new Date(now);
      target.setUTCHours(24, 0, 0, 0); 
      
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("REFRESHING...");
      } else {
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}H ${minutes}M`);
      }
    };

    // Jalankan sekali saat load
    updateCountdown();
    // Update setiap 1 menit (60000ms)
    const timer = setInterval(updateCountdown, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen text-black font-mono selection:bg-blue-200 relative overflow-x-hidden">
      <PixelBackground /> 

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-4 border-black px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
             <button className="w-10 h-10 bg-gray-100 flex items-center justify-center border-2 border-black shadow-hard-sm hover:translate-y-1 hover:shadow-none transition-none">
                <ArrowLeft size={20} />
             </button>
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 border-2 border-black flex items-center justify-center text-white animate-pulse">
                <Terminal size={20} />
             </div>
             <div>
                <h1 className="text-xl font-bold uppercase tracking-tighter hidden md:block">
                  Daily<span className="text-blue-600">Top6</span>
                </h1>
                <span className="text-[10px] font-bold text-gray-500 md:hidden">DAILY 6</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Status Indicator (Updated with State) */}
          <div className="flex items-center gap-2 px-3 py-2 bg-black text-white border-2 border-black shadow-hard-sm">
             <Clock size={14} className="animate-spin-slow" />
             <span className="text-[10px] font-bold uppercase w-24 text-center">
                RESETS IN {timeLeft}
             </span>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Intro Banner */}
        <div className="mb-8 p-4 bg-yellow-400 border-4 border-black shadow-hard text-center">
           <p className="text-xs md:text-sm font-bold uppercase">
              ★ TODAY'S CURATED ALPHA. FRESHLY GENERATED. ★
           </p>
        </div>

        {/* Loading State */}
        {loading && logs.length === 0 && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-64 bg-white border-4 border-black shadow-hard animate-pulse flex items-center justify-center">
                    <span className="text-xs font-bold">`{'>'}` FETCHING DAILY 6...</span>
                </div>
              ))}
           </div>
        )}

        {/* FEED GRID (Fixed 6 Items) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map((log) => (
            <article key={log.id} className="flex flex-col bg-white border-4 border-black shadow-hard hover:-translate-y-2 transition-transform duration-200 h-full">
              
              {/* CARD HEADER */}
              <div className="p-5 border-b-2 border-black bg-blue-50 flex-grow">
                 <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[10px] font-bold text-blue-600 uppercase border border-blue-200 bg-white px-2 py-1">
                       Daily Pick
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                       {new Date(log.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                 </div>
                 
                 <a href={`https://polymarket.com/event/${log.market_slug}`} target="_blank" className="group">
                    <h3 className="font-bold text-lg leading-tight uppercase group-hover:text-blue-600 transition-colors line-clamp-3">
                       {log.market_title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs font-bold text-gray-500 group-hover:underline">
                       <BarChart2 size={12} />
                       Source
                    </div>
                 </a>
              </div>

              {/* CARD BODY */}
              <div className="p-5 flex flex-col gap-4">
                 
                 {/* Split Odds Bar */}
                 <div className="w-full h-7 flex border-2 border-black text-[10px] font-bold uppercase leading-none shadow-[2px_2px_0_0_#000]">
                     <div 
                        className="bg-blue-600 text-white h-full flex items-center pl-2 overflow-hidden whitespace-nowrap transition-all duration-500"
                        style={{ width: `${log.odds}%`, borderRight: log.odds < 100 ? '2px solid black' : 'none' }}
                     >
                        {log.odds > 15 && `YES ${log.odds}%`}
                     </div>
                     <div className="bg-red-500 text-white flex-1 h-full flex items-center justify-end pr-2 overflow-hidden whitespace-nowrap">
                        {100 - log.odds > 15 && `NO ${100 - log.odds}%`}
                     </div>
                 </div>

                 {/* Chill Analysis */}
                 <div className="bg-gray-100 p-3 border-2 border-black text-xs leading-relaxed font-bold text-gray-800 lowercase">
                    <span className="text-blue-600 mr-2">`{'>'}`</span>
                    {log.chill_analysis}
                 </div>
              </div>

              {/* CARD FOOTER */}
              <div className="p-4 border-t-2 border-black bg-gray-50 mt-auto">
                 <a 
                    href="https://x.com/polyxvote" 
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white text-xs font-bold uppercase border-2 border-black shadow-hard-sm hover:bg-blue-600 hover:shadow-none hover:translate-y-1 transition-all"
                 >
                    <ExternalLink size={14} /> Vote on X
                 </a>
              </div>

            </article>
          ))}
        </div>
        
      </main>
    </div>
  );
}